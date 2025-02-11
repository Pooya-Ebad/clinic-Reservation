import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCategoryDto {
    @ApiProperty()
    title : string
    @ApiProperty()
    slug : string
    @ApiPropertyOptional({format : "binary"})
    image : string
    @ApiPropertyOptional()
    description : string
    @ApiProperty()
    show : boolean
    @ApiPropertyOptional({nullable : true, example : ""})
    parentId : number
}
