import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { DoctorsService } from "src/module/doctors/doctors.service";

@Injectable()
export class ClinicGuard implements CanActivate{
    constructor(
        private doctorService : DoctorsService,
    ){}
    async canActivate(
        context: ExecutionContext
    ) {
        const httpRequest = context.switchToHttp()
        const request : Request = httpRequest.getRequest<Request>()
        const user = await this.doctorService.findOneByMobile(request.user.mobile)
        if(user.mobile !== user.clinic?.manager_mobile){
            console.log(user.mobile);
            throw new UnauthorizedException("این کلینیک متعلق به شما نیست.")
        }      
        request.clinic = {id : user.clinic.id}
        return true
    }
}