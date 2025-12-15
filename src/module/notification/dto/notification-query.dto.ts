import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginatedApiQuery } from 'src/common/dto/paginated-query.dto';

export class NotificationQueryDto extends PaginatedApiQuery {
  @ApiProperty({
    description: 'Lọc theo trạng thái (UNREAD, READ)',
    required: false,
  })
  @IsOptional()
  status?: string;
}
