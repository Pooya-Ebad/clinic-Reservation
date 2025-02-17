import { Body, Controller,Delete,FileTypeValidator,Get,MaxFileSizeValidator,NotFoundException,Param,ParseFilePipe,Patch,Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors} from "@nestjs/common";
import { clinicService } from "./clinic.service";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SwaggerEnums } from "src/common/enums/swagger.enum";
import { ClinicConformationDto, ClinicDisQualificationDto, ClinicDocumentDto, ClinicSearchDto, CreateClinicDto, GetAppointmentsDto } from "./dto/clinic.dto";
import { Request } from "express";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { toMG } from "src/common/utility/function.utils";
import { AuthGuard } from "../auth/guard/auth.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { role } from "src/common/enums/role.enum";
import { ClinicGuard } from "./guard/clinic.guard";
import { Pagination } from "src/common/decorators/pagination.decorator";
import { PaginationDto } from "src/common/dto/pagination.dto";

@ApiBearerAuth('Authorization')
// @UseGuards(AuthGuard)
@Controller('clinic')
@ApiTags('Clinic')
export class clinicController {
    constructor(private readonly clinicService : clinicService){}

    @Roles([role.DOCTOR])
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    @Post('register_step1')
    @ApiOperation({summary : "clinic signup section 1", description : "you need to login as a doctor first"})
    @ApiResponse({
        status: 201,
        description: "if operation was successful",
        example: {
            "message": "اطلاعات اولیه ثبت شد"
        }
    })
    Register(
        @Body() createClinicDto: CreateClinicDto,
        @Req() request : Request
    ) {
        return this.clinicService.create(createClinicDto, request.user);
    }
    
    @UseGuards(ClinicGuard)
    @Roles([role.DOCTOR])
    @ApiConsumes(SwaggerEnums.Multipart)
    @Post('register_step2')
    @ApiOperation({summary : "clinic signup section 2", description : "you need to login as a doctor first"})
    @ApiResponse({
        status: 201,
        description: "if operation was successful",
        example: {
            "message": "اطلاعات شما دریافت شد و در صف تایید قرار گرفتید"
        }
    })
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
    @Req() request : Request,
    @Body() clinicDocumentDto: ClinicDocumentDto
    ) {
        return this.clinicService.CreateDocument(clinicDocumentDto,files, request.clinic);
    }
    @Roles([role.ADMIN])
    @Get()
    @ApiOperation({
    summary: "search clinics",
    description: "you can find clinics with following options",
    })
    @ApiResponse({
    status: 200,
    description: "when clinics found",
    schema: {
        example: {
        pagination: {
            total_count: 10,
            page: 0,
            limit: "10",
            skip: 0,
        },
        doctors: [
            {
              "id": 10,
              "name": "noor",
              "categoryId": 30,
              "slug": "noor-clinic",
              "status": "pending",
              "manager_name": "Pooya Ebadollahi",
              "manager_mobile": "09196715197",
              "reason": null,
              "statusCheck_at": null,
              "disQualified_at": null,
              "province": "آذربایجان شرقی",
              "city": "اسکو",
              "address": "string",
              "doctorsCount": 0,
              "documentsId": 3,
              "created_at": "2025-02-11T20:14:01.484Z"
            }
          ],
        },
    },
    })
    @ApiResponse({
    status: 404,
    description: "when no result found",
    schema: {
        example: {
        message: "نتیحه ای یافت نشد.",
        error: "Not Found",
        statusCode: 404,
        },
    },
    })
    @Pagination()
    async find(
    @Query() paginationDto: PaginationDto,
    @Query() searchDto: ClinicSearchDto
    ) {
    const result = await this.clinicService.findClinic(paginationDto, searchDto);
    if (result.clinic.length == 0) throw new NotFoundException("نتیحه ای یافت نشد.");
    return result;
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

