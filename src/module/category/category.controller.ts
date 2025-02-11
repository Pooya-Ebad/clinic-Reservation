import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards, UploadedFiles } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UploadFileS3 } from 'src/common/interceptors/upload-file.interceptor';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { toMG } from 'src/common/utility/function.utils';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { role } from 'src/common/enums/role.enum';

@Controller('category')
@ApiBearerAuth("Authorization")
@ApiTags("Category")
// @UseGuards(AuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Roles([role.ADMIN])
  @ApiConsumes("multipart/form-data")
  @Post()
  @ApiOperation({summary : "category created"})
  @ApiResponse({
    status : 201,
    description : "if category was created successfully",
    example : {
      "message": "کتگوری ساخته شد"
    }
  })
  @ApiResponse({
    status : 409,
    description : "if category was already exists",
    example : {
      "message": "کتگوری از قبل وجود دارد",
      "error": "Conflict",
      "statusCode": 409
    }
  })
  @UseInterceptors(UploadFileS3("image"))
  create(
    @UploadedFiles(
      new ParseFilePipe({
        validators : [
          new MaxFileSizeValidator({maxSize : toMG(10)}),
          new FileTypeValidator({fileType : "image/(png|jpg|jpeg)"}),
        ],
        fileIsRequired : false,
      })
    
    ) image : Express.Multer.File[],
    @Body() createCategoryDto: CreateCategoryDto
  ) {
    return this.categoryService.create(createCategoryDto, image);
  }

  @Roles([role.ADMIN])
  @Get()
  @ApiOperation({summary : "get all categories"})
  @ApiResponse({
    status : 200,
    description : "if any category was found",
    example : [
      {
      "id": 3,
      "title": "'پوست و مو",
      "slug": "dermatology",
      "image": null,
      "description": "string",
      "show": true,
      "parentId": null,
      "children": [],
      "parent": null
    }
  ]
  })
  @ApiResponse({
    status : 404,
    description : "if no category was found",
    example : {
      "message": "هیج نتیجه ای یافت نشد",
      "error": "Not Found",
      "statusCode": 404
    }
  })
  findAll() {
    return this.categoryService.findAll();
  }

  @Roles([role.ADMIN])
  @Get(':category_id')
  @ApiOperation({summary : "search category by ID"})
  @ApiResponse({
    status : 200,
    description : "if any category was found",
    example : [
      {
      "id": 3,
      "title": "'پوست و مو",
      "slug": "dermatology",
      "image": null,
      "description": "string",
      "show": true,
      "parentId": null,
    }
  ]
  })
  @ApiResponse({
    status : 404,
    description : "if no category was found",
    example : {
      "message": "هیج نتیجه ای یافت نشد",
      "error": "Not Found",
      "statusCode": 404
    }
  })
  findById(@Param('category_id') Category_Id :string) {
    return this.categoryService.findById(+Category_Id);
  }

  @Roles([role.ADMIN])
  @ApiConsumes("multipart/form-data")
  @Patch(':category_id')
  @ApiOperation({summary : "update category information"})
  @ApiResponse({
    status : 200,
    description: "if operation was successful",
    example : {
      "message": "کتگوری مورد نظر اپدیت شد"
    }
  })
  @ApiResponse({
    status : 404,
    description : "if no category was found",
    example : {
      "message": "هیج نتیجه ای یافت نشد",
      "error": "Not Found",
      "statusCode": 404
    }
  })
  @UseInterceptors(UploadFileS3("image"))
  update(
    @UploadedFiles(
      new ParseFilePipe({
        validators : [
          new MaxFileSizeValidator({maxSize : toMG(10)}),
          new FileTypeValidator({fileType : "image/(png|jpg|jpeg)"})
        ],
        fileIsRequired : false
      })
    ) image : Express.Multer.File[],
    @Param('category_id') Category_Id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoryService.update(+Category_Id, updateCategoryDto, image);
  }

  @Roles([role.ADMIN])
  @Delete(':id')
  @ApiOperation({summary : "delete category"})
  @ApiResponse({
    status : 200,
    description: "if operation was successful",
    example : {
      "message": "کتگوری مورد نظر با موفقیت پاک شد"
    }
  })
  @ApiResponse({
    status : 404,
    description : "if no category was found",
    example : {
      "message": "هیج نتیجه ای یافت نشد",
      "error": "Not Found",
      "statusCode": 404
    }
  })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}


