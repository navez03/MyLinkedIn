import { IsNotEmpty, IsString } from 'class-validator';

export class GetAllUsersDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export interface GetAllUsersResponseDto {
  success: boolean;
  message: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  }>;
  error?: string;
}
