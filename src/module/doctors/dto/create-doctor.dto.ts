import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsEnum, isEnum, IsMobilePhone, IsString, Length, Matches } from "class-validator"
import { categoryEnum } from "src/common/enums/category.enum"
import { statusEnum } from "src/common/enums/status.enum"
import { WeekDays } from "src/common/enums/week.days.enum"

export class CreateDoctorDto {
    @ApiProperty({enum : categoryEnum})
    @IsEnum(categoryEnum)
    @IsString()
    category : string
    @ApiProperty()
    @IsString() 
    @Length(5,5, {message : "Medical License number must be between 5 to 5"})
    Medical_License_number : string
    @ApiProperty({format : "binary"})
    image : string
    @ApiProperty()
    @IsString()
    @Length(10,10, {message : "national code must be between 10 to 10"})
    national_code : string
    @ApiProperty()
    @IsString()
    description : string
    @ApiProperty()
    @IsString()
    @Length(5,5, {message : "code format not correct"})
    otp_code : string
}
export class DoctorConformationDto {
    @ApiProperty({enum : [statusEnum.ACCEPTED,statusEnum.REJECTED]})
    @IsEnum(statusEnum)
    status : string
    @ApiPropertyOptional()
    @IsString() 
    message : string
}
export class DoctorDisQualificationDto {
    @ApiProperty({enum : [statusEnum.DISQUALIFICATION]})
    @IsEnum(statusEnum)
    status : string
    @ApiProperty()
    @IsString() 
    message : string
}
export class ScheduleDto {
    @ApiProperty({enum : WeekDays})
    @IsEnum(WeekDays)
    Day : string
    @ApiProperty({example : "00:00"})
    @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'زمان باید به فرمت ۲۴ ساعته باشد )00:00)',
      })
    Visit_Time : string
}
 