import { IsNotEmpty, IsString } from 'class-validator';

export class GetAllUsersDto {
  @IsString()
  @IsNotEmpty()
  userId: string; // The current user's ID to exclude from the results
}

export interface GetAllUsersResponseDto {
  success: boolean;
  message: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  error?: string;
}
