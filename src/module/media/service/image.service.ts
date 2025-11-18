import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as path from 'path';
import { AwsS3Service } from "src/module/aws/s3/s3.service";

@Injectable()
export class ImageService {
    private readonly cloudFronDomain: string;
    constructor(
        private readonly awsS3Service: AwsS3Service,
        private readonly configService: ConfigService,
    ) {
        this.cloudFronDomain = this.configService.get<string>('cloudfront.domain', '');
    }

    async uploadImage(file: Express.Multer.File) {
        const imageId = crypto.randomUUID();
        const fileExtension = path.extname(file.originalname);
        const originalKey = `images/${imageId}${fileExtension}`;
        await this.awsS3Service.uploadFile(file, originalKey);
        return { url: `${this.cloudFronDomain}/${originalKey}`, key: originalKey };
    }

    async deleteImage(imageKey: string) {
        await this.awsS3Service.deleteFile(imageKey);
    }
}