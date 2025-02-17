import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UploadedFiles, Put, UseGuards, Query, NotFoundException } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { AvailabilityDto, CreateDoctorDto, DeleteScheduleDto, DoctorConformationDto, DoctorSearchDto, ScheduleDto, UpdateScheduleDto } from './dto/doctor.dto';
import { UpdateDoctorDto } from './dto/update.doctor.dto';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UploadFileS3 } from 'src/common/interceptors/upload-file.interceptor';
import { toMG } from 'src/common/utility/function.utils';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SwaggerEnums } from 'src/common/enums/swagger.enum';
import { CheckOtpDto, CreateOtpDto, SendOtpDto } from '../auth/dto/auth.dto';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { role } from 'src/common/enums/role.enum';
import { Pagination } from 'src/common/decorators/pagination.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiBearerAuth("Authorization")
@Controller("doctors")
@UseGuards(AuthGuard)
@ApiTags("Doctors")
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly authService: AuthService
  ) {}
  
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Post("signup-step1")
  @ApiOperation({ summary: "doctors signup section" })
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
      message: ".با این شماره تلفن قبلا ثبت نام کرده اید",
      error: "Conflict",
      statusCode: 409,
    },
  })
  signup(@Body() otpDto: CreateOtpDto) {
    return this.authService.signup(otpDto, "doctor");
  }

  @ApiConsumes(SwaggerEnums.Multipart)
  @Post("signup-step2:mobile")
  @ApiOperation({ summary: "complete the doctor's profile" })
  @ApiResponse({
    status: 201,
    description: "if the signup was successful",
    example: {
      accessTokenValue:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidHlwZSI6ImRvY3RvciIsIm1vYmlsZSI6IjA5MTAwMDAwMDAwIiwiaWF0IjoxNzM4NDA0Njk0LCJleHAiOjE3NDA5OTY2OTR9.2zKqKfyLzDEAimnzGezI0KcPb-iZRmhtWHGwVJpwbrc",
      refreshTokenValue:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidHlwZSI6ImRvY3RvciIsIm1vYmlsZSI6IjA5MTAwMDAwMDAwIiwiaWF0IjoxNzM4NDA0Njk0LCJleHAiOjE3Njk5NjIyOTR9.VYpXkWd_T7lk0wcvpoLtf-X5i3p5QwwvxpNWg9-UNR4",
      message: "اکانت شما با موفقیت ساخنه شد و در صف تایید  قرار گرفت",
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
  @UseInterceptors(UploadFileS3("image"))
  create(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: toMG(10) }),
          new FileTypeValidator({ fileType: "image/(png|jpg|jpeg)" }),
        ],
        fileIsRequired: false,
      })
    )
    image: Express.Multer.File[],
    @Body() createDoctorDto: CreateDoctorDto,
    @Param("mobile") mobile: string
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
  login(@Body() otpDto: SendOtpDto) {
    return this.authService.sendOtp(otpDto);
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
  checkOtp(@Body() otpDto: CheckOtpDto) {
    return this.authService.checkOtp(otpDto, "doctor");
  }

  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Roles([role.ADMIN])
  @Post("schedule:docId")
  @ApiOperation({ summary: "set schedule for doctors" })
  @ApiResponse({
    status: 201,
    description: "after successfully schedule setup",
    example: {
      message: "زمانبندی تنظیم شد.",
    },
  })
  @ApiResponse({
    status: 409,
    description: "if schedule already exists",
    example: {
      message: "قبلا این تایم را ست کرده اید.",
      error: "Conflict",
      statusCode: 409,
    },
  })
  schedule(@Param("docId") docId: string, @Body() scheduleDto: ScheduleDto) {
    return this.doctorsService.SetSchedule(+docId, scheduleDto);
  }

  @Roles([role.ADMIN])
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
        pagination: {
          total_count: 11,
          page: 0,
          limit: "10",
          skip: 0,
        },
        doctors: [
          {
            id: 2,
            first_name: "Pooya",
            last_name: "Ebadollahi",
            mobile: "09196715197",
            mobile_verify: true,
            categoryId: 1,
            Medical_License_number: 12345,
            national_code: "0310000000",
            description: "not a doctor, i'm back-end developer",
            status: "pending",
            statusCheck_at: null,
            disQualified_at: null,
            reason: null,
            role: "doctor",
            created_at: "2025-02-01T15:58:03.753Z",
            updated_at: "2025-02-02T19:39:47.006Z",
            otp: null,
            expires_in: null,
            image: null,
            availability: true,
            clinicId: null,
          },
        ],
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
  async find(
    @Query() paginationDto: PaginationDto,
    @Query() searchDto: DoctorSearchDto
  ) {
    const result = await this.doctorsService.findDoctors(paginationDto, searchDto);
    if (result.doctors.length == 0) throw new NotFoundException("نتیحه ای یافت نشد.");
    return result;
  }

  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Roles([role.ADMIN])
  @Get("getSchedules:docId")
  @ApiOperation({ summary: "get all doctors schedules" })
  @ApiResponse({
    status: 200,
    description: "when result found",
    schema: {
      example: [
        {
          day: "شنبه",
          details: [
            {
              visitTime: "00:00",
              price: "30000",
            },
          ],
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: "if no schedule has been set for the doctor",
    example: {
      message: "برای این پزشک هیچ زمانبندی یافت نشد",
      error: "Not Found",
      statusCode: 404,
    },
  })
  getSchedule(@Param("docId") docId: string) {
    return this.doctorsService.getSchedule(+docId);
  }

  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Roles([role.ADMIN])
  @Get("getAppointments:docId")
  @ApiOperation({ summary: "get all doctors appointments" })
  @ApiResponse({
    status: 200,
    description: "when result found",
    example: [
      {
        id: 1,
        doctorId: 1,
        userId: 1,
        Visit_Date: "1403/11/27 00:00",
        price: "30000",
        status: "pending",
        created_at: "2025-02-09T19:20:06.228Z",
        payment: false,
        payment_date: null,
      },
    ],
  })
  @ApiResponse({
    status: 404,
    description: "if no appointment has been set for the doctor",
    example: {
      message: "هیج نوبت ویزیتی برای پزشک یافت نشد",
      error: "Not Found",
      statusCode: 404,
    },
  })
  async getAppointment(@Param("docId") docId: string) {
    const appointment = await this.doctorsService.getAppointment(+docId);
    if (appointment.length === 0)
      throw new NotFoundException("هیج نوبت ویزیتی برای پزشک یافت نشد");
    return appointment;
  }

  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Roles([role.ADMIN])
  @Patch("register:Medical_license")
  @ApiOperation({
    summary: "change doctors status",
    description: "you must write a reason for rejection",
  })
  @ApiResponse({
    status: 200,
    description: "if operation was successful",
    example: {
      message: "تغیر کرد accepted / rejected وضعیت کاربر به",
    },
  })
  @ApiResponse({
    status: 404,
    description: "if no doctor was found",
    example: {
      message: "پزشک یافت نشد.",
      error: "Not Found",
      statusCode: 404,
    },
  })
  @ApiParam({
    name: "Medical_license",
    type: String,
    example: "12345",
  })
  register(
    @Param("Medical_license") Medical_license: string,
    @Body() doctorConformationDto: DoctorConformationDto
  ) {
    return this.doctorsService.register(Medical_license, doctorConformationDto);
  }

  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Roles([role.ADMIN])
  @Patch("setAvailability:Medical_license")
  @ApiOperation({ summary: "you can set doctors availability" })
  @ApiResponse({
    status: 200,
    description: "if operation was successful",
    example: {
      message: "اکنون پزشک در دسترس / تعطیلات میباشد",
    },
  })
  @ApiResponse({
    status: 404,
    description: "if no doctor was found",
    example: {
      message: "پزشک یافت نشد.",
      error: "Not Found",
      statusCode: 404,
    },
  })
  @ApiParam({
    name: "Medical_license",
    type: String,
    example: "12345",
  })
  setAvailability(
    @Param("Medical_license") medical_license: string,
    @Body() Availability: AvailabilityDto
  ) {
    return this.doctorsService.setAvailability(medical_license, Availability);
  }

  @Roles([role.ADMIN])
  @Patch("set-appointment-done:appointment_id")
  @ApiOperation({summary : "after a successful visit, this API can be used to complete the visit"})
  @ApiResponse({
    status : 200,
    description: "if operation was successful",
    example : {
      "message": "ویزیت با موفقیت انجام شد."
    }
  })
  @ApiResponse({
    status : 404,
    description : "if no visit was found",
    example : {
      "message": "ویزیت یافت نشد.",
      "error": "Not Found",
      "statusCode": 404
    }
  })
  doneAppointment(
    @Param('appointment_id') Appointment_ID : string
  ){
    return this.doctorsService.doneAppointment(+Appointment_ID)
  }
  
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Roles([role.ADMIN])
  @Patch("update/Schedule:docId")
  @ApiOperation({ summary: "change schedule information" })
  @ApiResponse({
    status: 200,
    description: "if operation was successful",
    example: {
      message: "زماتبندی ویزیت با موفقیت بروزرسانی شد.",
    },
  })
  @ApiResponse({
    status: 404,
    description: "if no schedule found for doctor",
    example: {
      message: "برای این پزشک هیچ زمانبندی یافت نشد",
      error: "Not Found",
      statusCode: 404,
    },
  })
  @ApiResponse({
    status: 409,
    description: "if the new schedule has already been set",
    example: {
      message: "قبلا این تایم را ست کرده اید.",
      error: "Conflict",
      statusCode: 409,
    },
  })
  updateSchedule(
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Param("docId") docId: string
  ) {
    return this.doctorsService.updateSchedule(+docId, updateScheduleDto);
  }

  @ApiConsumes(SwaggerEnums.Multipart)
  @Roles([role.ADMIN])
  @Put("update:Medical_license")
  @ApiOperation({ summary: "update doctor information" })
  @ApiResponse({
    status: 200,
    description: "if operation was successful",
    example: {
      message: "پروفایل پزشک با موفقیت آپدیت شد",
    },
  })
  @ApiResponse({
    status: 404,
    description: "if no doctor was found",
    example: {
      message: "پزشک یافت نشد.",
      error: "Not Found",
      statusCode: 404,
    },
  })
  @ApiParam({
    name: "Medical_license",
    type: String,
    example: "12345",
  })
  @UseInterceptors(UploadFileS3("image"))
  update(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: toMG(10) }),
          new FileTypeValidator({ fileType: "image/(png|jpg|jpeg)" }),
        ],
        fileIsRequired: false,
      })
    )
    image: Express.Multer.File,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @Param("Medical_license") Medical_license: string
  ) {
    console.log(image);
    return this.doctorsService.update(Medical_license, updateDoctorDto, image);
  }

  @Roles([role.ADMIN])
  @Delete("delete/doctor:Medical_license")
  @ApiOperation({ summary: "delete doctors information's" })
  @ApiResponse({
    status: 200,
    description: "if operation was successful",
    example: {
      message: "پزشک با موفقیت حذف شد",
    },
  })
  @ApiResponse({
    status: 404,
    description: "if no doctor was found",
    example: {
      message: "پزشک یافت نشد.",
      error: "Not Found",
      statusCode: 404,
    },
  })
  @ApiParam({
    name: "Medical_license",
    type: String,
    example: "12345",
  })
  removeDoc(@Param("Medical_license") medical_license: string) {
    return this.doctorsService.remove(medical_license);
  }

  @Roles([role.ADMIN])
  @Delete("delete/schedule")
  @ApiOperation({ summary: "delete doctors schedules" })
  @ApiResponse({
    status: 200,
    description: "if operation was successful",
    example: {
      message: "زمانبدی مورد نظر با مفقیت پاک شد.",
    },
  })
  @ApiResponse({
    status: 404,
    description: "if no schedule was found",
    example: {
      message: "کاربر و یا زمانبندی مورد نظر یافت نشد",
      error: "Not Found",
      statusCode: 404,
    },
  })
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  removeSchedule(@Body() deleteScheduleDto: DeleteScheduleDto) {
    return this.doctorsService.deleteSchedule(deleteScheduleDto);
  }
}
