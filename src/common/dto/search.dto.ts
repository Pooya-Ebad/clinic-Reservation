import { ApiPropertyOptional } from "@nestjs/swagger";
import { statusEnum } from "../enums/status.enum";


export class SearchDto{
    @ApiPropertyOptional()
    search : string
    @ApiPropertyOptional()
    to_date : string
    @ApiPropertyOptional()
    from_date : string
    @ApiPropertyOptional({enum : statusEnum})
    status : string
}