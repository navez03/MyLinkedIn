import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  email: string;
}
