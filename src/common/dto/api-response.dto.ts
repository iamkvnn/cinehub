import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

export class ApiResponse {
  data?: any;
}

export class PaginatedApiResponse {
  data: any[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

class ApiResponseMeta {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success = true;
  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp = new Date().toISOString();
  @ApiProperty({ description: 'Path of the request' })
  path = '';
};

export const ApiResponseDto = <TModel extends Type<any>>(model: TModel) => {
  class ApiResponseDto extends ApiResponseMeta {
    @ApiProperty({ type: model, description: 'Response data' })
    declare data?: InstanceType<TModel>;
  }
  return ApiResponseDto;
};

export const PaginatedApiResponseDto = <TModel extends Type<any>>(model: TModel) => {
  class PaginatedResponseDto extends ApiResponseMeta {
    @ApiProperty({ type: [model], description: 'Response data list' })
    declare data: InstanceType<TModel>[];

    @ApiProperty({ description: 'Total number of items' })
    totalItems = 0;

    @ApiProperty({ description: 'Total number of pages' })
    totalPages = 0;

    @ApiProperty({ description: 'Current page number' })
    currentPage = 0;
  }
  return PaginatedResponseDto;
};
