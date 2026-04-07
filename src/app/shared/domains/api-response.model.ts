export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface ApiResponseSuccess {
  success: boolean;
  message: string;
}
