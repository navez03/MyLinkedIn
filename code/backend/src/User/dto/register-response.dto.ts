export class RegisterResponseDto {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
  };
  error?: string;
}