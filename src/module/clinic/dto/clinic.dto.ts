import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {
  IsEnum,
  IsMobilePhone,
  IsNotEmpty,
  IsPhoneNumber,
  Matches,
} from "class-validator";
import { categoryEnum } from "src/common/enums/category.enum";

export class CreateClinicDto {
  @ApiProperty()
  name: string;
  @ApiProperty({enum : categoryEnum})
  @IsEnum(categoryEnum)
  category: string;
  @ApiProperty()
  @IsNotEmpty({message: "استان نمیتواند خالی  ارسال شود"})
  province: number;
  @ApiProperty()
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
  @ApiProperty({format: "binary"})
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