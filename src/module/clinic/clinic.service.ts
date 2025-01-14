import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClinicEntity } from "./entity/clinic.entity";
import { Repository } from "typeorm";
import { S3Service } from "../S3/S3.service";
import { ClinicConformationDto, ClinicDisQualificationDto, ClinicDocumentDto, CreateClinicDto } from "./dto/clinic.dto";
import { CategoryEntity } from "../category/entities/category.entity";
import { TokenPayload } from "src/common/types/payload";
import { isPhoneNumber } from "class-validator";
import { ClinicDocumentEntity } from "./entity/Document.entity";
import { getCityAndProvinceNameByCode } from "src/common/utility/address.utils";
import slugify from "slugify";
import { DoctorEntity } from "../doctors/entities/doctor.entity";
import { statusEnum } from "src/common/enums/status.enum";
import { DoctorsService } from "../doctors/doctors.service";

@Injectable()
export class clinicService {
    constructor(
        @InjectRepository(ClinicEntity) private clinicRepository : Repository<ClinicEntity>,
        @InjectRepository(CategoryEntity) private categoryRepository : Repository<CategoryEntity>,
        @InjectRepository(ClinicDocumentEntity) private clinicDocumentEntity : Repository<ClinicDocumentEntity>,
        @InjectRepository(DoctorEntity) private doctorRepository : Repository<DoctorEntity>,
        private s3Service : S3Service,
        private doctorService : DoctorsService
    ){}
    async create(createClinicDto: CreateClinicDto , user : TokenPayload) {
    let { name,  address, city, province, category }= createClinicDto
    const {provinceName, cityName} = getCityAndProvinceNameByCode(province,city)
    console.log(province);
    const categoryExists = await this.categoryRepository.findOneBy({title : category})
    if(!categoryExists) throw new NotFoundException("category not found")
    const doc = await this.doctorRepository.findOneBy({id : user.id})
    await this.clinicRepository.insert({
        name,
        slug : slugify(name),
        category,
        manager_mobile : doc.mobile,
        manager_name : `${doc.first_name} ${doc.last_name}`,
        address,
        city : cityName,
        province : provinceName
    })
    return {message : "اطلاعات اولیه ثبت شد"}
    }
    async CreateDocument(clinicDocumentDto: ClinicDocumentDto ,files : Express.Multer.File[],mobile : string) {
    let { location_type,tel_1,tel_2 }= clinicDocumentDto
    let fileObject={}
    
    const clinic = await this.clinicRepository.findOneBy({manager_mobile : mobile})
    if(!clinic) throw new NotFoundException("لطفا مجدد تلاش کنید")
    await this.checkTelephone(tel_1)
    await this.checkTelephone(tel_2)
    for(let file of files){
        if(fileObject[file.fieldname]){
            const {Location} = await this.s3Service.uploadFile(file , "clinic")
            fileObject[file.fieldname] = fileObject[file.fieldname] + `,${Location}`
        }else{
            fileObject[file.fieldname] = (await this.s3Service.uploadFile(file , "clinic")).Location
        }
    }
    await this.clinicDocumentEntity.insert({
        clinicId : clinic.id,
        location_type,
        tel_1,
        tel_2,
        clinic_images : fileObject["clinic_images"],
        license : fileObject["license"],
        rent_agreement : fileObject["rent_agreement"],
    })
    return {message : "اطلاعات شما دریافت شد و در صف تایید قرار گرفتید"}
    }
    async addDoctor(docLicense : string, clinicId : number){
        const doc = await this.doctorService.findOneByLicense(docLicense)
        const clinic = await this.findById(clinicId)
        if(clinic.status === statusEnum.PENDING || clinic.status === statusEnum.REJECTED){
            throw new UnauthorizedException("کلینیک شما در حال حاضر امکان فعالبت ندارد.")
        }
        if(doc.clinicId !== 0){
            throw new ConflictException("این پزشک در یک کلینیک عضو میباشد")
        }else if(doc.category !== clinic.category){
            throw new ConflictException("حوزه کاری این پزشک در حیطه کاری کلینیک نمیباشد")
        }else if(!doc.mobile_verify || doc.status === statusEnum.PENDING || doc.status === statusEnum.REJECTED){
            throw new UnauthorizedException("پزشک معتبر نمیباشد")
        }
        doc.clinicId = clinic.id;
        clinic.doctorsCount += 1;
        await Promise.all([
            this.doctorRepository.save(doc),
            this.clinicRepository.save(clinic)
        ])
        return {message : `به پزشکان کلینیک اضافه گردید ${doc.first_name} ${doc.last_name} پزشک`}
        
    }
    async checkTelephone(phone: string) {
        if (phone && isPhoneNumber(phone, "IR")) {
            const existPhone = await this.clinicDocumentEntity.findOneBy([
            {tel_1: phone},
            {tel_2: phone},
            ]);
            if (existPhone) throw new ConflictException("تلفن وارد شده تکراری میباشد");
        }
    }
    async findById(id: number) {
        const clinic = await this.clinicRepository.findOne({
            where : {
                id,
            },
            relations : {doctors : true}
        })
        if(!clinic) throw new NotFoundException("کلینیک یافت نشد")
        return clinic
    }
    async confirmation(id : number ,confirmationDto : ClinicConformationDto){
        const { status, message } = confirmationDto
        if(status === statusEnum.REJECTED && !message){
            throw new BadRequestException("برای رد کردن توضیحات نمیتواند خالی باشد.")
        }
        const clinic = await this.findById(id)
        const doc = await this.doctorService.findOneByMobile(clinic.manager_mobile)
        if(status === statusEnum.ACCEPTED){
            doc.clinicId = clinic.id
            clinic.doctorsCount +=1
            await this.doctorRepository.save(doc)
        }
        clinic.status = status
        clinic.reason = message
        clinic.statusCheck_at = new Date()
        await this.clinicRepository.save(clinic)    
        return {message : `تغیر کرد ${status} وضعیت کلینیک به`}
    }
    async DisQualification(id : number , disQualification : ClinicDisQualificationDto){
        const { status, message } = disQualification
        const clinic = await this.findById(id)
        clinic.status = status
        clinic.reason = message
        clinic.disQualified_at = new Date()
        await this.clinicRepository.save(clinic)    
        return {message : "کلینیک رد صلاحیت شد."}
    }
    async remove(id: number) {
        await this.findById(id)
        await this.clinicRepository.delete({id})
        return {message : "کلینیک با موفقیت حذف شد."}
      }

}