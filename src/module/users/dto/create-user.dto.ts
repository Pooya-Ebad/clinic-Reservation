import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsMobilePhone, IsString, Matches } from "class-validator";
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
    @ApiProperty({example : "00:00"})
    @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'زمان باید به فرمت ۲۴ ساعته باشد )00:00)',
    })
    visit_time : string
    @ApiProperty({enum : WeekDays})
    visit_day : string
}

