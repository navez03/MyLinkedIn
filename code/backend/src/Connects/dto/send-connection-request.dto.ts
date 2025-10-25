import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SendConnectionRequestDto {
  @IsString()
  senderId: string;

  @IsOptional()
  @IsString()
  receiverId?: string;

  @IsOptional()
  @IsEmail()
  receiverEmail?: string;
}
