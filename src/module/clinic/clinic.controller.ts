import { Body, Controller,Delete,FileTypeValidator,Get,MaxFileSizeValidator,Param,ParseFilePipe,Patch,Post, Put, Req, UploadedFiles, UseGuards, UseInterceptors} from "@nestjs/common";
import { clinicService } from "./clinic.service";
import { ApiBearerAuth, ApiConsumes, ApiProperty, ApiTags } from "@nestjs/swagger";
import { SwaggerEnums } from "src/common/enums/swagger.enum";
import { ClinicConformationDto, ClinicDisQualificationDto, ClinicDocumentDto, CreateClinicDto, GetAppointmentsDto } from "./dto/clinic.dto";
import { Request } from "express";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { toMG } from "src/common/utility/function.utils";
import { AuthGuard } from "../auth/guard/auth.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { role } from "src/common/enums/role.enum";
import { ClinicGuard } from "./guard/clinic.guard";
import { AppointmentStatusEnum } from "src/common/enums/status.enum";

@ApiBearerAuth('Authorization')
// @UseGuards(AuthGuard)
@Controller('clinic')
@ApiTags('Clinic')
export class clinicController {
    constructor(private readonly clinicService : clinicService){}

    @Post('register_step1')
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    Register(
    @Body() createClinicDto: CreateClinicDto,
    @Req() request : Request
    ) {
    return this.clinicService.create(createClinicDto, request.user);
    }

    @Post('register_step2:mobile')
    @ApiConsumes(SwaggerEnums.Multipart)
    @UseInterceptors(AnyFilesInterceptor({
        storage : memoryStorage()
    }))
    createDocument(
    @UploadedFiles(
        new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: toMG(10) }),
                new FileTypeValidator({ fileType: /(image\/(png|jpg|jpeg)|application\/(pdf|docx))/ }),
            ],
            fileIsRequired: false,
        }),
    ) files: Express.Multer.File[],
    @Param('mobile') mobile : string,
    @Body() clinicDocumentDto: ClinicDocumentDto
    ) {
    return this.clinicService.CreateDocument(clinicDocumentDto,files,mobile);
    }
    
    @Get(':id')
    @Roles([role.DOCTOR])
    getClinics(@Param('id') id : string){
        return this.clinicService.findById(+id)
    }

    @Get('appointment/:status')
    // @Roles([role.DOCTOR])
    getAppointments(
        @Param() Param : GetAppointmentsDto
    ){
        return this.clinicService.getAppointments(Param.status)
    }

    @Patch('confirmation:id')
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    Confirmation(
        @Param('id') id : string,
        @Body() confirmationDto : ClinicConformationDto
    ){
        return this.clinicService.confirmation(+id, confirmationDto)
    }
    @Patch('DisQualification:id')
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    DisQualification(
        @Param('id') id : string,
        @Body() disQualification : ClinicDisQualificationDto
    ){
        return this.clinicService.DisQualification(+id, disQualification)
    }
    
    @Put('Add_Doctor:License')
    @UseGuards(ClinicGuard)
    @Roles([role.DOCTOR, role.ADMIN])
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    AddDoctor(
        @Param('License') License : string,
        @Req() request : Request 
    ){
        return this.clinicService.addDoctor(License, request.clinic.id)
    }

    @Delete('delete/:id')
    @Roles([role.ADMIN])
    remove(@Param('id') id :string){
        return this.clinicService.remove(+id)
    }
}   

