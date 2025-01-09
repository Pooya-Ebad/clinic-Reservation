import { Body, Controller,FileTypeValidator,MaxFileSizeValidator,Param,ParseFilePipe,Post, Req, UploadedFiles, UseInterceptors} from "@nestjs/common";
import { clinicService } from "./clinic.service";

import { ApiConsumes } from "@nestjs/swagger";
import { SwaggerEnums } from "src/common/enums/swagger.enum";

import { ClinicDocumentDto, CreateClinicDto } from "./dto/clinic.dto";
import { Request } from "express";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { toMG } from "src/common/utility/function.utils";


@Controller('clinic')
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
}   

