import { IsEmail, IsOptional, IsUUID } from 'class-validator';

export class SendConnectionRequestDto {
  @IsUUID()
  senderId: string;

  @IsOptional()
  @IsUUID()
  receiverId?: string;

  @IsOptional()
  @IsEmail()
  receiverEmail?: string;
}
