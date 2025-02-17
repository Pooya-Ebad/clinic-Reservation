import { Controller, Get, Query } from "@nestjs/common";
import { GlobalSearchDto } from "./dto/search.dto";
import { SearchService } from "./search.service";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Pagination } from "src/common/decorators/pagination.decorator";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Controller("search")
@ApiBearerAuth("Authorization")
@ApiTags("Search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}
  @Pagination()
  @Get()
  @ApiOperation({
    summary: "global search for doctors and clinics",
    description: "only returns the accepted cases",
  })
  @ApiResponse({
    status: 200,
    description: "when result found",
    example: {
      pagination: {
        total_count: 2,
        page: 0,
        limit: "10",
        skip: 0,
      },
      clinics: [
        {
          id: 2,
          name: "Noor",
          categoryId: 1,
          slug: "noor",
          province: "1",
          city: "1",
        },
      ],
      doctors: [
        {
          id: 1,
          fullname: "Pooya Ebadollahi",
          categoryId: 1,
          Medical_License_number: 12345,
          description: "Fortunately i'm not a doctor.",
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: "if no result found",
    example: {
      message: "نتیحه ای یافت نشد.",
      error: "Not Found",
      statusCode: 404,
    },
  })
  search(
    @Query() searchDto: GlobalSearchDto,
    @Query() paginationDto: PaginationDto
  ) {
    return this.searchService.search(searchDto, paginationDto);
  }
}
