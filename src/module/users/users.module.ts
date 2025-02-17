import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UserEntity } from "./entities/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthGuard } from "../auth/guard/auth.guard";
import { AuthService } from "../auth/auth.service";
import { DoctorEntity } from "../doctors/entities/doctor.entity";
import { JwtService } from "@nestjs/jwt";
import { DoctorsService } from "../doctors/doctors.service";
import { ScheduleEntity } from "../doctors/entities/schedule.entity";
import { S3Service } from "../S3/S3.service";
import { CategoryService } from "../category/category.service";
import { CategoryEntity } from "../category/entities/category.entity";
import { AppointmentEntity } from "./entities/appointment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      DoctorEntity,
      ScheduleEntity,
      CategoryEntity,
      AppointmentEntity,
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    AuthGuard,
    AuthService,
    JwtService,
    DoctorsService,
    S3Service,
    CategoryService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
