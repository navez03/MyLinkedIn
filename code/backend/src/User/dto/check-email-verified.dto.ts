import { IsNotEmpty, IsString } from 'class-validator';

export class CheckEmailVerifiedDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class CheckEmailVerifiedResponseDto {
  success: boolean;
  isVerified: boolean;
  message: string;
}
