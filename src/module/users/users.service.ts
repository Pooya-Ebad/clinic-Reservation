import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { AppointmentDto, FindUserDto } from './dto/create-user.dto';
import { mobileValidation } from 'src/common/utility/mobile.utils';
import { DoctorsService } from '../doctors/doctors.service';
import { findOptionsEnum } from 'src/common/enums/findOption.enum';
import { WeekDays } from 'src/common/enums/week.days.enum';
import * as moment from 'moment-jalaali';
import { AppointmentEntity } from './entities/appointment.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private userRepository : Repository<UserEntity> ,
    @InjectRepository(AppointmentEntity) private appointmentRepository : Repository<AppointmentEntity> ,
    private readonly doctorService : DoctorsService
  ){}
  async findAll() {
    return await this.userRepository.find({})
  }
  async findOne(mobile : string) {
    const user = await this.checkExistUser(mobile)
    return user
  }
  
  async update(QueryMobile: string, updateUserDto: UpdateUserDto){
    const { first_name, last_name, mobile }= updateUserDto
    const { phoneNumber} = mobileValidation(QueryMobile)
    const user = await this.checkExistUser(phoneNumber)
    user.first_name = first_name||user.first_name
    user.last_name = last_name||user.last_name
    user.mobile = mobile||user.mobile
    return await this.userRepository.save(user)
  }
  
  async remove(mobile: string) {
    await this.checkExistUser(mobile)
    return await this.userRepository.delete({mobile})
  }
  async checkExistUser(mobile : string) {
    const user = await this.userRepository.findOne({where : {mobile}})
    if(!user){
      throw new UnauthorizedException("کاربر یافت نشد")
    }
    return user
  }
  async checkExistUserById(id : number) {
    const user = await this.userRepository.findOne({
      where : {id}, 
      relations : {appointments : true}
    })
    if(!user){
      throw new UnauthorizedException("کاربر یافت نشد")
    }
    return user
  }
async setAppointment(appointmentDto : AppointmentDto){
    const { doctorId, userId, visit_day, visit_time } = appointmentDto
    let date : string;
    let day : number;
    const  [hour, min ] = visit_time.split(':')
    const [ user , schedule, docAppointment ] = await Promise.all([
      this.checkExistUserById(userId),
      this.doctorService.getSchedule(doctorId),
      this.doctorService.getAppointment(doctorId)
    ])
    const [ nowDate, nowTime ] = moment().format('jYYYY/jMM/jDD HH:mm').split(' ')
    console.log(nowTime);
    const scheduleData = schedule.find(schedule=>schedule.day === visit_day);
    let [currentHour,currentMin]=nowTime.split(':')
    if(scheduleData && scheduleData.visitTime.includes(visit_time)){
      switch (visit_day) {
        case WeekDays.Saturday:
          day = 6
          break;
        case WeekDays.Sunday:
          day = 7
          break;
        case WeekDays.Monday:
          day = 1
          break;
        case WeekDays.Tuesday:
          day = 2
          break;
        case WeekDays.Wednesday:
          day = 3
          break;
        case WeekDays.Thursday:
          day = 4
          break;
        case WeekDays.Friday:
          day = 5
          break;
      }
      const dayDifference  = (day - (new Date().getDay()) + 7) % 7
      const visit = moment()
      visit.add( 'days', dayDifference);
      visit.set('hour', hour);
      visit.set('minute', min);
      visit.set('second', 0);
      visit.set('millisecond', 0);
      date = visit.format('jYYYY/jMM/jDD HH:mm')
      const [ targetDate, targetTime ] = date.split(' ')
    
      if(user.appointments.find(appointment=>appointment.Visit_Date === date)) 
        throw new ConflictException("شما در این زمان نوبت ویزیت دیگری دارید.")
      if(docAppointment.find(appointment=>appointment.Visit_Date === date && appointment.status === "reserved"))
        throw new ConflictException("این نوبت ویزیت قبلا رزو شده است.")
      if(nowDate == targetDate && new Date().setHours(+hour, +min,0,0) < new Date().setHours(+currentHour, +currentMin,0,0))
        throw new ConflictException("تاریخ این ویزیت گذشته است.")
      await this.appointmentRepository.insert({
        doctorId,
        userId,
        Visit_Date : date
      })
      return {
        message : ".نوبت با موفقیت رزرو شد. شما میتوانید با مراجعه به بخش پرداخت نسبت به نهایی کردن ویزیت خود اقدام کنید"
        
      }
    }
    return {
      message : "تاریخ ویزیت معتبر نمیباشد."
    }
  }
} 
