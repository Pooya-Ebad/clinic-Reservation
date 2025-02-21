import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm'
import { CategoryEntity } from './entities/category.entity';
import { Repository } from 'typeorm';
import { S3Service } from '../S3/S3.service';
import { categoryJson, isBoolean, toBoolean, updateJson } from 'src/common/utility/function.utils';
import slugify from 'slugify';
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity) private categoryRepository : Repository<CategoryEntity>,
    private s3service : S3Service
  ){}
  async create(createCategoryDto: CreateCategoryDto , image : Express.Multer.File[]) {
    let { description , parentId, show, slug, title }= createCategoryDto
    slug = slugify(slug)
    let destination : string;
    const category = await this.categoryRepository.findOneBy({slug})
    
    if(category) 
      throw new ConflictException("کتگوری از قبل وجود دارد")
    if(image.length > 0){
      const { Location } = await this.s3service.uploadFile(image[0],"Doctors")
      destination = Location
    }
    if(isBoolean(show)){
      show = toBoolean(show)
    }
    if(parentId && !isNaN(parentId)){
      await this.findById(+parentId)
    }else{parentId = null}
    await this.categoryRepository.insert({
      description,
      image : destination,
      parentId ,
      show,
      slug,
      title
    })
    categoryJson(slug,title)
    return {message : "کتگوری ساخته شد"}
  }

  async findAll() {
    const categories = await this.categoryRepository.find({
      where : {},
      relations : {
        children : true,
        parent : true
      },
      select : {
        children : { id : true, slug :true },
        parent : { id : true, slug :true },
      }
    })
    if(categories.length === 0){
      throw new NotFoundException("هیج نتیجه ای یافت نشد")
    }
    return categories
  }

  async findBySlug(slug: string) {
    const category = await this.categoryRepository.findOneBy({slug})
    if(!category) throw new NotFoundException("کتگوری مورد نظر یافت نشد")
    return category
  }
  async findById(id: number) {
    const category = await this.categoryRepository.findOne({
      where :  { id },
      relations : {
        children : true,
        parent : true
      },
      select : {
        children : { id : true, slug :true },
        parent : { id : true, slug :true },
      }
    })
    if(!category) throw new NotFoundException("کتگوری مورد نظر یافت نشد")
    return category
  }
  async findByTitle(title: string) {
    const category = await this.categoryRepository.findOneBy({title})
    if(!category) throw new NotFoundException("کتگوری مورد نظر یافت نشد")
    return category
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto, image : Express.Multer.File[] = null) {
    let { description, parentId, show, slug, title } = updateCategoryDto
    slug = slugify(slug)
    let destination : string;
    const updateData: any = {};
    const [slugSearch,category] = await Promise.all([
      this.categoryRepository.findOneBy({slug}),
      this.findById(id)
    ])
    if(slugSearch)
      throw new ConflictException("کتگوری از قبل وجود دارد")
    if(image.length > 0){
      const { Location } = await this.s3service.uploadFile(image[0],"Doctors")
      destination = Location
    }
    if(isBoolean(show)){
      show = toBoolean(show)
      updateData.show = show
    }
    if(parentId && !isNaN(parentId)){
      await this.findById(+parentId)
      updateData.parentId = parentId
    }
    if (description) updateData.description = description;
    if (destination) updateData.image = destination;
    if (slug) updateData.slug = slug;
    if (title) updateData.title = title;
    updateJson(category.slug, slug, title)
    await this.categoryRepository.update({id},{
      ...updateData
    })
    return {message : "کتگوری مورد نظر اپدیت شد"}
  }

  async remove(id: number) {
    await this.findById(id)
    await this.categoryRepository.delete({id})
    return {message : "کتگوری مورد نظر با موفقیت پاک شد"}
  }
}
