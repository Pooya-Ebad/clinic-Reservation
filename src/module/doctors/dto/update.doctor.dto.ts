import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMobilePhone, IsString, Length } from 'class-validator';
export class UpdateDoctorDto{
    @ApiPropertyOptional({example : "Name"})
    @IsString()
    first_name : string
    @ApiPropertyOptional({example : "Last-Name"})
    @IsString()
    last_name : string
    @ApiPropertyOptional({example : "09100000000"})
    @IsMobilePhone("fa-IR", {}, {message : "phone number is incorrect"})
    mobile : string
    @ApiPropertyOptional({format : "binary"})
    image : string
    @ApiPropertyOptional({example: 1000000000})
    @IsString()
    @Length(10,10, {message : "کد ملی اشتباه است (حداقل و حداکثر ۱۰ رقم)"})
    national_code : string
}
 