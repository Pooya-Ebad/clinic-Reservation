import { ApiProperty } from "@nestjs/swagger";
import { IsMobilePhone, IsString } from "class-validator";
import { WeekDays } from "src/common/enums/week.days.enum";

export class FindUserDto {
    @ApiProperty()
    @IsMobilePhone("fa-IR", {}, {message : "phone number is incorrect"})
    mobile : string
}
export class CreateUserDto {
    @ApiProperty()
    @IsString()
    first_name : string
    @ApiProperty()
    @IsString()
    last_name : string
    @ApiProperty()
    @IsMobilePhone ("fa-IR", {}, {message : "phone number is incorrect"})
    mobile : string
}
export class ChargeDto {
    @ApiProperty()
    @IsString()
    amount : string
}
export class AppointmentDto {
    @ApiProperty()
    doctorId : number
    @ApiProperty()
    visit_time : string
    @ApiProperty({enum : WeekDays})
    visit_day : string
}

