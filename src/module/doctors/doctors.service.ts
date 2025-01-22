import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateDoctorDto, DoctorConformationDto, ScheduleDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DoctorEntity } from './entities/doctor.entity';
import { Like, Repository } from 'typeorm';
import { S3Service } from '../S3/S3.service';
import { role } from 'src/common/enums/role.enum';
import { AuthService } from '../auth/auth.service';
import { CategoryService } from '../category/category.service';
import { mobileValidation } from 'src/common/utility/mobile.utils';
import { statusEnum } from 'src/common/enums/status.enum';
import { ClinicDisQualificationDto } from '../clinic/dto/clinic.dto';
import { ScheduleEntity } from './entities/schedule.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(DoctorEntity) private doctorRepository : Repository<DoctorEntity>,
    @InjectRepository(ScheduleEntity) private scheduleRepository : Repository<ScheduleEntity>,
    private s3Service : S3Service,
    private authService : AuthService,
    private categoryService : CategoryService,
  ){}
  async create(createDoctorDto: CreateDoctorDto, image : Express.Multer.File[], mobile : string) {
    const { Medical_License_number, category, description, national_code, otp_code } = createDoctorDto
    const { phoneNumber } = mobileValidation(mobile)
    let accessTokenValue:string;
    let refreshTokenValue :string;
    const [doctor, existCheck, categoryExist]= await Promise.all([
      this.doctorRepository.findOneBy({mobile : phoneNumber}),
      this.doctorRepository.exists({ where : [
        { national_code },
        { Medical_License_number } 
        ]
      }),
      this.categoryService.findByTitle(category)
    ])
    if(existCheck){
      throw new ConflictException("این کدملی یا کد نظام پزشکی قبلا ثبت شده است")
    }
    if(doctor){
      if(doctor.mobile_verify){
        throw new ConflictException("شما ثبت نام خود را تکمیل کرده اید")
      }
      const {accessToken, refreshToken} =  await this.authService.checkOtp({code : otp_code, mobile}, "doctor")
      accessTokenValue = accessToken
      refreshTokenValue = refreshToken
      const { Location } = await this.s3Service.uploadFile(image[0],"Doctors")
      await this.doctorRepository.update({mobile : phoneNumber},{
        description,
        category : categoryExist.slug,
         image : Location,
         Medical_License_number, 
         national_code, 
         role : role.DOCTOR,
         mobile_verify : true
       })
    }else throw new UnauthorizedException("پزشک یافت نشد")
    return {
      accessTokenValue,
      refreshTokenValue,
      message : "اکانت شما با موفقیت ساخنه شد و در صف تایید  قرار گرفت"
      }

  }
  
  async findAll() {
    return await this.doctorRepository.find({})
  }
  async findOneByLicense(medical_license: string) {
    const doctor = await this.doctorRepository.findOne({
      where : {Medical_License_number : medical_license},
      relations : {clinic : true}
    })
    if(!doctor) throw new UnauthorizedException("doctor not found")
    return doctor
  }
  async findOneById(id: number) {
    const doctor = await this.doctorRepository.findOne({
      where : {id},
      // relations : {schedule : true} 
    })
    if(!doctor) throw new NotFoundException("پزشک یافت نشد")
    return doctor
  }
  async findOneByMobile(mobile: string) {
    const doctor = await this.doctorRepository.findOne({
      where : { mobile },
      relations : {clinic : true}
    })
    if(!doctor) throw new NotFoundException("پزشک یافت نشد")
    return doctor
  }

  async update(medical_license: string, updateDoctorDto: UpdateDoctorDto, image : Express.Multer.File[]) {
    const { mobile } = updateDoctorDto
    let updateData : any = {}
    await this.findOneByLicense(medical_license)
    for (const data in updateDoctorDto) {
      if(updateDoctorDto[data]){
        updateData[data] = updateDoctorDto[data]
      }
    }
    if(image){
      const { Location } = await this.s3Service.uploadFile(image[0], "Doctors")
      updateData.image = Location
    }
    if(mobile){
      const { phoneNumber } = mobileValidation(mobile)
      updateData.mobile = phoneNumber
    } 
    await this.doctorRepository.update({Medical_License_number : medical_license},{
      ...updateData
    })
    return {message : "doctor profile updated"} 
  }

  async remove(medical_license: string) {
    await this.findOneByLicense(medical_license)
    await this.doctorRepository.delete({Medical_License_number : medical_license})
    return {message : "doctor deleted successfully"}
  }
  async register(Medical_license : string ,doctorConformationDto : DoctorConformationDto){
    const { status , message} = doctorConformationDto
    if(status === statusEnum.REJECTED && !message){
      throw new BadRequestException("برای رد کردن توضیحات نمیتواند خالی باشد.")
    }
    let doctor = await this.findOneByLicense(Medical_license)
    doctor.status = status
    doctor.reason = message
    doctor.statusCheck_at = new Date()
    await this.doctorRepository.save(doctor)
    return {message : `تغیر کرد ${status} وضعیت کاربر به`}
  }
  async DisQualification(Medical_license : string ,disQualification : ClinicDisQualificationDto){
    const { status, message } = disQualification
    const clinic = await this.findOneByLicense(Medical_license)
    clinic.status = status
    clinic.reason = message
    clinic.disQualified_at = new Date()
    await this.doctorRepository.save(clinic)    
    return {message : "پزشک رد صلاحیت شد."}
  }
  async SetSchedule(id : number, scheduleDto : ScheduleDto){
    const { Day, Visit_Time } = scheduleDto
    await this.findOneById(id)
    const schedule = await this.scheduleRepository.findOne({
      where : {
      day : Day,
      doctorId : id
    }
    })
    if(schedule){
      const [hour, min] = Visit_Time.split(':').map(time=> +time)
      const visitTimes = schedule.visitTime.split(',')
      const setVisitTime = new Date().setUTCHours(hour,min,0,0)
      if(visitTimes.includes(Visit_Time)) throw new ConflictException("قبلا این تایم را ست کرده اید.")
        for(let time of visitTimes){
          let [scheduleHour, scheduleMin] = time.split(':').map(time=> +time)
          const setScheduleTime = new Date().setUTCHours(scheduleHour,scheduleMin,0,0)
          if(scheduleHour === hour || scheduleHour === hour + 1){
            let subtract = setVisitTime -setScheduleTime
            if(Math.abs(subtract) < 10 * 60 * 1000){
              return {message : "هر ویزیت نمیتواند کمتر از ۱۰ دقیقه باشد."}
            }
          }
      }
      schedule.visitTime += `,${Visit_Time}`
      await this.scheduleRepository.save(schedule)
    }else{
      await this.scheduleRepository.insert({
        doctorId : id,
        day : Day,
        visitTime : Visit_Time,
      })
    }
    return {message : "زمانبندی تنظیم شد."}
  }
}
