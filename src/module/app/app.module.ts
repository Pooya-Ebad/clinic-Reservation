import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { CategoryModule } from '../category/category.module';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfig } from 'src/config/typeorm.config';
import { AuthModule } from '../auth/auth.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { clinicModule } from '../clinic/clinic.module';
import { SearchModule } from '../search/search.module';
import { MorganInterceptor, MorganModule } from 'nest-morgan';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
    isGlobal : true,
    envFilePath : join(process.cwd(), '.env')
  }),
  TypeOrmModule.forRootAsync({
    useClass : TypeOrmConfig,
    inject : [TypeOrmConfig]
  }),
  CategoryModule,
  UsersModule,
  DoctorsModule,
  clinicModule,
  AuthModule,
  SearchModule,
  MorganModule
],
  controllers: [],
  providers: [
    {
      provide : APP_INTERCEPTOR,
      useClass : MorganInterceptor("dev")
    }
  ],
})
export class AppModule {}
 