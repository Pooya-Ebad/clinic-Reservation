import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, isEnum, IsMobilePhone, IsString, Length } from "class-validator"
import { categoryEnum } from "src/common/enums/category.enum"
import { statusEnum } from "src/common/enums/status.enum"

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
export class ChangeStatusDto {
    @ApiProperty()
    @IsString() 
    @Length(5,5, {message : "Medical License number must be between 5 to 5"})
    Medical_License_number : string
    @ApiProperty({enum : statusEnum})
    @IsEnum(statusEnum)
    status : string
    @ApiProperty()
    @IsString() 
    description : string
}
 