import { Injectable } from "@nestjs/common";
import { Poster } from "../entity/poster.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ImageService } from "src/module/media/service/image.service";
import { FilmService } from "src/module/film/service/film.service";
import { PosterType } from "../const/poster.const";

@Injectable()
export class PosterService {
    constructor(
        @InjectRepository(Poster)
        private readonly posterRepository: Repository<Poster>,
        private readonly imageService: ImageService,
        private readonly filmService: FilmService,
    ) {}

    async createPoster(filmId: string, file: Express.Multer.File, type: PosterType) {
        await this.filmService.findOne(filmId);
        const { url, key } = await this.imageService.uploadImage(file);
        await this.posterRepository.save({
            url, key,
            type,
            filmId,
        });
    }

    async deletePoster(posterId: string) {
        const poster = await this.posterRepository.findOneBy({ id: posterId });
        if (poster) {
            await this.imageService.deleteImage(poster.key);
            await this.posterRepository.delete(posterId);
        }
    }
}