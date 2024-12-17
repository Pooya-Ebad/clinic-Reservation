import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Req, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { ChangeStatusDto, CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UploadFileS3 } from 'src/common/interceptors/upload-file.interceptor';
import { toMG } from 'src/common/utility/function.utils';
import { query, Request, request } from 'express';
import { AuthGuard } from '../auth/guard/auth.guard';
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
  @Post("signup-step2:mobile")
  @ApiConsumes(SwaggerEnums.Multipart)
  @UseInterceptors(UploadFileS3("image"))
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators : [
          new MaxFileSizeValidator({maxSize : toMG(10)}),
          new FileTypeValidator({fileType : "image/(png|jpg|jpeg)"})
        ],
        fileIsRequired : false
      })
    ) image : Express.Multer.File,
    @Body() createDoctorDto: CreateDoctorDto,
    @Param("mobile") mobile : string
  ) {
    return this.doctorsService.create(createDoctorDto, image, mobile);
  }

  @Get()
  @Roles(["admin"])
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get(':medical_license')
  @Roles(["admin"])
  findByLicense(@Param('medical_license') medical_license: string) {
    return this.doctorsService.findOneByLicense(medical_license);
  }
  @Patch('update:Medical_license')
  @Roles(["admin"])
  @ApiConsumes(SwaggerEnums.Multipart)
  @UseInterceptors(UploadFileS3("image"))
  update(
    @UploadedFile(
      new ParseFilePipe({
        validators : [
          new MaxFileSizeValidator({maxSize : toMG(10)}),
          new FileTypeValidator({fileType : "image/(png|jpg|jpeg)"})
        ],
        fileIsRequired : false
      })
    ) image : Express.Multer.File,
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
  @Patch('register')
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Roles(["admin"])
  register(@Body() changeStatusDto: ChangeStatusDto) {
    return this.doctorsService.register(changeStatusDto);
  } 
}
