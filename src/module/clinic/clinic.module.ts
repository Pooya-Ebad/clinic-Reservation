import { Module } from "@nestjs/common";
import { clinicController } from "./clinic.controller";
import { clinicService } from "./clinic.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClinicEntity } from "./entity/clinic.entity";
import { S3Service } from "../S3/S3.service";
import { CategoryEntity } from "../category/entities/category.entity";
import { ClinicDocumentEntity } from "./entity/Document.entity";
import { DoctorEntity } from "../doctors/entities/doctor.entity";
import { DoctorsService } from "../doctors/doctors.service";
import { AuthService } from "../auth/auth.service";
import { CategoryService } from "../category/category.service";
import { UserEntity } from "../users/entities/user.entity";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "../auth/guard/auth.guard";
import { ScheduleEntity } from "../doctors/entities/schedule.entity";
import { AppointmentEntity } from "../users/entities/appointment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicEntity,
      CategoryEntity,
      ClinicDocumentEntity,
      DoctorEntity,
      UserEntity,
      ScheduleEntity,
      AppointmentEntity
    ]),
  ],
  controllers: [clinicController],
  providers: [
    clinicService,
    S3Service,
    DoctorsService,
    AuthService,
    CategoryService,
    JwtService,
    AuthGuard,
  ],
})
export class clinicModule {}