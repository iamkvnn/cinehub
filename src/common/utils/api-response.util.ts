import { ApiResponse, PaginatedApiResponse } from "../dto";

export function createApiResponse(data: any): ApiResponse {
  const response = new ApiResponse();
  response.data = data;
  return response;
}

export function createPaginatedApiResponse(
  data: any[],
  totalItems: number,
  currentPage: number,
  totalPages: number,
): PaginatedApiResponse {
  const response = new PaginatedApiResponse();
  response.data = data;
  response.totalItems = totalItems;
  response.currentPage = currentPage;
  response.totalPages = totalPages;
  return response;
}