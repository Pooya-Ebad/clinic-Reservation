import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Transform, Type } from "class-transformer"
import { IsEnum, isEnum, IsMobilePhone, IsOptional, IsString, Length, Matches } from "class-validator"
import { AvailabilityEnum } from "src/common/enums/availabilityEnum"
import { categoryEnum } from "src/common/enums/category.enum"
import { findOptionsEnum } from "src/common/enums/findOption.enum"
import { statusEnum } from "src/common/enums/status.enum"
import { WeekDays } from "src/common/enums/week.days.enum"

export class CreateDoctorDto {
    @ApiProperty({enum : categoryEnum})
    @IsEnum(categoryEnum)
    @IsString()
    category : string
    @ApiProperty({example : 12345})
    @IsString() 
    @Length(5,5, {message : "کد نظام پزشکی اشتباه است (حداقل و حداکثر ۵ رقم)"})
    Medical_License_number : string
    @ApiProperty({format : "binary"})
    image : string
    @ApiProperty({example: 1000000000})
    @IsString()
    @Length(10,10, {message : "کد ملی اشتباه است (حداقل و حداکثر ۱۰ رقم)"})
    national_code : string
    @ApiProperty()
    @IsString()
    description : string
    @ApiProperty({example : 12345})
    @IsString()
    @Length(5,5, {message : "کد تایید اشتباه میباشد (حداقل و حداکثر ۵ رقم)"})
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
    @ApiProperty({example : "00:00", description : "the input format must be in 24-hour format: 00:00"})
    @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'زمان باید به فرمت ۲۴ ساعته باشد )00:00)',
    })
    Visit_Time : string
    @ApiProperty({example : "30000", description : "price must be more than 30000 Toman"})
    price : string
}
export class DoctorSearchDto {
    @ApiPropertyOptional({ description: "At least 3 characters are required" })
    search: string;
    @ApiPropertyOptional({ example: "09100000000" })
    @IsOptional()
    @IsMobilePhone("fa-IR", {}, { message: "شماره تلفن نادرست میباشد." })
    mobile: string;
    @ApiPropertyOptional({enum : statusEnum})
    @IsOptional()
    @IsEnum(statusEnum)
    status : string
    @ApiPropertyOptional({enum : AvailabilityEnum})
    @IsOptional()
    @IsEnum(AvailabilityEnum)
    availability : string
    @ApiPropertyOptional({ description: "in 2025-01-28 18:11:42.000000 format" })
    to_date: string;
    @ApiPropertyOptional({ description: "in 2025-01-28 18:11:42.000000 format" })
    from_date: string;
  }
export class AvailabilityDto {
    @ApiProperty({enum : AvailabilityEnum})
    Availability : string
}
 
export class FindOptionDto {
    @ApiProperty({enum : findOptionsEnum})
    Find_Option : string
    @ApiProperty()
    Value : string
}
export class UpdateScheduleDto {
    @ApiProperty({enum : WeekDays})
    @IsEnum(WeekDays)
    Day : string
    @ApiProperty({example : "00:00", description : "the input format must be in 24-hour format: 00:00"})
    @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'زمان باید به فرمت ۲۴ ساعته باشد )00:00)',
    }) 
    Visit_Time : string
    @ApiPropertyOptional({example : "00:00", description : "the input format must be in 24-hour format: 00:00", nullable : true})
    @Transform(({ value }) => (value === '' ? null : value))
    @IsOptional()
    @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'زمان باید به فرمت ۲۴ ساعته باشد )00:00)',
    })
    New_Visit_Time : string
    @ApiPropertyOptional({example : "30000", description : "price must be more than 30000 Toman"})
    New_Price : string
}
export class DeleteScheduleDto {
    @ApiProperty()
    doctorId : number
    @ApiProperty({enum : WeekDays})
    @IsEnum(WeekDays)
    Day : string
    @ApiProperty({example : "00:00", description : "the input format must be in 24-hour format: 00:00"})
    @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'زمان باید به فرمت ۲۴ ساعته باشد )00:00)',
    }) 
    Visit_Time : string
}
 