import { Injectable, Logger } from '@nestjs/common';
import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { DEFAULT_LADDER } from '../const/const';
import { VideoResolution } from '../dto/dto';

@Injectable()
export class TransformService {
  private readonly logger = new Logger(TransformService.name);

  getVideoResolution(filePath: string) {
    try {
      const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=height,width -of json "${filePath}"`;
      const output = execSync(cmd).toString();
      const json = JSON.parse(output);
      return {
        width: json.streams[0].width,
        height: json.streams[0].height,
      } as VideoResolution;
    } catch (err) {
      this.logger.error('FFprobe error: ' + (err as Error).message);
      throw err;
    }
  }

  async convertToHLS(
    inputPath: string,
    outputDir: string,
    videoHeight?: number,
  ): Promise<boolean> {
    this.logger.log(`Starting HLS conversion for ${inputPath}...`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const inputHeight = this.getVideoResolution(inputPath).height;
    const ladder = DEFAULT_LADDER.filter((r) => r.height <= inputHeight);
    if (ladder.length === 0) {
      this.logger.error('No suitable output resolutions.');
      return false;
    }

    const splitCount = ladder.length;
    const splitOutputs = ladder.map((_, i) => `[v${i}]`).join('');
    let filterComplex = `[0:v]split=${splitCount}${splitOutputs};`;

    ladder.forEach((r, i) => {
      if (r.height === inputHeight) {
        filterComplex += ` [v${i}]copy[v${i}out];`;
      } else {
        filterComplex += ` [v${i}]scale=-2:${r.height}[v${i}out];`;
      }
    });

    if (filterComplex.endsWith(';')) filterComplex = filterComplex.slice(0, -1);

    const maps: string[] = [];
    const varStreamMap: string[] = [];

    ladder.forEach((r, i) => {
      maps.push(
        '-map',
        `[v${i}out]`,
        '-c:v:' + i,
        'libx264',
        '-x264-params',
        'nal-hrd=cbr:force-cfr=1',
        '-b:v:' + i,
        r.vBitrate,
        '-maxrate:v:' + i,
        r.vBitrate,
        '-minrate:v:' + i,
        r.vBitrate,
        '-bufsize:v:' + i,
        r.bufSize,
        '-preset',
        'veryfast',
        '-g',
        '48',
        '-sc_threshold',
        '0',
        '-keyint_min',
        '48',

        '-map',
        '0:a:0',
        '-c:a:' + i,
        'aac',
        '-b:a:' + i,
        r.aBitrate,
        '-ac',
        '2',
      );
      varStreamMap.push(`v:${i},a:${i}`);
    });

    const args = [
      '-i',
      inputPath,
      '-filter_complex',
      filterComplex,
      ...maps,
      '-f',
      'hls',
      '-hls_time',
      '10',
      '-hls_playlist_type',
      'vod',
      '-hls_flags',
      'independent_segments',
      '-hls_segment_type',
      'mpegts',
      '-hls_segment_filename',
      path.join(outputDir, '%v/seg%06d.ts'),
      '-master_pl_name',
      'master.m3u8',
      '-var_stream_map',
      varStreamMap.join(' '),
      path.join(outputDir, '%v/index.m3u8'),
      '-y',
    ];

    // this.logger.log("FFmpeg args: " + args.join(" "));

    return new Promise<boolean>((resolve) => {
      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.on('error', (err) => {
        this.logger.error('FFmpeg failed to start: ' + err.message);
        resolve(false);
      });

      // ffmpeg.stderr.on("data", data => {
      //     this.logger.log("[FFmpeg] " + data.toString());
      // });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          ladder.forEach((r, i) => {
            const oldDir = path.join(outputDir, i.toString());
            const newDir = path.join(outputDir, r.height.toString());

            if (fs.existsSync(oldDir)) {
              fs.renameSync(oldDir, newDir);
            }
          });

          const masterPath = path.join(outputDir, 'master.m3u8');
          let masterContent = fs.readFileSync(masterPath, 'utf-8');

          ladder.forEach((r, i) => {
            const oldPathForward = `${i}/index.m3u8`;
            const oldPathBackward = `${i}\\index.m3u8`;
            const newPath = `${r.height}/index.m3u8`;

            masterContent = masterContent.replace(
              new RegExp(oldPathForward.replace(/\//g, '\\/'), 'g'),
              newPath,
            );
            masterContent = masterContent.replace(
              new RegExp(oldPathBackward.replace(/\\/g, '\\\\'), 'g'),
              newPath,
            );
          });

          fs.writeFileSync(masterPath, masterContent, 'utf-8');
          // this.logger.log("HLS conversion completed successfully.");
          resolve(true);
        } else {
          this.logger.error('FFmpeg failed, code: ' + code);
          resolve(false);
        }
      });
    });
  }
}
