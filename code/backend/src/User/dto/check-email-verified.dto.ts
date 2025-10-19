import { IsNotEmpty, IsString } from 'class-validator';

export class CheckEmailVerifiedDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
