export interface FieldError {
  message: string
  type: string
}

export type FieldErrors = Record<string, FieldError>
