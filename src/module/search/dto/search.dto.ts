import { ApiPropertyOptional } from "@nestjs/swagger";

export class GlobalSearchDto {
    @ApiPropertyOptional({ description: "At least 3 characters are required" })
    search: string;
}