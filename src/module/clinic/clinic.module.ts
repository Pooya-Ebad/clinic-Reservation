import { Module } from "@nestjs/common";
import { clinicController } from "./clinic.controller";
import { clinicService } from "./clinic.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClinicEntity } from "./entity/clinic.entity";
import { S3Service } from "../S3/S3.service";
import { CategoryEntity } from "../category/entities/category.entity";
import { ClinicDocumentEntity } from "./entity/Document.entity";
import { DoctorEntity } from "../doctors/entities/doctor.entity";

@Module({
    imports : [TypeOrmModule.forFeature([ClinicEntity,CategoryEntity,ClinicDocumentEntity,DoctorEntity])],
    controllers : [clinicController],
    providers : [clinicService, S3Service]
})
export class clinicModule{}