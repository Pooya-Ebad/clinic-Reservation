import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UploadedFiles, Put } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, DoctorConformationDto, ScheduleDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UploadFileS3 } from 'src/common/interceptors/upload-file.interceptor';
import { toMG } from 'src/common/utility/function.utils';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SwaggerEnums } from 'src/common/enums/swagger.enum';
import { CheckOtpDto, CreateOtpDto, SendOtpDto } from '../auth/dto/auth.dto';
import { AuthService } from '../auth/auth.service';

@ApiBearerAuth("Authorization")
@Controller('doctors')
@ApiTags("Doctors")
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly authService: AuthService
  ) {}
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Post("signup-step1")
  signup(@Body() otpDto : CreateOtpDto) {
    return this.authService.signup(otpDto, "doctor")
  }
  @Post("signup-step2:mobile")
  @ApiConsumes(SwaggerEnums.Multipart)
  @UseInterceptors(UploadFileS3("image"))
  create(
    @UploadedFiles(
      new ParseFilePipe({
        validators : [
          new MaxFileSizeValidator({maxSize : toMG(10)}),
          new FileTypeValidator({fileType : "image/(png|jpg|jpeg)"})
        ],
        fileIsRequired : false
      })
    ) image : Express.Multer.File[],
    @Body() createDoctorDto: CreateDoctorDto,
    @Param("mobile") mobile : string
  ) {
    return this.doctorsService.create(createDoctorDto, image, mobile);
  }
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Post("login")
  login(@Body() otpDto : SendOtpDto) {
      return this.authService.sendOtp(otpDto)
  }
  @Post("check-otp")
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  checkOtp(@Body() otpDto : CheckOtpDto) {
      return this.authService.checkOtp(otpDto,"doctor")
  }

  @Get()
  @Roles(["admin"])
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get('findByLicense:medical_license')
  @Roles(["admin"])
  findByLicense(@Param('medical_license') medical_license: string) {
    return this.doctorsService.findOneByLicense(medical_license);
  }
  @Get('findByMobile:mobile')
  @Roles(["admin"])
  findByMobile(@Param('mobile') mobile: string) {
    return this.doctorsService.findOneByMobile(mobile);
  }
  @Patch('update:Medical_license')
  @Roles(["admin"])
  @ApiConsumes(SwaggerEnums.Multipart)
  @UseInterceptors(UploadFileS3("image"))
  update(
    @UploadedFiles(
      new ParseFilePipe({
        validators : [
          new MaxFileSizeValidator({maxSize : toMG(10)}),
          new FileTypeValidator({fileType : "image/(png|jpg|jpeg)"})
        ],
        fileIsRequired : false
      })
    ) image : Express.Multer.File[],
    @Body() updateDoctorDto: UpdateDoctorDto,
    @Param('Medical_license') Medical_license : string
    ) {
      return this.doctorsService.update(Medical_license, updateDoctorDto, image);
  }
  @Delete(':Medical_license')
  @Roles(["admin"])
  remove(@Param('Medical_license') medical_license: string) {
    return this.doctorsService.remove(medical_license);
  } 
  @Patch('register:Medical_license')
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Roles(["admin"])
  register(
    @Param('Medical_license') Medical_license : string,
    @Body() doctorConformationDto: DoctorConformationDto
  ){
    return this.doctorsService.register(Medical_license ,doctorConformationDto);
  }
  @Put('schedule:id')
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  schedule(
    @Param('id') id : string,
    @Body() scheduleDto : ScheduleDto
  ){
    return this.doctorsService.SetSchedule(+id, scheduleDto)
  }
}
