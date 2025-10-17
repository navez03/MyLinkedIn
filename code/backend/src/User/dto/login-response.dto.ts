export class LoginResponseDto {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  email: string;
}
