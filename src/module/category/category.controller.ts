import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards, UploadedFiles } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UploadFileS3 } from 'src/common/interceptors/upload-file.interceptor';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  // @ApiCreatedResponse({example : {message : "created"}})
  // @ApiOperation({summary : "category created"})
  @Post()
  @Roles([role.ADMIN])
  @ApiConsumes("multipart/form-data")
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

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }
  @Get(':id')
  findById(@Param('id') id :string) {
    return this.categoryService.findById(+id);
  }

  

  @Patch(':id')
  @ApiConsumes("multipart/form-data")
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
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoryService.update(+id, updateCategoryDto, image);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}


