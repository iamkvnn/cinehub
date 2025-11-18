import { Controller, Delete, Param, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { PosterService } from "../service/poster.service";
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PosterType } from "../const/poster.const";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags('Poster')
@Controller('posters')
export class PosterController {
    constructor(private readonly posterService: PosterService) {}

    @Post()
    @ApiOperation({ summary: 'Tạo poster cho phim' })
    @ApiQuery({ name: 'type', enum: PosterType})
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
        required: ['file'],
      },
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiResponse({
      status: 201,
      description: 'Tạo poster thành công',
    })
    async addPoster(
        @Query('filmId') filmId: string,
        @Query('type') type: PosterType,
        @UploadedFile() file: Express.Multer.File,
    ) {
      await this.posterService.createPoster(filmId, file, type);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa poster' })
    @ApiResponse({
      status: 200,
      description: 'Xóa poster',
    })
    async deletePoster(@Param('id') id: string) {
      await this.posterService.deletePoster(id);
    }
}