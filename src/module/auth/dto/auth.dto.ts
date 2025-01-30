import { ApiProperty } from "@nestjs/swagger";
import { IsJWT, IsMobilePhone, IsString, Length } from "class-validator";
import { role } from "src/common/enums/role.enum";

export class CreateOtpDto {
  @ApiProperty({ example: "Name" })
  @IsString()
  first_name: string;
  @ApiProperty({ example: "Last-Name" })
  @IsString()
  last_name: string;
  @ApiProperty({ example: "09100000000" })
  @IsMobilePhone("fa-IR", {}, { message: "شماره تلفن نادرست میباشد." })
  mobile: string;
}
export class SendOtpDto {
  @ApiProperty({ example: "09100000000" })
  @IsMobilePhone("fa-IR", {}, { message: "شماره تلفن نادرست میباشد." })
  mobile: string;
}
export class CheckOtpDto {
  @ApiProperty({ example: "09100000000" })
  @IsMobilePhone("fa-IR", {}, { message: "شماره تلفن نادرست میباشد." })
  mobile: string;
  @ApiProperty({ example: "00000" })
  @IsString()
  @Length(5, 5, { message: "کد تایید باید 5 رقم باشد" })
  code: string;
}
export class RoleDto {
  @ApiProperty({ example: "09100000000" })
  @IsMobilePhone("fa-IR", {}, { message: "شماره تلفن نادرست میباشد." })
  mobile: string;
  @ApiProperty({ enum: role })
  @IsString()
  role: string;
}
export class RefreshTokenDto {
  @ApiProperty()
  @IsJWT({ message: "token incorrect" })
  RefreshToken: string;
}
export class ChargeDto {
  @ApiProperty({ description: "the minimum amount is 5000 toman" })
  @IsString()
  amount: string;
}