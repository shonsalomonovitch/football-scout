export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  statusCode: number;
  message: string;
  path: string;
  timestamp: string;
}
