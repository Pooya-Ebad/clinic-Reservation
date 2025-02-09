import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AvailabilityDto, CreateDoctorDto, DeleteScheduleDto, DoctorConformationDto, DoctorSearchDto, FindOptionDto, ScheduleDto, UpdateScheduleDto } from './dto/doctor.dto';
import { UpdateDoctorDto } from './dto/update.doctor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DoctorEntity } from './entities/doctor.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { S3Service } from '../S3/S3.service';
import { role } from 'src/common/enums/role.enum';
import { AuthService } from '../auth/auth.service';
import { CategoryService } from '../category/category.service';
import { mobileValidation } from 'src/common/utility/mobile.utils';
import { statusEnum } from 'src/common/enums/status.enum';
import { ClinicDisQualificationDto } from '../clinic/dto/clinic.dto';
import { ScheduleEntity } from './entities/schedule.entity';
import { checkTime, pagination, PaginationGenerator } from 'src/common/utility/function.utils';
import { AvailabilityEnum } from 'src/common/enums/availabilityEnum';
import { findOptionsEnum } from 'src/common/enums/findOption.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { isDate } from 'class-validator';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(DoctorEntity)
    private doctorRepository: Repository<DoctorEntity>,
    @InjectRepository(ScheduleEntity)
    private scheduleRepository: Repository<ScheduleEntity>,
    private s3Service: S3Service,
    private authService: AuthService,
    private categoryService: CategoryService
  ) {}
  
  async create(
    createDoctorDto: CreateDoctorDto,
    image: Express.Multer.File[],
    mobile: string
  ) {
    const {
      Medical_License_number,
      category,
      description,
      national_code,
      otp_code,
    } = createDoctorDto;
    const { phoneNumber } = mobileValidation(mobile);
    let accessTokenValue: string;
    let refreshTokenValue: string;
    const [doctor, existCheck, categoryExist] = await Promise.all([
      this.doctorRepository.findOneBy({ mobile: phoneNumber }),
      this.doctorRepository.exists({
        where: [{ national_code }, { Medical_License_number }],
      }),
      this.categoryService.findByTitle(category),
    ]);
    if (existCheck) {
      throw new ConflictException(
        "این کدملی یا کد نظام پزشکی قبلا ثبت شده است"
      );
    }
    if (doctor) {
      if (doctor.mobile_verify) {
        throw new ConflictException("شما ثبت نام خود را تکمیل کرده اید");
      }
      const { accessToken, refreshToken } = await this.authService.checkOtp(
        { code: otp_code, mobile },
        "doctor"
      );
      accessTokenValue = accessToken;
      refreshTokenValue = refreshToken;
      const { Location } = await this.s3Service.uploadFile(image[0], "Doctors");
      await this.doctorRepository.update(
        { mobile: phoneNumber },
        {
          description,
          categoryId: categoryExist.id,
          image: Location,
          Medical_License_number,
          national_code,
          role: role.DOCTOR,
          mobile_verify: true,
        }
      );
    } else throw new UnauthorizedException("پزشک یافت نشد");
    return {
      accessTokenValue,
      refreshTokenValue,
      message: "اکانت شما با موفقیت ساخنه شد و در صف تایید  قرار گرفت",
    };
  }

  async findDoctors(paginationDto: PaginationDto, searchDto: DoctorSearchDto) {
    const { search, mobile, status, availability, from_date, to_date } =
      searchDto;
    const { page, limit, skip } = pagination(paginationDto);
    const query = this.doctorRepository.createQueryBuilder("doctors");

    if (mobile) {
      query.andWhere("doctors.mobile = :mobile", { mobile });
    }
    if (status) {
      query.andWhere("doctors.status = :status", { status });
    }
    if (availability) {
      query.andWhere("doctors.availability = :availability", { availability });
    }
    if (
      to_date &&
      from_date &&
      isDate(new Date(from_date)) &&
      isDate(new Date(to_date))
    ) {
      let from = new Date(new Date(from_date).setUTCHours(0, 0, 0));
      let to = new Date(new Date(to_date).setUTCHours(0, 0, 0));
      query.andWhere("doctors.created_at BETWEEN :from AND :to", { from, to });
    } else if (from_date && isDate(new Date(from_date))) {
      let from = new Date(new Date(from_date).setUTCHours(0, 0, 0));
      query.andWhere("doctors.created_at >= :from", { from });
    } else if (to_date && isDate(new Date(to_date))) {
      let to = new Date(new Date(to_date).setUTCHours(0, 0, 0));
      query.andWhere("doctors.created_at <= :to", { to });
    }
    if (search && search.length >= 3) {
      query.andWhere(
        "doctors.first_name LIKE :search OR doctors.last_name LIKE :search",
        { search: `%${search}%` }
      );
    } else if (search && search.length < 3) {
      throw new BadRequestException(
        "تعداد کاراکتر های سرچ نمیتواند کمتر از ۳ کاراکتر باشد."
      );
    }
    query.take(limit);
    query.skip(skip);
    query.orderBy("doctors.created_at", "DESC");
    const [doctors, count] = await query.getManyAndCount();
    if (doctors.length == 0) throw new NotFoundException("نتیحه ای یافت نشد.");
    return {
      pagination: PaginationGenerator(page, limit, count),
      doctors,
    };
  }

  async findOneBy(findOption: FindOptionDto) {
    const { Find_Option, Value } = findOption;
    let where: FindOptionsWhere<DoctorEntity> = {};
    if (Find_Option === findOptionsEnum.Id) where["id"] = +Value;
    if (Find_Option === findOptionsEnum.Medical_License)
      where["Medical_License_number"] = Value;
    if (Find_Option === findOptionsEnum.Mobile) where["mobile"] = Value;
    const doctor = await this.doctorRepository.findOne({
      where,
    });
    if (!doctor) throw new NotFoundException("پزشک یافت نشد.");
    return doctor;
  }

  async update(
    medical_license: string,
    updateDoctorDto: UpdateDoctorDto,
    image: Express.Multer.File
  ) {
    const { mobile } = updateDoctorDto;
    let updateData: any = {};
    await this.findOneBy({
      Find_Option: findOptionsEnum.Medical_License,
      Value: medical_license,
    });
    for (const data in updateDoctorDto) {
      if (updateDoctorDto[data]) {
        updateData[data] = updateDoctorDto[data];
      }
    }
    if (image) {
      const { Location } = await this.s3Service.uploadFile(image[0], "Doctors");
      updateData.image = Location;
    }
    if (mobile) {
      const { phoneNumber } = mobileValidation(mobile);
      updateData.mobile = phoneNumber;
    }
    await this.doctorRepository.update(
      { Medical_License_number: medical_license },
      {
        ...updateData,
      }
    );
    return { message: "پروفایل پزشک با موفقیت آپدیت شد" };
  }

  async remove(medical_license: string) {
    await this.findOneBy({
      Find_Option: findOptionsEnum.Medical_License,
      Value: medical_license,
    });
    await this.doctorRepository.delete({
      Medical_License_number: medical_license,
    });
    return { message: "پزشک با موفقیت حذف شد" };
  }

  async register(
    medical_license: string,
    doctorConformationDto: DoctorConformationDto
  ) {
    const { status, message } = doctorConformationDto;
    if (status === statusEnum.REJECTED && !message) {
      throw new BadRequestException(
        "برای رد کردن, توضیحات نمیتواند خالی باشد."
      );
    }
    let doctor = await this.findOneBy({
      Find_Option: findOptionsEnum.Medical_License,
      Value: medical_license,
    });
    doctor.status = status;
    doctor.reason = message;
    doctor.statusCheck_at = new Date();
    await this.doctorRepository.save(doctor);
    return { message: `تغیر کرد ${status} وضعیت کاربر به` };
  }

  async setAvailability(
    medical_license: string,
    availabilityDto: AvailabilityDto
  ) {
    const { Availability } = availabilityDto;
    let doctor = await this.findOneBy({
      Find_Option: findOptionsEnum.Medical_License,
      Value: medical_license,
    });
    const toBoolean =
      Availability === AvailabilityEnum.Available ? true : false;
    doctor.availability = toBoolean;
    await this.doctorRepository.save(doctor);
    return {
      message: `اکنون پزشک ${toBoolean ? "در دسترس" : "در تعطیلات"} میباشد`,
    };
  }

  async DisQualification(
    medical_license: string,
    disQualification: ClinicDisQualificationDto
  ) {
    const { status, message } = disQualification;
    const clinic = await this.findOneBy({
      Find_Option: findOptionsEnum.Medical_License,
      Value: medical_license,
    });
    clinic.status = status;
    clinic.reason = message;
    clinic.disQualified_at = new Date();
    await this.doctorRepository.save(clinic);
    return { message: "پزشک رد صلاحیت شد." };
  }

  async SetSchedule(id: number, scheduleDto: ScheduleDto) {
    const { Day, Visit_Time, price } = scheduleDto;
    if (+price < 30000)
      throw new BadRequestException(
        "حداقل مبلغ قاببل قبول ۳۰۰۰۰ تومان میباشد."
      );
    await this.findOneBy({
      Find_Option: findOptionsEnum.Id,
      Value: id.toString(),
    });
    const schedule = await this.scheduleRepository.findOne({
      where: {
        day: Day,
        doctorId: id,
      },
    });
    if (schedule) {
      const visitTimes = schedule.visitTime.split(",");
      if (visitTimes.includes(Visit_Time))
        throw new ConflictException("قبلا این تایم را ست کرده اید.");

      checkTime(visitTimes, Visit_Time, 10); // check that the new schedule is at least 10 minutes different

      schedule.visitTime += `${Visit_Time},`;
      schedule.price += `${price},`;
      await this.scheduleRepository.save(schedule);
    } else {
      await this.scheduleRepository.insert({
        doctorId: id,
        day: Day,
        visitTime: `${Visit_Time},`,
        price: `${price},`,
      });
    }
    return { message: "زمانبندی تنظیم شد." };
  }

  async getSchedule(id: number) {
    let doctor = await this.doctorRepository.findOne({
      where: { id },
      select: ["schedules", "id"],
      relations: { schedules: true },
    });
    if (!doctor) throw new NotFoundException("پزشک یافت نشد.");
    let schedule = doctor.schedules.map((schedule) => {
      let details = [];
      const visitTime = schedule.visitTime
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const price = schedule.price
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      for (let i = 0; i < visitTime.length; i++) {
        details.push({
          visitTime: visitTime[i],
          price: price[i],
        });
      }
      return {
        day: schedule.day,
        details,
      } as any;
    });
    if (schedule.length === 0)
      throw new NotFoundException("برای این پزشک هیچ زمانبندی یافت نشد");
    return schedule;
  }

  async getAppointment(id: number) {
    let doctor = await this.doctorRepository.findOne({
      where: { id },
      select: ["appointments", "id"],
      relations: { appointments: true },
    });
    if (!doctor) throw new UnauthorizedException("پزشک یافت نشد.");
    return doctor.appointments;
  }

  async updateSchedule(docId: number, updateSchedule: UpdateScheduleDto) {
    let { Day, Visit_Time, New_Visit_Time, New_Price } = updateSchedule;
    if (New_Price && +New_Price < 30000)
      throw new BadRequestException(
        "حداقل مبلغ قاببل قبول ۳۰۰۰۰ تومان میباشد."
      );
    let docSchedule = await this.getSchedule(docId);
    const schedule = await this.scheduleRepository.findOne({
      where: {
        day: Day,
        doctorId: docId,
      },
    });
    const visitList = schedule?.visitTime?.split(",");
    if (!schedule || !visitList?.includes(Visit_Time))
      throw new NotFoundException("زمانبندی مورد نظر یافت نشد.");

    visitList.length = visitList.length - 1;

    if (visitList.includes(New_Visit_Time))
      throw new ConflictException("قبلا این تایم را ست کرده اید.");
    checkTime(
      visitList.filter((value) => value != Visit_Time),
      New_Visit_Time,
      10
    );
    let times = "";
    let visit_price = "";

    docSchedule = docSchedule.map((schedule) => {
      if (schedule.day === Day) {
        schedule.details.map((detail) => {
          if (detail.visitTime === Visit_Time) {
            detail.visitTime = New_Visit_Time || detail.visitTime;
            detail.price = New_Price || detail.price;
            return schedule;
          }
        });
        return schedule;
      }
    });
    docSchedule.shift();
    for (let i = 0; i < docSchedule.length; i++) {
      for (let j = 0; j < docSchedule[i].details.length; j++) {
        times += `${docSchedule[i].details[j].visitTime},`;
        visit_price += `${docSchedule[i].details[j].price},`;
      }
    }
    schedule.visitTime = times;
    schedule.price = visit_price;
    await this.scheduleRepository.save(schedule);
    return { message: "زماتبندی ویزیت با موفقیت بروزرسانی شد" };
  }

  async deleteSchedule(deleteScheduleDto: DeleteScheduleDto) {
    const { Day, Visit_Time, doctorId } = deleteScheduleDto;
    const schedule = await this.scheduleRepository.findOne({
      where: {
        day: Day,
        doctorId,
      },
    });
    let visitList = schedule?.visitTime?.split(",");
    if (!schedule || !visitList?.includes(Visit_Time)) {
      throw new NotFoundException("کاربر و یا زمانبندی مورد نظر یافت نشد");
    }
    let priceList = schedule.price.split(",");
    for (let item of visitList) {
      if (item === Visit_Time) {
        let index = visitList.indexOf(item);
        visitList = visitList.filter((value) => value !== item);
        priceList.splice(index, 1);
      }
    }
    schedule.visitTime = visitList.join(",");
    schedule.price = priceList.join(",");
    await this.scheduleRepository.save(schedule);
    return { message: "زمانبدی مورد نظر با مفقیت پاک شد." };
  }

} 
