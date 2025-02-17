import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { DoctorsService } from "../doctors/doctors.service";
import { clinicService } from "../clinic/clinic.service";
import { TypeOrmConfig } from "src/config/typeorm.config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DoctorEntity } from "../doctors/entities/doctor.entity";
import { ClinicEntity } from "../clinic/entity/clinic.entity";
import { CategoryEntity } from "../category/entities/category.entity";
import { ClinicDocumentEntity } from "../clinic/entity/Document.entity";
import { UserEntity } from "../users/entities/user.entity";
import { ScheduleEntity } from "../doctors/entities/schedule.entity";
import { AppointmentEntity } from "../users/entities/appointment.entity";
import { S3Service } from "../S3/S3.service";
import { AuthService } from "../auth/auth.service";
import { CategoryService } from "../category/category.service";
import { JwtService } from "@nestjs/jwt";

@Module({
    imports : [
        TypeOrmModule.forFeature([
            ClinicEntity,
            CategoryEntity,
            ClinicDocumentEntity,
            DoctorEntity,
            UserEntity,
            ScheduleEntity,
            AppointmentEntity
        ])
    ],
    controllers : [SearchController],
    providers : [
        SearchService,
        DoctorsService,
        AuthService,
        CategoryService,
        clinicService,
        S3Service,
        JwtService
    ]
})
export class SearchModule {}