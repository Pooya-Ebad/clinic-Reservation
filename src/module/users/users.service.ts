import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "./entities/user.entity";
import { Between, FindOptionsWhere, ILike, LessThanOrEqual, MoreThanOrEqual, Repository, } from "typeorm";
import { AppointmentDto, GetAppointmentDto, UpdateUserDto, UserSearchDto } from "./dto/user.dto";
import { mobileValidation } from "src/common/utility/mobile.utils";
import { DoctorsService } from "../doctors/doctors.service";
import { WeekDays } from "src/common/enums/week.days.enum";
import * as moment from "moment-jalaali";
import { AppointmentEntity } from "./entities/appointment.entity";
import { isDate } from "class-validator";
import { AppointmentStatusEnum, statusEnum } from "src/common/enums/status.enum";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { pagination, PaginationGenerator, } from "src/common/utility/function.utils";
import { findOptionsEnum } from "src/common/enums/findOption.enum";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(AppointmentEntity)
    private appointmentRepository: Repository<AppointmentEntity>,
    private readonly doctorService: DoctorsService
  ) {}
  
  async findUsers(paginationDto: PaginationDto, searchDto: UserSearchDto) {
    const { search, mobile, from_date, to_date } = searchDto;
    const { page, limit, skip } = pagination(paginationDto);
    const query = this.userRepository.createQueryBuilder("users");
    if (mobile) {
      query.andWhere("users.mobile = :mobile", { mobile });
    }
    if (
      to_date &&
      from_date &&
      isDate(new Date(from_date)) &&
      isDate(new Date(to_date))
    ) {
      let from = new Date(new Date(from_date).setUTCHours(0, 0, 0));
      let to = new Date(new Date(to_date).setUTCHours(0, 0, 0));
      query.andWhere("users.created_at BETWEEN :from AND :to", { from, to });
    } else if (from_date && isDate(new Date(from_date))) {
      let from = new Date(new Date(from_date).setUTCHours(0, 0, 0));
      query.andWhere("users.created_at >= :from", { from });
    } else if (to_date && isDate(new Date(to_date))) {
      let to = new Date(new Date(to_date).setUTCHours(0, 0, 0));
      query.andWhere("users.created_at <= :to", { to });
    }
    if (search && search.length >= 3) {
      query.andWhere(
        "users.first_name LIKE :search OR users.last_name LIKE :search",
        { search: `%${search}%` }
      );
    } else if (search && search.length < 3) {
      throw new BadRequestException(
        "تعداد کاراکتر های سرچ نمیتواند کمتر از ۳ کاراکتر باشد."
      );
    }
    query.take(limit);
    query.skip(skip);
    query.orderBy("users.created_at", "DESC");
    const [users, count] = await query.getManyAndCount();

    if (users.length == 0) throw new NotFoundException("نتیحه ای یافت نشد.");
    return {
      pagination: PaginationGenerator(page, limit, count),
      users,
    };
  }

  async findAppointment(id: number) {
    const appointment = await this.appointmentRepository.findOneBy({ id });
    if (!appointment) throw new NotFoundException("نوبت ویزیت یافت نشد.");
    return appointment;
  }

  async update(QueryMobile: string, updateUserDto: UpdateUserDto) {
    const { first_name, last_name, mobile } = updateUserDto;
    const { phoneNumber } = mobileValidation(QueryMobile);
    const user = await this.checkExistUser(phoneNumber);
    user.first_name = first_name || user.first_name;
    user.last_name = last_name || user.last_name;
    user.mobile = mobile || user.mobile;
    return await this.userRepository.save(user);
  }

  async remove(mobile: string) {
    await this.checkExistUser(mobile);
    const result = await this.userRepository.delete({ mobile });
    if (result.affected !== 1)
      throw new BadRequestException("مشکلی در هنگام حذف کاربر پیش آمد.");
    return { message: "کاربر با موفقیت حذف شد." };
  }

  async checkExistUser(mobile: string) {
    const user = await this.userRepository.findOne({ where: { mobile } });
    if (!user) {
      throw new NotFoundException("کاربر یافت نشد");
    }
    return user;
  }

  async checkExistUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { appointments: true },
    });
    if (!user) {
      throw new NotFoundException("کاربر یافت نشد");
    }
    return user;
  }

  async setAppointment(appointmentDto: AppointmentDto) {
    const { doctor_id, user_id, visit_day, visit_time } = appointmentDto;
    let date: string;
    let day: number;
    const [hour, min] = visit_time.split(":");
    const [user, doc, schedule, docAppointment] = await Promise.all([
      this.checkExistUserById(user_id),
      this.doctorService.findOneBy({Find_Option : findOptionsEnum.Id, Value : `${doctor_id}`}),
      this.doctorService.getSchedule(doctor_id),
      this.doctorService.getAppointment(doctor_id),
    ]);
    if(doc.status !== statusEnum.ACCEPTED || doc.availability === false)
      throw new BadRequestException("در حال حاضر دربافت ویزیت با این پزشک امکان پذیر نمیباشد")
    switch (visit_day) {
      case WeekDays.Saturday:
        day = 6;
        break;
      case WeekDays.Sunday:
        day = 7;
        break;
      case WeekDays.Monday:
        day = 1;
        break;
      case WeekDays.Tuesday:
        day = 2;
        break;
      case WeekDays.Wednesday:
        day = 3;
        break;
      case WeekDays.Thursday:
        day = 4;
        break;
      case WeekDays.Friday:
        day = 5;
        break;
    }
    const dayDifference = (day - new Date().getDay() + 7) % 7;
    const visit = moment();
    visit.add("days", dayDifference);
    visit.set("hour", hour);
    visit.set("minute", min);
    visit.set("second", 0);
    visit.set("millisecond", 0);
    date = visit.format("jYYYY/jMM/jDD HH:mm");
    const scheduleData = schedule.find(
      (schedule) => schedule.day === visit_day
    );
    const detail = scheduleData?.details?.find((schedule) => {
      return schedule.visitTime == visit_time;
    });
    if (!detail) throw new NotFoundException("این زمانبندی وجود ندارد.");
    const appointment = docAppointment?.find(
      (appointment) =>  
        (appointment.Visit_Date == date &&
          appointment.status === AppointmentStatusEnum.reserved) ||
        appointment.status === AppointmentStatusEnum.done
     
    )
    if (appointment)
      throw new ConflictException("این نوبت ویزیت قبلا رزو شده است.");
    if (
      user.appointments.find(
        (appointment) =>
          (
            appointment.Visit_Date === date &&
            appointment.status === AppointmentStatusEnum.reserved) ||
            appointment.status === AppointmentStatusEnum.pending
      )
    )
      throw new ConflictException("شما در این زمان نوبت ویزیت دیگری دارید.");
    if (user.wallet < detail.price)
      throw new ForbiddenException("مقدار کیف پول شما کافی نمیباشد.");
    const [nowDate, nowTime] = moment()
      .format("jYYYY/jMM/jDD HH:mm")
      .split(" ");
    let [currentHour, currentMin] = nowTime.split(":");
    if (
      scheduleData &&
      scheduleData.details.some((detail) => detail.visitTime === visit_time)
    ) {
      const [targetDate] = date.split(" ");
      if (
        nowDate == targetDate &&
        new Date().setHours(+hour, +min, 0, 0) < new Date().setHours(+currentHour, +currentMin, 0, 0)
      )
        throw new ConflictException("تاریخ این ویزیت گذشته است.");

      await this.appointmentRepository.insert({
        doctorId: doctor_id,
        userId: user_id,
        Visit_Date: date,
        price: detail.price,
      });
      return {
        message:
          ".نوبت با موفقیت رزرو شد. شما میتوانید با مراجعه به بخش پرداخت نسبت به نهایی کردن ویزیت خود اقدام کنید",
      };
    }
    return {
      message: "تاریخ ویزیت معتبر نمیباشد.",
    };
  }

  async getAppointment(mobile: string) {
    let user = await this.userRepository.findOne({
      where: { mobile },
      select: ["appointments", "id"],
      relations: { appointments: true },
    });
    if (!user) throw new NotFoundException("کاربر یافت نشد.");
    let appointment = user.appointments;
    if (appointment.length === 0)
      throw new NotFoundException("هیچ ویزیتی برای کاربر یافت نشد.");
    return appointment;
  }

  async payment(getAppointmentDto: GetAppointmentDto) {
    const { appointment_id, user_id } = getAppointmentDto;
    const [appointment, user] = await Promise.all([
      this.findAppointment(appointment_id),
      this.checkExistUserById(user_id),
    ]);
    if (appointment.status !== AppointmentStatusEnum.pending)
      throw new ConflictException("امکان پرداخت برای این ویزیت ممکن نمیباشد.");
    if (appointment.userId != user_id)
      throw new NotFoundException("اطلاعات کاربر و ویزیت هم خوانی ندارند.");
    appointment.payment = true;
    appointment.payment_date = new Date();
    appointment.status = AppointmentStatusEnum.reserved;
    user.wallet -= +appointment.price;
    await Promise.all([
      this.appointmentRepository.save(appointment),
      this.userRepository.save(user),
    ]);
    return { message: "پرداخت با موفقیت انجام شد." };
  }

  async cancelAppointment(cancelDto: GetAppointmentDto) {
    const { appointment_id, user_id } = cancelDto;
    let confirmation = false;
    let appointment: AppointmentEntity;
    const user = await this.checkExistUserById(user_id);
    const userAppointment = await this.getAppointment(user.mobile);
    for (const value of userAppointment) {
      if (value.id == appointment_id) {
        confirmation = true;
        appointment = value;
      }
    }
    if (!confirmation || appointment.status !== AppointmentStatusEnum.reserved)
      throw new NotFoundException(
        ".نوبت یافت نشد! از پرداخت هزینه ویزیت اطمینان حاصل کنید"
      );
    user.wallet += +appointment.price;
    await Promise.all([
      this.userRepository.save(user),
      this.appointmentRepository.save(appointment),
      this.appointmentRepository.update(
        { id: appointment_id },
        {
          payment: false,
          payment_date: null,
          status: AppointmentStatusEnum.canceled,
        }
      ),
    ]);
    return {
      message:
        "نوبت ویزیت با موفقیت کنسل شد و هزینه آن به کیف پول شما عودت داده شد.",
    };
  }

}
