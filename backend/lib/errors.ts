export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiError = {
  success: false
  error: {
    code: string
    message: string
    fieldErrors?: Record<string, string>
    formErrors?: string[]
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return { success: true, data }
}

export function apiError(
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
  formErrors?: string[]
): ApiError {
  return {
    success: false,
    error: { code, message, fieldErrors, formErrors }
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]
