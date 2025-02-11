import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
} from "class-validator";
import { categoryEnum } from "src/common/enums/category.enum";
import { AppointmentStatusEnum, statusEnum } from "src/common/enums/status.enum";

export class CreateClinicDto {
  @ApiProperty()
  name: string;
  @ApiProperty({enum : categoryEnum})
  @IsEnum(categoryEnum)
  category: string;
  @ApiProperty({default : 1})
  @IsNotEmpty({message: "استان نمیتواند خالی  ارسال شود"})
  province: number;
  @ApiProperty({default : 1})
  @IsNotEmpty({message: "شهر نمیتواند خالی  ارسال شود"})
  city: number;
  @ApiProperty()
  address: string;
}
export class ClinicDocumentDto {
  @ApiProperty({format: "binary"})
  license: string;
  @ApiProperty({enum: {"Rental": "rental", "Owner" : "owner"}})
  location_type: string;
  @ApiPropertyOptional({format: "binary"})
  rent_agreement: string;
  @ApiProperty({format: "binary"})
  clinic_images: string[];
  @ApiProperty()
  @IsPhoneNumber("IR", {message: "تلفن وارد شده صحیح نمیباشد"})
  tel_1: string;
  @ApiProperty()
  @IsPhoneNumber("IR", {message: "تلفن وارد شده صحیح نمیباشد"})
  tel_2: string;
}
export class ClinicConformationDto{
  @ApiProperty({enum : [statusEnum.ACCEPTED,statusEnum.REJECTED]})
  @IsEnum(statusEnum)
  status : string
  @ApiPropertyOptional()
  message : string
}
export class ClinicDisQualificationDto{
  @ApiProperty({enum : [statusEnum.DISQUALIFICATION]})
  @IsEnum(statusEnum)
  status : string
  @ApiProperty()
  message : string
}
export class GetAppointmentsDto{
  @ApiProperty({enum : AppointmentStatusEnum})
  @IsEnum(AppointmentStatusEnum)
  status : string
}