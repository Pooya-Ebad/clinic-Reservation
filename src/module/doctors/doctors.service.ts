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
    await this.categoryService.findById(+category)
    let doctor = await this.doctorRepository.findOneBy({mobile : phoneNumber})
    if(doctor){
      if(doctor.mobile_verify){
        throw new ConflictException("شما ثبت نام خود را تکمیل کرده اید")
      }
      const {accessToken, refreshToken} =  await this.authService.checkOtp({code : otp_code, mobile}, "doctor")
      accessToken
      refreshToken
      const { Location } = await this.s3Service.uploadFile(image,"Doctors")
      await this.doctorRepository.update({mobile : phoneNumber},{
         category,
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
    console.log("object");
    const {description,first_name,last_name, mobile, national_code} = updateDoctorDto
    let destination : string;
    const updateData : any = {}

    await this.findOneByLicense(medical_license)
    if(image){
      const { Location } = await this.s3Service.uploadFile(image, "Doctors")
      destination = Location
    }
    if(description) updateData.description = description
    if(first_name) updateData.first_name = first_name
    if(last_name) updateData.last_name = last_name
    if(national_code) updateData.national_code = national_code
    if(destination) updateData.image = destination
    if(mobile){
      const { phoneNumber } = mobileValidation(mobile)
      updateData.description = phoneNumber
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
    const { Medical_License_number, status } = changeStatusDto
    let doctor = await this.findOneByLicense(Medical_License_number)
    doctor.status = status
    await this.doctorRepository.save(doctor)
    return {message : `تغیر کرد ${status} وضعیت کاربر به`}
  }
}
