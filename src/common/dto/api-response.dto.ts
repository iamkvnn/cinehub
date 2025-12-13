import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

export class ApiResponseDto {
  data?: any;
}

export class PaginatedApiResponseDto {
  data: any[];
  totalItems: number;
  totalPages: number;
  itemsPerPage: number;
  currentPage: number;
}

class ApiResponseMeta {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean = true;
  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: string = new Date().toISOString();
  @ApiProperty({ description: 'Path of the request' })
  path: string = '';
}

export const createApiResponseDto = <TModel extends Type<any>>(
  model: TModel,
) => {
  class ApiResponseDto extends ApiResponseMeta {
    @ApiProperty({ type: model, description: 'Response data' })
    declare data?: InstanceType<TModel>;
  }

  Object.defineProperty(ApiResponseDto, 'name', {
    value: `${model.name.replace('Dto', '')}ApiResponseDto`,
  });
  return ApiResponseDto;
};

export const createPaginatedApiResponseDto = <TModel extends Type<any>>(
  model: TModel,
) => {
  class PaginatedResponseDto extends ApiResponseMeta {
    @ApiProperty({ type: [model], description: 'Response data list' })
    declare data: InstanceType<TModel>[];

    @ApiProperty({ description: 'Total number of items' })
    totalItems: number = 0;

    @ApiProperty({ description: 'Total number of pages' })
    totalPages: number = 0;

    @ApiProperty({ description: 'Number of items per page' })
    itemsPerPage: number = 0;

    @ApiProperty({ description: 'Current page number' })
    currentPage: number = 0;
  }

  Object.defineProperty(PaginatedResponseDto, 'name', {
    value: `Paginated${model.name.replace('Dto', '')}ApiResponseDto`,
  });
  return PaginatedResponseDto;
};
