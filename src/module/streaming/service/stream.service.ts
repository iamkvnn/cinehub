import { Injectable } from "@nestjs/common";
import { CloudFrontService } from "src/module/aws/service/cloudfront.service";
import { FilmService } from "src/module/film/service/film.service";
import { VideoService } from "src/module/media/service/video.service";
import { StreamingDto } from "../dto/stream.dto";

@Injectable()
export class StreamService {
    constructor(
        private readonly cloudFrontService: CloudFrontService,
        private readonly videoService: VideoService,
        private readonly filmService: FilmService,
    ) {}

    async getStreamingUrl(filmId: string, season?: number, episode?: number): Promise<StreamingDto> {
        await this.filmService.verifyFilmType(filmId, season, episode);
        const video = await this.videoService.findOne(filmId, season, episode);
        return { url: video.url };
    }
}