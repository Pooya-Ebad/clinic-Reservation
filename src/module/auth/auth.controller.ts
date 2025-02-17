import { Body, Controller, Get, Patch, Post, Put, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ChargeDto, CheckOtpDto, CreateOtpDto, RefreshTokenDto, RoleDto, SendOtpDto } from "./dto/auth.dto";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SwaggerEnums } from "src/common/enums/swagger.enum";
import { AuthGuard } from "./guard/auth.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { Request } from "express";
import { role } from "src/common/enums/role.enum";

@Controller("auth")
@UseGuards(AuthGuard)
@ApiBearerAuth("Authorization")
@ApiTags("Auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Post("signup")
  @ApiOperation({ summary: "users signup section" })
  @ApiResponse({
    status: 201,
    description: "after sending verification code successfully",
    example: {
      message: "کد تایید ارسال شد.",
    },
  })
  @ApiResponse({
    status: 409,
    description: "if the user is already registered",
    example: {
      "message": ".با این شماره تلفن قبلا ثبت نام کرده اید",
      "error": "Conflict",
      "statusCode": 409
    }
  })
  signup(@Body() otpDto: CreateOtpDto) {
    return this.authService.signup(otpDto, "user");
  }

  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Post("login")
  @ApiOperation({ summary: "login users and sending otp code" })
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

  @Post("check-otp")
  @ApiOperation({ summary: "check user otp" })
  @ApiConsumes(SwaggerEnums.UrlEncoded)
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
    return this.authService.checkOtp(otpDto, "user");
  }

  @Roles([role.ADMIN])
  @Post("refreshToken")
  @ApiOperation({ summary: "generate new refresh token after expiration" })
  @ApiResponse({
    status: 201,
    description: "after the operation was successful",
    example: {
      accessToken:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidXNlciIsImlkIjo2LCJtb2JpbGUiOiIwOTEwMDAwMDAwMCIsImlhdCI6MTczODI0ODU4NiwiZXhwIjoxNzQwODQwNTg2fQ.Y6xuYZcoV6TjSr4w8at68RoO7RIkt__iEC792YU5T_s",
      refreshToken:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidXNlciIsImlkIjo2LCJtb2JpbGUiOiIwOTEwMDAwMDAwMCIsImlhdCI6MTczODI0ODU4NiwiZXhwIjoxNzY5ODA2MTg2fQ.3ale6H6SsFJwotA7lgX0RI49f7YFv95dzotcvUsxQi4",
    },
  })
  @ApiResponse({
    status: 400,
    description: "if token is not correct",
    example: {
      message: ["token incorrect"],
      error: "Bad Request",
      statusCode: 400,
    },
  })
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.verifyRefreshToken(refreshTokenDto);
  }

  @Roles([role.ADMIN, role.DOCTOR, role.USER])
  @Get("profile")
  @ApiOperation({
    summary: "users can get their profile",
    description: "Returns the user or doctor profile based on the token",
  })
  @ApiResponse({
    status: 200,
    description: "if you take your profile as a user",
    example: {
      id: 6,
      first_name: "Pooya",
      last_name: "Ebadollahi",
      mobile: "09196715197",
      wallet: 99999,
      mobile_verify: true,
      role: "user",
      created_at: "2025-01-30T13:15:50.247Z",
      updated_at: "2025-01-30T14:43:20.000Z",
      otp: "16157",
      expires_in: "2025-01-30T14:45:21.000Z",
      appointments: [],
    },
  })
  @ApiResponse({
    status: 201,
    description: "if you take your profile as a doctor",
    example: {
      id: 1,
      first_name: "Pooya",
      last_name: "Ebadollahi",
      mobile: "09196715197",
      mobile_verify: true,
      category: "قلب و عروق",
      Medical_License_number: "12345",
      national_code: "0310000000",
      description: null,
      status: "pending",
      statusCheck_at: null,
      disQualified_at: null,
      reason: null,
      role: "doctor",
      created_at: "2025-01-25T18:01:36.746Z",
      updated_at: "2025-01-30T15:01:56.000Z",
      otp: "14277",
      expires_in: "2025-01-30T15:03:56.000Z",
      image: null,
      availability: true,
      clinicId: 1,
      appointments: [
        {
          id: 16,
          doctorId: 1,
          userId: 4,
          Visit_Date: "1403/11/15 12:14",
          price: "99999",
          status: "pending",
          created_at: "2025-01-29T20:33:38.920Z",
          payment: false,
          payment_date: null,
        },
      ],
    },
  })
  profile(@Req() request: Request) {
    return this.authService.profile(request.user.id, request.user.type);
  }

  @Roles([role.ADMIN, role.DOCTOR, role.USER])
  @Patch("set-admin")
  setAdmin(@Req() request : Request){
      return this.authService.setAdmin(request.user)
  }
  
  @Roles([role.USER, role.ADMIN])
  @Put("charge-wallet")
  @ApiOperation({
    summary: "users can charge their wallet",
    description: "doctors do not have access to this section",
  })
  @ApiResponse({
    status: 200,
    description: "if payment was successful",
    example: {
      message: "حساب شما با موفقیت شارژ شد.",
    },
  })
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  chargeWallet(@Body() chargeDto: ChargeDto, @Req() request: Request) {
    return this.authService.chargeWallet(
      request.user.id,
      request.user.type,
      chargeDto
    );
  }
} 