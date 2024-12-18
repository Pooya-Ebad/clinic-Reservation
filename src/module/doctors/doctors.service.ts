import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ChangeStatusDto, CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DoctorEntity } from './entities/doctor.entity';
import { Repository } from 'typeorm';
import { S3Service } from '../S3/S3.service';
import { role } from 'src/common/enums/role.enum';
import { AuthService } from '../auth/auth.service';
import { CategoryService } from '../category/category.service';
import { mobileValidation } from 'src/common/utility/mobile.utils';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(DoctorEntity) private doctorRepository : Repository<DoctorEntity>,
    private s3Service : S3Service,
    private authService : AuthService,
    private categoryService : CategoryService,
  ){}
  async create(createDoctorDto: CreateDoctorDto, image : Express.Multer.File, mobile : string) {
    const { Medical_License_number, category, description, national_code, otp_code } = createDoctorDto
    const { phoneNumber } = mobileValidation(mobile)
    let accessToken:string;
    let refreshToken :string;
    const [doctor, existCheck, categoryExist]= await Promise.all([
      this.doctorRepository.findOneBy({mobile : phoneNumber}),
      this.doctorRepository.exists({ where : [
        { national_code },
        { Medical_License_number } 
        ]
      }),
      await this.categoryService.findByTitle(category)
    ])
    console.log(existCheck);
    if(existCheck){
      throw new ConflictException("شما قبلا ثبت نام کرده اید")
    }
    if(doctor){
      if(doctor.mobile_verify){
        throw new ConflictException("شما ثبت نام خود را تکمیل کرده اید")
      }
      const {accessToken, refreshToken} =  await this.authService.checkOtp({code : otp_code, mobile}, "doctor")
      accessToken
      refreshToken
      const { Location } = await this.s3Service.uploadFile(image,"Doctors")
      await this.doctorRepository.update({mobile : phoneNumber},{
         category : categoryExist.slug,
         description,
         image : Location,
         Medical_License_number, 
         national_code, 
         role : role.DOCTOR,
         mobile_verify : true
       })
    }else throw new UnauthorizedException("doctor not found")
    return {
      accessToken,
      refreshToken,
      message : "اکانت شما با موفقیت ساخنه شد و در صف تایید  قرار گرفت"
      }

  }
  
  async findAll() {
    return await this.doctorRepository.find({})
  }
  async findOneByLicense(medical_license: string) {
    const doctor = await this.doctorRepository.findOneBy({Medical_License_number : medical_license})
    if(!doctor) throw new UnauthorizedException("doctor not found")
    return doctor
  }

  async update(medical_license: string, updateDoctorDto: UpdateDoctorDto, image : Express.Multer.File) {
    const { mobile } = updateDoctorDto
    let updateData : any = {}
    await this.findOneByLicense(medical_license)
    for (const data in updateDoctorDto) {
      if(updateDoctorDto[data]){
        updateData[data] = updateDoctorDto[data]
      }
    }
    if(image){
      const { Location } = await this.s3Service.uploadFile(image, "Doctors")
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
  async register(changeStatusDto : ChangeStatusDto){
    const { Medical_License_number, status , description} = changeStatusDto
    let doctor = await this.findOneByLicense(Medical_License_number)
    const date = new Date()
    doctor.status = status
    doctor.description = `${description}\n changed at ${date}`
    await this.doctorRepository.save(doctor)
    return {message : `تغیر کرد ${status} وضعیت کاربر به`}
  }
}
