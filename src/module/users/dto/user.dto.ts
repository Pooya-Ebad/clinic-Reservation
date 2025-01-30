import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsMobilePhone, IsOptional, IsString, Matches } from "class-validator";
import { WeekDays } from "src/common/enums/week.days.enum";

export class UserSearchDto {
  @ApiPropertyOptional({ description: "At least 3 characters are required" })
  search: string;
  @ApiPropertyOptional({ example: "09100000000" })
  @IsOptional()
  @IsMobilePhone("fa-IR", {}, { message: "شماره تلفن نادرست میباشد." })
  mobile: string;
  @ApiPropertyOptional({ description: "in 2025-01-28 18:11:42.000000 format" })
  to_date: string;
  @ApiPropertyOptional({ description: "in 2025-01-28 18:11:42.000000 format" })
  from_date: string;
}

export class FindUserDto {
  @ApiProperty({ example: "09100000000" })
  @IsMobilePhone("fa-IR", {}, { message: "شماره تلفن نادرست میباشد." })
  mobile: string;
}
export class CreateUserDto {
  @ApiProperty({example : "Name"})
  @IsString()
  first_name: string;
  @ApiProperty({example : "Last-Name"})
  @IsString()
  last_name: string;
  @ApiProperty({ example: "09100000000" })
  @IsMobilePhone("fa-IR", {}, { message: "شماره تلفن نادرست میباشد." })
  mobile: string;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: "09100000000" })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  @IsMobilePhone("fa-IR", {}, { message: "شماره تلفن نادرست میباشد." })
  mobile: string;
}
export class AppointmentDto {
  @ApiProperty()
  doctor_id: number;
  @ApiProperty()
  user_id: number;
  @ApiProperty({ description: "in 00:00 format", example: "00:00" })
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "زمان باید به فرمت ۲۴ ساعته باشد (00:00)",
  })
  visit_time: string;
  @ApiProperty({ enum: WeekDays })
  visit_day: string;
}
export class GetAppointmentDto {
  @ApiProperty()
  appointment_id: number;
  @ApiProperty()
  user_id: number;
}
