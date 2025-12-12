import { Injectable } from '@nestjs/common';
import { CloudFrontService } from 'src/module/aws/service/cloudfront.service';
import { FilmService } from 'src/module/film/service/film.service';
import { VideoService } from 'src/module/media/service/video.service';
import { StreamingDto } from '../dto/stream.dto';
import { UserService } from 'src/module/user/service/user.service';
import { Video } from 'src/module/film/entity/video.entity';
import { AwsS3Service } from 'src/module/aws/service/s3.service';

@Injectable()
export class StreamService {
  constructor(
    private readonly cloudFrontService: CloudFrontService,
    private readonly s3Service: AwsS3Service,
    private readonly videoService: VideoService,
    private readonly filmService: FilmService,
    private readonly userService: UserService,
  ) {}

  async getStreamingUrl(
    //userId: string,
    filmId: string,
    season?: number,
    episode?: number,
  ): Promise<string> {
    //const user = await this.userService.findById(userId);
    await this.filmService.verifyFilmType(filmId, season, episode);
    const video = await this.videoService.findOne(filmId, season, episode);
    let masterContent = await this.s3Service.getHLSFile(video.key);
    if (!masterContent) {
      throw new Error('HLS master file not found for video: ' + video.id);
    }
    masterContent = this.filterMaster(masterContent, ['720', '480', '360']);
    masterContent = this.signUrls(masterContent, video);
    return masterContent;
  }

  private filterMaster(content: string, allowed: string[]) {
    return content
      .split('\n')
      .filter((line) => {
        if (line.endsWith('.m3u8')) {
          const folder = line.split('/')[0];
          return allowed.includes(folder);
        } else if (line.startsWith('#EXT-X-STREAM-INF')) {
          const resolutionMatch = line.match(/RESOLUTION=\d+x(\d+)/);
          if (resolutionMatch && resolutionMatch[1]) {
            return allowed.includes(resolutionMatch[1]);
          }
        }
        return true;
      })
      .join('\n');
  }

  signUrls(masterContent: string, video: Video): string {
    return masterContent.replace(/(\d+\/index\.m3u8)/g, (match) =>
      this.cloudFrontService.generateSignedUrl(`${video.key}/${match}`, 60),
    );
  }
}
