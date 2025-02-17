import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClinicEntity } from "./entity/clinic.entity";
import { Repository } from "typeorm";
import { S3Service } from "../S3/S3.service";
import {
  ClinicConformationDto,
  ClinicDisQualificationDto,
  ClinicDocumentDto,
  ClinicSearchDto,
  CreateClinicDto,
} from "./dto/clinic.dto";
import { CategoryEntity } from "../category/entities/category.entity";
import { ClinicPayload, TokenPayload } from "src/common/types/payload";
import { isDate, isPhoneNumber } from "class-validator";
import { ClinicDocumentEntity } from "./entity/Document.entity";
import { getCityAndProvinceNameByCode } from "src/common/utility/address.utils";
import slugify from "slugify";
import { DoctorEntity } from "../doctors/entities/doctor.entity";
import { statusEnum } from "src/common/enums/status.enum";
import { DoctorsService } from "../doctors/doctors.service";
import { findOptionsEnum } from "src/common/enums/findOption.enum";
import { PaginationDto } from "src/common/dto/pagination.dto";
import {
  pagination,
  PaginationGenerator,
} from "src/common/utility/function.utils";

@Injectable()
export class clinicService {
  constructor(
    @InjectRepository(ClinicEntity)
    private clinicRepository: Repository<ClinicEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(ClinicDocumentEntity)
    private clinicDocumentRepository: Repository<ClinicDocumentEntity>,
    @InjectRepository(DoctorEntity)
    private doctorRepository: Repository<DoctorEntity>,
    private s3Service: S3Service,
    private doctorService: DoctorsService
  ) {}

  async create(createClinicDto: CreateClinicDto, user: TokenPayload) {
    let { name, address, city, province, category } = createClinicDto;
    const { provinceName, cityName } = getCityAndProvinceNameByCode(
      province,
      city
    );
    const categoryExists = await this.categoryRepository.findOneBy({
      title: category,
    });
    if (!categoryExists) throw new NotFoundException("کتگوری یافت نشد");
    const [doc, clinic] = await Promise.all([
      this.doctorRepository.findOneBy({ id: user.id }),
      this.clinicRepository.findOneBy({ manager_mobile: user.mobile }),
    ]);
    if (clinic) {
      await this.clinicRepository.update(
        { manager_mobile: user.mobile },
        {
          name,
          slug: slugify(name),
          categoryId: categoryExists.id,
          address,
          city: cityName,
          province: provinceName,
        }
      );
      return { message: "اطلاعات اولیه شما بروزرسانی شد" };
    }
    const new_clinic = this.clinicRepository.create({
      name,
      slug: slugify(name),
      categoryId: categoryExists.id,
      manager_mobile: doc.mobile,
      manager_name: `${doc.first_name} ${doc.last_name}`,
      address,
      city: cityName,
      province: provinceName,
    });
    const insertClinic = await this.clinicRepository.save(new_clinic);
    doc.clinicId = insertClinic.id;
    await this.doctorRepository.save(doc);
    return { message: "اطلاعات اولیه ثبت شد" };
  }

  async CreateDocument(
    clinicDocumentDto: ClinicDocumentDto,
    files: Express.Multer.File[],
    owner: ClinicPayload
  ) {
    let { location_type, tel_1, tel_2 } = clinicDocumentDto;
    let fileObject = {};
    const [clinic, documentExist] = await Promise.all([
      this.clinicRepository.findOneBy({ id: owner.id }),
      this.clinicDocumentRepository.findOneBy({ clinicId: owner.id }),
    ]);
    if (!clinic) throw new NotFoundException("لطفا مجدد تلاش کنید");
    if (documentExist)
      throw new ConflictException("شما قبلا اطلاعات خود را ثبت کرده اید");
    await this.checkTelephone(tel_1);
    await this.checkTelephone(tel_2);
    for (let file of files) {
      if (fileObject[file.fieldname]) {
        const { Location } = await this.s3Service.uploadFile(file, "clinic");
        fileObject[file.fieldname] =
          fileObject[file.fieldname] + `,${Location}`;
      } else {
        fileObject[file.fieldname] = (
          await this.s3Service.uploadFile(file, "clinic")
        ).Location;
      }
    }
    const document = this.clinicDocumentRepository.create({
      clinicId: clinic.id,
      location_type,
      tel_1,
      tel_2,
      clinic_images: fileObject["clinic_images"],
      license: fileObject["license"],
      rent_agreement: fileObject["rent_agreement"],
    });
    const insertDocument = await this.clinicDocumentRepository.save(document);
    clinic.documentsId = insertDocument.id;
    await this.clinicRepository.save(clinic);
    return { message: "اطلاعات شما دریافت شد و در صف تایید قرار گرفتید" };
  }

  async findClinic(paginationDto: PaginationDto, searchDto: ClinicSearchDto) {
    const { search, status, category, from_date, to_date } = searchDto;
    const { page, limit, skip } = pagination(paginationDto);
    const query = this.clinicRepository.createQueryBuilder("clinic");

    if (status) {
      query.andWhere("clinic.status = :status", { status });
    }
    if (category) {
      const categoryId = (
        await this.categoryRepository.findOneBy({ title: category })
      ).id;
      query.andWhere("clinic.categoryId = :categoryId", { categoryId });
    }
    if (
      to_date &&
      from_date &&
      isDate(new Date(from_date)) &&
      isDate(new Date(to_date))
    ) {
      let from = new Date(new Date(from_date).setUTCHours(0, 0, 0));
      let to = new Date(new Date(to_date).setUTCHours(0, 0, 0));
      query.andWhere("clinic.created_at BETWEEN :from AND :to", { from, to });
    } else if (from_date && isDate(new Date(from_date))) {
      let from = new Date(new Date(from_date).setUTCHours(0, 0, 0));
      query.andWhere("clinic.created_at >= :from", { from });
    } else if (to_date && isDate(new Date(to_date))) {
      let to = new Date(new Date(to_date).setUTCHours(0, 0, 0));
      query.andWhere("clinic.created_at <= :to", { to });
    }
    if (search && search.length >= 3) {
      query.andWhere(
        "clinic.name LIKE :search OR clinic.manager_name LIKE :search",
        { search: `%${search}%` }
      );
    } else if (search && search.length < 3) {
      throw new BadRequestException(
        "تعداد کاراکتر های سرچ نمیتواند کمتر از ۳ کاراکتر باشد."
      );
    }
    query.take(limit);
    query.skip(skip);
    query.orderBy("clinic.created_at", "DESC");
    const [clinic, count] = await query.getManyAndCount();
    return {
      pagination: PaginationGenerator(page, limit, count),
      clinic,
    };
  }

  async addDoctor(docLicense: string, clinicId: number) {
    const doc = await this.doctorService.findOneBy({
      Find_Option: findOptionsEnum.Medical_License,
      Value: docLicense,
    });
    const clinic = await this.findById(clinicId);
    if (
      clinic.status === statusEnum.PENDING ||
      clinic.status === statusEnum.REJECTED
    ) {
      throw new UnauthorizedException(
        "کلینیک شما در حال حاضر امکان فعالبت ندارد."
      );
    }
    if (doc.clinicId !== null) {
      throw new ConflictException("این پزشک در یک کلینیک عضو میباشد");
    } else if (doc.category !== clinic.category) {
      throw new ConflictException(
        "حوزه کاری این پزشک در حیطه کاری کلینیک نمیباشد"
      );
    } else if (
      !doc.mobile_verify ||
      doc.status === statusEnum.PENDING ||
      doc.status === statusEnum.REJECTED
    ) {
      throw new UnauthorizedException("پزشک معتبر نمیباشد");
    }
    doc.clinicId = clinic.id;
    clinic.doctorsCount += 1;
    await Promise.all([
      this.doctorRepository.save(doc),
      this.clinicRepository.save(clinic),
    ]);
    return { message: "پزشک با موفقیت به کلینیک شما اضافه گردید" };
  }

  async checkTelephone(phone: string) {
    if (phone && isPhoneNumber(phone, "IR")) {
      const existPhone = await this.clinicDocumentRepository.findOneBy([
        { tel_1: phone },
        { tel_2: phone },
      ]);
      if (existPhone)
        throw new ConflictException("تلفن وارد شده تکراری میباشد");
    }
  }

  async findById(id: number) {
    const clinic = await this.clinicRepository.findOne({
      where: {
        id,
      },
      relations: { doctors: true },
    });
    if (!clinic) throw new NotFoundException("کلینیک یافت نشد");
    return clinic;
  }

  async confirmation(id: number, confirmationDto: ClinicConformationDto) {
    const { status, message } = confirmationDto;
    if (status === statusEnum.REJECTED && !message) {
      throw new BadRequestException("برای رد کردن توضیحات نمیتواند خالی باشد.");
    }
    const clinic = await this.findById(id);
    const doc = await this.doctorService.findOneBy({
      Find_Option: findOptionsEnum.Mobile,
      Value: clinic.manager_mobile,
    });
    if (status === statusEnum.ACCEPTED) {
      doc.clinicId = clinic.id;
      clinic.doctorsCount += 1;
      await this.doctorRepository.save(doc);
    }
    clinic.status = status;
    clinic.reason = message;
    clinic.statusCheck_at = new Date();
    await this.clinicRepository.save(clinic);
    return { message: `تغیر کرد ${status} وضعیت کلینیک به` };
  }

  async DisQualification(
    id: number,
    disQualification: ClinicDisQualificationDto
  ) {
    const { status, message } = disQualification;
    const clinic = await this.findById(id);
    clinic.status = status;
    clinic.reason = message;
    clinic.disQualified_at = new Date();
    await this.clinicRepository.save(clinic);
    return { message: "کلینیک رد صلاحیت شد." };
  }

  async remove(id: number) {
    await this.findById(id);
    await this.clinicRepository.delete({ id });
    return { message: "کلینیک با موفقیت حذف شد." };
  }
  
  async getAppointments(status: string) {
    let docPromise = [];
    let list_of_appointment = [];
    const doctors = await this.clinicRepository.find({
      select: {
        id: true,
        doctors: { id: true },
      },
      relations: { doctors: true },
    });
    for (let doctor of doctors) {
      doctor.doctors.map((value) => {
        docPromise.push(
          this.doctorRepository.find({
            where: {
              id: value.id,
            },
            relations: { appointments: { user: true } },
          })
        );
      });
    }
    const resolvedDocPromises = await Promise.all(docPromise);
    docPromise = resolvedDocPromises.map((value) => {
      return value.map((index) => {
        return index.appointments.map((detail) => {
          if (status === "ALL") {
            const { user, id, doctorId, created_at, ...other_detail } = detail;
            return {
              doctor_name: index.first_name + ` ${index.last_name}`,
              patient_name:
                detail.user.first_name + ` ${detail.user.last_name}`,
              ...other_detail,
            };
          } else if (detail.status === status) {
            const { user, id, doctorId, created_at, ...other_detail } = detail;
            return {
              doctor_name: index.first_name + ` ${index.last_name}`,
              patient_name:
                detail.user.first_name + ` ${detail.user.last_name}`,
              ...other_detail,
            };
          }
        });
      });
    });
    for (const element of docPromise) {
      const available_appointment = element[0].filter(
        (value) => value !== undefined
      );
      if (available_appointment.length > 0) {
        list_of_appointment.push(available_appointment);
      }
    }
    if (list_of_appointment.length == 0)
      throw new NotFoundException("هیج نوبت ویزیتی یافت نشد.");
    return list_of_appointment;
  }
}
