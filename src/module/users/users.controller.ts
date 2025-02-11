import { Controller, Get, Body, Patch, Param, Delete, UseGuards, Query, Put, } from "@nestjs/common";
import { UsersService } from "./users.service";
import { AppointmentDto, FindUserDto, GetAppointmentDto, UpdateUserDto, UserSearchDto, } from "./dto/user.dto";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags, } from "@nestjs/swagger";
import { SwaggerEnums } from "src/common/enums/swagger.enum";
import { AuthGuard } from "../auth/guard/auth.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { Pagination } from "src/common/decorators/pagination.decorator";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { role } from "src/common/enums/role.enum";

@Controller("users")
@ApiBearerAuth("Authorization")
@UseGuards(AuthGuard)
@ApiTags("Users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles([role.ADMIN])
  @Get()
  @ApiOperation({
    summary: "search users",
    description: "you can find users with following options",
  })
  @ApiResponse({
    status: 200,
    description: "when users found",
    schema: {
      example: {
        pagination: {
          total_count: 1,
          page: 0,
          limit: "10",
          skip: 0,
        },
        user: [
          {
            id: 1,
            first_name: "پویا",
            last_name: "عباداللهی",
            mobile: "09196715197",
            wallet: 99999,
            mobile_verify: true,
            role: "admin",
            created_at: "2025-03-25T18:01:20.338Z",
            updated_at: "2025-01-28T15:10:05.214Z",
            otp: "90483",
            expires_in: "2025-01-28T14:46:09.000Z",
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
  find(
    @Query() paginationDto: PaginationDto,
    @Query() searchDto: UserSearchDto
  ) {
    return this.usersService.findUsers(paginationDto, searchDto);
  }

  @Roles([role.ADMIN])
  @Get("get-appointments:mobile")
  @ApiOperation({ summary: "take user appointments" })
  @ApiResponse({
    status: 200,
    description: "when result found",
    schema: {
      example: [
        {
          id: 1,
          doctorId: 1,
          userId: 1,
          Visit_Date: "1403/11/15 12:14",
          price: "99999",
          status: "pending",
          created_at: "2025-01-26T16:19:54.079Z",
          payment: false,
          payment_date: null,
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: "when no result found",
    schema: {
      example: {
        message: "هیچ ویزیتی برای کاربر یافت نشد.",
        error: "Not Found",
        statusCode: 404,
      },
    },
  })
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @ApiParam({ name: "mobile", example: "09100000000" })
  getAppointment(@Param() userDto: FindUserDto) {
    return this.usersService.getAppointment(userDto.mobile);
  }

  @Roles([role.ADMIN])
  @Patch("update-user:mobile")
  @ApiOperation({ summary: "update user profile" })
  @ApiResponse({
    status: 200,
    description: "after updating user information",
    schema: {
      example: {
        id: 2,
        first_name: "پویا",
        last_name: "عباداللهی",
        mobile: "09196715197",
        wallet: 99999,
        mobile_verify: false,
        role: "user",
        created_at: "2025-06-24T13:21:29.000Z",
        updated_at: "2025-01-28T17:44:57.000Z",
        otp: null,
        expires_in: null,
      },
    },
  })
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  update(@Param() userDto: FindUserDto, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(userDto.mobile, updateUserDto);
  }

  @Roles([role.ADMIN]) 
  @Put("set-appointment")
  @ApiOperation({ summary: "set appointment for user" })
  @ApiResponse({
    status: 200,
    description: "after updating user information",
    schema: {
      example: {
        message:
          ".نوبت با موفقیت رزرو شد. شما میتوانید با مراجعه به بخش پرداخت نسبت به نهایی کردن ویزیت خود اقدام کنید",
      },
    },
  })
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  setAppointment(@Body() appointmentDto: AppointmentDto) {
    return this.usersService.setAppointment(appointmentDto);
  }

  @Roles([role.ADMIN])
  @Put("payment")
  @ApiOperation({
    summary: "paying for the visit",
    description:
      "after successful payment, the visit will be booked for the user",
  })
  @ApiResponse({
    status: 200,
    description: "after updating user information",
    schema: {
      example: {
        message: "پرداخت با موفقیت انجام شد.",
      },
    },
  })
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  payment(@Body() getAppointmentDto: GetAppointmentDto) {
    return this.usersService.payment(getAppointmentDto);
  }

  @Roles([role.ADMIN])
  @Put("cancel-appointment")
  @ApiOperation({ summary: "cancel user appointment" })
  @ApiResponse({
    status: 200,
    description: "after updating user information",
    schema: {
      example: {
        message:
          "نوبت ویزیت با موفقیت کنسل شد و هزینه آن به کیف پول شما عودت داده شد.",
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "after updating user information",
    schema: {
      example: {
        message: ".نوبت یافت نشد! از پرداخت هزینه ویزیت اطمینان حاصل کنید",
        error: "Not Found",
        statusCode: 404,
      },
    },
  })
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  cancel(@Body() cancelDto: GetAppointmentDto) {
    return this.usersService.cancelAppointment(cancelDto);
  }

  @Roles([role.ADMIN])
  @Delete(":mobile")
  @ApiOperation({ summary: "delete user information" })
  @ApiResponse({
    status: 200,
    description: "if deletion was successful",
    schema: {
      example: {
        message: "کاربر با موفقیت حذف شد.",
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "if deletion was not successful",
    schema: {
      example: {
        message: "کاربر یافت نشد",
        error: "Not Found",
        statusCode: 404,
      },
    },
  })
  remove(@Param() userDto: FindUserDto) {
    return this.usersService.remove(userDto.mobile);
  }
}
