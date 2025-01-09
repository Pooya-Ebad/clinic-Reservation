import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClinicEntity } from "./entity/clinic.entity";
import { Repository } from "typeorm";
import { S3Service } from "../S3/S3.service";
import { ClinicDocumentDto, CreateClinicDto } from "./dto/clinic.dto";
import { CategoryEntity } from "../category/entities/category.entity";
import { TokenPayload } from "src/common/types/payload";
import { isPhoneNumber } from "class-validator";
import { ClinicDocumentEntity } from "./entity/Document.entity";
import { getCityAndProvinceNameByCode } from "src/common/utility/address.utils";
import slugify from "slugify";
import { DoctorEntity } from "../doctors/entities/doctor.entity";

@Injectable()
export class clinicService {
    constructor(
        @InjectRepository(ClinicEntity) private clinicRepository : Repository<ClinicEntity>,
        @InjectRepository(CategoryEntity) private categoryRepository : Repository<CategoryEntity>,
        @InjectRepository(ClinicDocumentEntity) private clinicDocumentEntity : Repository<ClinicDocumentEntity>,
        @InjectRepository(DoctorEntity) private doctorRepository : Repository<DoctorEntity>,
        private s3Service : S3Service
    ){}
    async create(createClinicDto: CreateClinicDto , user : TokenPayload) {
    let { name,  address, city, province, category }= createClinicDto
    const {provinceName, cityName} = getCityAndProvinceNameByCode(province,city)
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
    async checkTelephone(phone: string) {
        if (phone && isPhoneNumber(phone, "IR")) {
            const existPhone = await this.clinicDocumentEntity.findOneBy([
            {tel_1: phone},
            {tel_2: phone},
            ]);
            if (existPhone) throw new ConflictException("تلفن وارد شده تکراری میباشد");
        }
      }
    
}