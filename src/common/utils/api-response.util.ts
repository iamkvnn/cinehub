import { ApiResponseDto, PaginatedApiResponseDto } from '../dto';

export function createApiResponse(data: any): ApiResponseDto {
  const response = new ApiResponseDto();
  response.data = data;
  return response;
}

export function createPaginatedApiResponse(
  data: any[],
  totalItems: number,
  currentPage: number,
  itemsPerPage: number,
): PaginatedApiResponseDto {
  const response = new PaginatedApiResponseDto();
  response.data = data;
  response.totalItems = totalItems;
  response.currentPage = currentPage;
  response.totalPages = Math.ceil(totalItems / itemsPerPage);
  response.itemsPerPage = itemsPerPage;
  return response;
}
