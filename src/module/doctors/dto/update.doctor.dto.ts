import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMobilePhone, IsOptional, IsString } from 'class-validator';
export class UpdateDoctorDto{
    @ApiPropertyOptional({example : "Name"})
    @IsString()
    first_name : string
    @ApiPropertyOptional({example : "Last-Name"})
    @IsString()
    last_name : string
    @ApiPropertyOptional({example : "09100000000"})
    @IsOptional()
    @Transform(({ value }) => (value === '' ? null : value))
    @IsMobilePhone("fa-IR", {}, {message : "phone number is incorrect"})
    mobile : string
    @ApiPropertyOptional({format : "binary"})
    image : string
}
 