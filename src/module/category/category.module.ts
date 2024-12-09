import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { S3Service } from '../S3/S3.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './entities/category.entity';
import { AuthGuard } from '../auth/guard/auth.guard';
import { AuthService } from '../auth/auth.service';
import { UserEntity } from '../users/entities/user.entity';
import { OtpEntity } from '../auth/entity/otp.entity';
import { DoctorEntity } from '../doctors/entities/doctor.entity';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports : [TypeOrmModule.forFeature([CategoryEntity, UserEntity, OtpEntity,DoctorEntity])],
  controllers: [CategoryController],
  providers: [CategoryService, S3Service, AuthGuard, AuthService, JwtService],
  exports : [CategoryService]
})
export class CategoryModule {}
