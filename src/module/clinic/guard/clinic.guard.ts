import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { findOptionsEnum } from "src/common/enums/findOption.enum";
import { DoctorsService } from "src/module/doctors/doctors.service";
import { DoctorEntity } from "src/module/doctors/entities/doctor.entity";
import { Repository } from "typeorm";

@Injectable()
export class ClinicGuard implements CanActivate{
    constructor(
        @InjectRepository(DoctorEntity)
        private doctorRepository: Repository<DoctorEntity>,
    ){}
    async canActivate(
        context: ExecutionContext
    ) {
        const httpRequest = context.switchToHttp()
        const request : Request = httpRequest.getRequest<Request>()
        if(request.user.type !== "doctor")
            throw new UnauthorizedException("ابتدا از بخش ورود پزشکان به اکانت خود وارد شوید")
        const doctor = await this.doctorRepository.findOne({
            where  : { mobile : request.user.mobile },
            relations : { clinic : true }
        })
        if(doctor.mobile !== doctor.clinic?.manager_mobile){
            throw new UnauthorizedException("این کلینیک متعلق به شما نیست.")
        }      
        request.clinic = {id : doctor.clinic.id}
        return true
    }
}