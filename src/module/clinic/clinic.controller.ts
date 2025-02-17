import { Body, Controller,Delete,FileTypeValidator,Get,MaxFileSizeValidator,Param,ParseFilePipe,Patch,Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors} from "@nestjs/common";
import { clinicService } from "./clinic.service";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SwaggerEnums } from "src/common/enums/swagger.enum";
import { ClinicConformationDto, ClinicDisQualificationDto, ClinicDocumentDto, ClinicSearchDto, CreateClinicDto, GetAppointmentsDto, LicenseNumberDto } from "./dto/clinic.dto";
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
import { Length } from "class-validator";

@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
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
    find(
    @Query() paginationDto: PaginationDto,
    @Query() searchDto: ClinicSearchDto
    ) {
    return this.clinicService.findClinic(paginationDto, searchDto);
    }
    
    @UseGuards(ClinicGuard)
    @Roles([role.DOCTOR])
    @Get('appointment/:status')
    @ApiOperation({summary : "get clinic appointments"})
    @ApiResponse({
        status : 200,
        description : "when result found",
        example : [
            [
              {
                "doctor_name": "Pooya Ebadollahi",
                "patient_name": "Omid Safary",
                "userId": 1,
                "Visit_Date": "1403/11/27 00:00",
                "price": "30000",
                "status": "done",
                "payment": true,
                "payment_date": "2025-02-09T19:43:05.000Z"
              }
            ]
          ]
    })
    @ApiResponse({
        status : 404,
        description : "when no result found",
        example : {
            "message": "هیج نوبت ویزیتی یافت نشد.",
            "error": "Not Found",
            "statusCode": 404
          }
    })
    getAppointments(
        @Param() Param : GetAppointmentsDto
    ){
        return this.clinicService.getAppointments(Param.status)
    }

    @Roles([role.ADMIN])
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    @Patch('confirmation:clinicId')
    @ApiOperation({summary : "you can accept or reject clinics", description : "You must write a reason for rejection."})
    @ApiResponse({
        status : 200,
        description : "if operation was successful",
        example : {
            "message": "تغیر کرد rejected وضعیت کلینیک به"
          }
    })
    @ApiResponse({
        status : 404,
        description : "when clinic not found",
        example : {
            "message": "کلینیک یافت نشد",
            "error": "Not Found",
            "statusCode": 404
          }
    })
    Confirmation(
        @Param('clinicId') clinicId : string,
        @Body() confirmationDto : ClinicConformationDto
    ){
        return this.clinicService.confirmation(+clinicId, confirmationDto)
    }

    @Roles([role.ADMIN])
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    @Patch('DisQualification:id')
    @ApiOperation({summary : "you can disqualification clinics"})
    @ApiResponse({
        status : 200,
        description : "if operation was successful",
        example : {
            "message": "کلینیک رد صلاحیت شد."
          }
    })
    @ApiResponse({
        status : 404,
        description : "when clinic not found",
        example : {
            "message": "کلینیک یافت نشد",
            "error": "Not Found",
            "statusCode": 404
          }
    })
    DisQualification(
        @Param('id') id : string,
        @Body() disQualification : ClinicDisQualificationDto
    ){
        return this.clinicService.DisQualification(+id, disQualification)
    }
    
    @UseGuards(ClinicGuard)
    @Roles([role.DOCTOR, role.ADMIN])
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    @Put('Add_Doctor')
    @ApiOperation({summary : "Adding a doctor to the clinic"})
    @ApiResponse({
        status : 200,
        description : "if operation was successful",
        example : {
            "message": "پزشک با موفقیت به کلینیک شما اضافه گردید"
          }
    })
    @ApiResponse({
        status : 409,
        description : "If the doctor is already a member of a clinic",
        example : {
            "message": "این پزشک در یک کلینیک عضو میباشد",
            "error": "Conflict",
            "statusCode": 409
          }
    })
    @ApiResponse({
        status : 404,
        description : "when the doctor not found",
        example : {
            "message": "پزشک یافت نشد.",
            "error": "Not Found",
            "statusCode": 404
          }
    })
    AddDoctor(
        @Body() Doctor_License : LicenseNumberDto,
        @Req() request : Request 
    ){
        const { Medical_License_number } = Doctor_License
        return this.clinicService.addDoctor(Medical_License_number, request.clinic.id)
    }

    @Roles([role.ADMIN])
    @Delete('delete/:id')
    @ApiOperation({summary : "delete clinics information"})
    @ApiResponse({
        status : 200,
        description : "if operation was successful",
        example : {
            "message": "کلینیک با موفقیت حذف شد."
          }
    })
    @ApiResponse({
        status : 404,
        description : "when the doctor not found",
        example : {
            "message": "کلینیک یافت نشد",
            "error": "Not Found",
            "statusCode": 404
          }
    })
    remove(@Param('id') id :string){
        return this.clinicService.remove(+id)
    }
}   

