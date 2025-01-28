import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UploadedFiles, Put, Req, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { AvailabilityDto, CreateDoctorDto, DeleteScheduleDto, DoctorConformationDto, FindOptionDto, ScheduleDto, UpdateScheduleDto } from './dto/doctor.dto';
import { UpdateDoctorDto } from './dto/update.doctor.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UploadFileS3 } from 'src/common/interceptors/upload-file.interceptor';
import { toMG } from 'src/common/utility/function.utils';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SwaggerEnums } from 'src/common/enums/swagger.enum';
import { CheckOtpDto, CreateOtpDto, SendOtpDto } from '../auth/dto/auth.dto';
import { AuthService } from '../auth/auth.service';
import { Request } from 'express';
import { AuthGuard } from '../auth/guard/auth.guard';
import { role } from 'src/common/enums/role.enum';

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

  @Post('schedule:docId')
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  schedule(
    @Param('docId') docId : string,
    @Body() scheduleDto : ScheduleDto
  ){
    return this.doctorsService.SetSchedule(+docId, scheduleDto)
  }

  @Post('optionalFind')
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  // @Roles(["admin"])
  findOptional(@Body() findOptions : FindOptionDto) {
    return this.doctorsService.findOneBy(findOptions);
  }

  @Get()
  @Roles(["admin"])
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get('getSchedule:id')
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  // @Roles(["admin"])
  getSchedule(@Param('id') id : string) {
    return this.doctorsService.getSchedule(+id);
  }

  @Get('getAppointment:id')
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  // @Roles(["admin"])
  getAppointment(@Param('id') id : string) {
    return this.doctorsService.getAppointment(+id);
  }

  @Patch('setAvailability:medical_license')
  // @Roles(["admin"])
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  setAvailability(
    @Param('medical_license') medical_license : string,
    @Body() Availability : AvailabilityDto 
  ) {
    return this.doctorsService.setAvailability(medical_license,Availability);
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
  
  @Patch('Schedule')
  // @UseGuards(AuthGuard)
  // @Roles([role.ADMIN, role.DOCTOR])
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  updateSchedule(
    @Body() updateScheduleDto : UpdateScheduleDto,
    @Req() request :Request
  ) {
    return this.doctorsService.updateSchedule(1, updateScheduleDto);
  }  

  @Put('update:Medical_license')
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
  
  @Delete('delete/doctor:Medical_license')
  @Roles(["admin"])
  removeDoc(@Param('Medical_license') medical_license: string) {
    return this.doctorsService.remove(medical_license);
  } 

  @Delete('delete/schedule')
  // @Roles(["admin"])
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  removeSchedule(
    @Body() deleteScheduleDto : DeleteScheduleDto,
  ) {
    return this.doctorsService.deleteSchedule(deleteScheduleDto);
  } 
}
