/**
 * Authentication form data types
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface DeleteAccountFormData {
  confirmationPassword: string;
}

/**
 * Authentication response types
 */
export interface AuthErrorResponse {
  error: string;
  message: string;
}

export interface AuthSuccessResponse {
  success: true;
  message: string;
}
