import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UploadedFiles, Put, Req, UseGuards, Query } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { AvailabilityDto, CreateDoctorDto, DeleteScheduleDto, DoctorConformationDto, DoctorSearchDto, FindOptionDto, ScheduleDto, UpdateScheduleDto } from './dto/doctor.dto';
import { UpdateDoctorDto } from './dto/update.doctor.dto';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UploadFileS3 } from 'src/common/interceptors/upload-file.interceptor';
import { toMG } from 'src/common/utility/function.utils';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SwaggerEnums } from 'src/common/enums/swagger.enum';
import { CheckOtpDto, CreateOtpDto, SendOtpDto } from '../auth/dto/auth.dto';
import { AuthService } from '../auth/auth.service';
import { Request } from 'express';
import { AuthGuard } from '../auth/guard/auth.guard';
import { role } from 'src/common/enums/role.enum';
import { Pagination } from 'src/common/decorators/pagination.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

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
  @ApiOperation({summary : "doctors signup section"})
  @ApiResponse({
    status: 201,
    description: "after sending verification code successfully",
    example: {
      message: "کد تایید ارسال شد.",
    },
  })
  @ApiResponse({
    status: 409,
    description: "if the doctor is already registered",
    example: {
      "message": ".با این شماره تلفن قبلا ثبت نام کرده اید",
      "error": "Conflict",
      "statusCode": 409
    }
  })
  signup(@Body() otpDto : CreateOtpDto) {
    return this.authService.signup(otpDto, "doctor")
  }

  @ApiConsumes(SwaggerEnums.Multipart)
  @Post("signup-step2:mobile")
  @ApiOperation({summary : "complete the doctor's profile"})
  @ApiResponse({
    status : 201,
    description : "if the signup was successful",
    example : {
      "accessTokenValue": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidHlwZSI6ImRvY3RvciIsIm1vYmlsZSI6IjA5MTAwMDAwMDAwIiwiaWF0IjoxNzM4NDA0Njk0LCJleHAiOjE3NDA5OTY2OTR9.2zKqKfyLzDEAimnzGezI0KcPb-iZRmhtWHGwVJpwbrc",
      "refreshTokenValue": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidHlwZSI6ImRvY3RvciIsIm1vYmlsZSI6IjA5MTAwMDAwMDAwIiwiaWF0IjoxNzM4NDA0Njk0LCJleHAiOjE3Njk5NjIyOTR9.VYpXkWd_T7lk0wcvpoLtf-X5i3p5QwwvxpNWg9-UNR4",
      "message": "اکانت شما با موفقیت ساخنه شد و در صف تایید  قرار گرفت"
    }
  })
  @ApiResponse({
    status: 401,
    description: "if the verification code  has expired or is incorrect",
    example: {
      message: "کد تایید نامعتبر میباشد.",
      error: "Unauthorized",
      statusCode: 401,
    },
  })
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
  @ApiOperation({ summary: "login doctors and sending otp code" })
  @ApiResponse({
    status: 201,
    description: "after sending verification code successfully",
    example: {
      message: "کد تایید ارسال شد.",
    },
  })
  @ApiResponse({
    status: 409,
    description: "if the verification code has not expired",
    example: {
      message: "کد تایید منقضی نشده است.",
      remain_time: "02:00",
    },
  })
  login(@Body() otpDto : SendOtpDto) {
      return this.authService.sendOtp(otpDto)
  }

  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Post("check-otp")
  @ApiOperation({ summary: "check doctor otp" })
  @ApiResponse({
    status: 201,
    description: "if the login was successful",
    example: {
      accessToken:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwidHlwZSI6InVzZXIiLCJtb2JpbGUiOiIwOTEwMDAwMDAwMCIsImlhdCI6MTczODI0ODIwOCwiZXhwIjoxNzQwODQwMjA4fQ.cgMZjsMXI-xQY8Hh-rj6PZNleTvBhfhmouMhFuI9ftA",
      refreshToken:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwidHlwZSI6InVzZXIiLCJtb2JpbGUiOiIwOTEwMDAwMDAwMCIsImlhdCI6MTczODI0ODIwOCwiZXhwIjoxNzY5ODA1ODA4fQ.nwVL253JZlN5rl9ImJ9woPZv5OTlB0CCXbjr-IuVZjY",
      message: "با موفقیت وارد اکانت خود شدید.",
    },
  })
  @ApiResponse({
    status: 401,
    description: "if the verification code  has expired or is incorrect",
    example: {
      message: "کد تایید نامعتبر میباشد.",
      error: "Unauthorized",
      statusCode: 401,
    },
  })
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  checkOtp(@Body() otpDto : CheckOtpDto) {
      return this.authService.checkOtp(otpDto,"doctor")
  }

  @ApiConsumes(SwaggerEnums.UrlEncoded)
  // @UseGuards(AuthGuard)
  // @Roles([role.ADMIN])
  @Post('schedule:docId')
  @ApiOperation({summary : "set schedule for doctors"})
  @ApiResponse({
    status : 201,
    description : "after successfully schedule setup",
    example : {
      "message": "زمانبندی تنظیم شد."
    }
  })
  @ApiResponse({
    status : 409,
    description : "if schedule already exists",
    example : {
      "message": "قبلا این تایم را ست کرده اید.",
      "error": "Conflict",
      "statusCode": 409
    }
  })
  schedule(
    @Param('docId') docId : string,
    @Body() scheduleDto : ScheduleDto
  ){
    return this.doctorsService.SetSchedule(+docId, scheduleDto)
  }

  // @Roles([role.ADMIN])
  @Get()
  @ApiOperation({
    summary: "search doctors",
    description: "you can find doctors with following options",
  })
  @ApiResponse({
    status: 200,
    description: "when doctors found",
    schema: {
      example: {
        "pagination": {
          "total_count": 11,
          "page": 0,
          "limit": "10",
          "skip": 0
        },
        "doctors": [
          {
            "id": 2,
            "first_name": "Pooua",
            "last_name": "Ebadollahi",
            "mobile": "09196715197",
            "mobile_verify": true,
            "categoryId": 1,
            "Medical_License_number": 12345,
            "national_code": "0310000000",
            "description": "not a doctor, i'm back-end developer",
            "status": "pending",
            "statusCheck_at": null,
            "disQualified_at": null,
            "reason": null,
            "role": "doctor",
            "created_at": "2025-02-01T15:58:03.753Z",
            "updated_at": "2025-02-02T19:39:47.006Z",
            "otp": null,
            "expires_in": null,
            "image": null,
            "availability": true,
            "clinicId": null
          }
        ]
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "when no result found",
    schema: {
      example: {
        message: "نتیحه ای یافت نشد.",
        error: "Not Found",
        statusCode: 404,
      },
    },
  })
  @Pagination()
  find(
    @Query() paginationDto: PaginationDto,
    @Query() searchDto: DoctorSearchDto
  ) {
    return this.doctorsService.findDoctors(paginationDto, searchDto);
  }

  // @Roles(["admin"])
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Get('getSchedule:docId')
  @ApiOperation({summary : "get all doctors schedule"})
  @ApiResponse({
    status : 200,
    description : "when result found",
    schema : {
      example : [
        {
          "day": "شنبه",
          "details": [
            {
              "visitTime": "00:00",
              "price": "30000"
            }
          ]
        }
      ]
    }
  })
  @ApiResponse({
    status : 404,
    description : "if no schedule has been set for the doctor",
    example : {
      "message": "برای این پزشک هیچ زمانبندی یافت نشد",
      "error": "Not Found",
      "statusCode": 404
    }
  })
  getSchedule(@Param('docId') docId : string) {
    return this.doctorsService.getSchedule(+docId);
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
