import { Body, Controller,FileTypeValidator,MaxFileSizeValidator,Param,ParseFilePipe,Post, Put, Req, UploadedFiles, UseInterceptors} from "@nestjs/common";
import { clinicService } from "./clinic.service";

import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { SwaggerEnums } from "src/common/enums/swagger.enum";

import { ClinicConformationDto, ClinicDocumentDto, CreateClinicDto } from "./dto/clinic.dto";
import { Request } from "express";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { toMG } from "src/common/utility/function.utils";
import { statusEnum } from "src/common/enums/status.enum";


@Controller('clinic')
@ApiTags('Clinic')
export class clinicController {
    constructor(private readonly clinicService : clinicService){}

    @Post('register_step1')
    @ApiConsumes(SwaggerEnums.Multipart)
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
    @Put('confirmation:id')
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    Confirmation(
        @Param('id') id : string,
        @Body() confirmationDto : ClinicConformationDto
    ){
        return this.clinicService.confirmation(id, confirmationDto)
    }
}   

