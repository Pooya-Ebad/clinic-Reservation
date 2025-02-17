import { Injectable, NotFoundException } from '@nestjs/common';
import { GlobalSearchDto } from './dto/search.dto';
import { clinicService } from '../clinic/clinic.service';
import { DoctorsService } from '../doctors/doctors.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { pagination, PaginationGenerator } from 'src/common/utility/function.utils';
import { statusEnum } from 'src/common/enums/status.enum';


@Injectable()
export class SearchService {
    constructor(
        private readonly clinicsService : clinicService,
        private readonly doctorsService : DoctorsService,

    ) {}

    async search(searchDto : GlobalSearchDto, paginationDto : PaginationDto){
        const { limit, page } = pagination(paginationDto) 
        const { search } = searchDto
        const {clinic, pagination: clinicsPagination} = await this.clinicsService.findClinic(paginationDto, {
            search,
            status : statusEnum.ACCEPTED,
            category : null,
            to_date : null,
            from_date : null
        })
        const clinicsResult = clinic.map(value => {
            return {
                id : value.id,
                name : value.name,
                categoryId : value.categoryId,
                slug : value.slug,
                province : value.province,
                city : value.city
            }
        })
        const {doctors, pagination: doctorsPagination} = await this.doctorsService.findDoctors(paginationDto, {
            search,
            status : statusEnum.ACCEPTED,
            mobile : null,
            category : null,
            availability : null,
            to_date : null,
            from_date : null,
        })
        const doctorsResult = doctors.map(value => {
            return {
                id : value.id,
                fullname : `${value.first_name} ${value.last_name}`,
                categoryId : value.categoryId,
                Medical_License_number : value.Medical_License_number,
                description : value.description
            }
        })
        if(doctorsResult.length == 0 && clinicsResult.length == 0)
            throw  new NotFoundException("نتیحه ای یافت نشد.");
        return {
            pagination : PaginationGenerator(page, limit, clinicsPagination.total_count + doctorsPagination.total_count),
            clinics : clinicsResult,
            doctors : doctorsResult
        }
    }
}