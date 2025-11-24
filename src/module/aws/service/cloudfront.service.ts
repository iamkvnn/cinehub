import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import * as fs from 'fs';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

@Injectable()
export class CloudFrontService {
  private readonly distributionId: string;
  private readonly cloudfrontDomain: string;
  private readonly keyPairId: string;
  private readonly privateKey: string;
  private readonly cloudfront: CloudFrontClient;
  private readonly logger = new Logger(CloudFrontService.name);

  constructor(private readonly configService: ConfigService) {
    this.distributionId = this.configService.get<string>('aws.cloudfront.distributionId', '');
    this.cloudfrontDomain = this.configService.get<string>('aws.cloudfront.domain', '')
    this.keyPairId = this.configService.get<string>('aws.cloudfront.keyPairId', '');
    const privateKeyPath = this.configService.get<string>('aws.cloudfront.privateKeyPath', '');
    this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    this.cloudfront = new CloudFrontClient({
        region: 'us-east-1',
        credentials: {
            accessKeyId: this.configService.get<string>('aws.accessKey', ''),
            secretAccessKey: this.configService.get<string>('aws.secretKey', ''),
        }
    });
  }

  generateSignedUrl(resourcePath: string, expirationMinutes: number = 60): string {
    const url = `https://${this.cloudfrontDomain}/${resourcePath}`;
    const dateLessThan = new Date(Date.now() + expirationMinutes * 60 * 1000);

    const signedUrl = getSignedUrl({
      url,
      keyPairId: this.keyPairId,
      dateLessThan: dateLessThan.toISOString(),
      privateKey: this.privateKey,
    });

    return signedUrl;
  }

  generateSignedCookies(resourcePath: string, expirationMinutes: number = 60) {
    const policy = {
      Statement: [
        {
          Resource: `https://${this.cloudfrontDomain}/${resourcePath}*`,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': Math.floor(Date.now() / 1000) + expirationMinutes * 60,
            },
          },
        },
      ],
    };

    return {
      'CloudFront-Policy': Buffer.from(JSON.stringify(policy)).toString('base64'),
      'CloudFront-Signature': 'signature-here',
      'CloudFront-Key-Pair-Id': this.keyPairId,
    };
  }

  getCloudfrontUrl(key: string): string {
    return `https://${this.cloudfrontDomain}/${key}`;
  }

  async invalidateCache(paths: string[]) {
    const timestamp = Date.now().toString();

    const command = new CreateInvalidationCommand({
        DistributionId: this.distributionId,
        InvalidationBatch: {
            CallerReference: timestamp,
            Paths: {
                Quantity: paths.length,
                Items: paths,
            }
        }
    });

    const result = await this.cloudfront.send(command);
    this.logger.log(`Invalidation created with ID: ${result.Invalidation?.Id}`);
  }
}