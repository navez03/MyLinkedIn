import { IsNotEmpty, IsString } from 'class-validator';

export class GetUserProfileDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export interface UserProfileResponseDto {
  success: boolean;
  data?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  };
  message?: string;
}
