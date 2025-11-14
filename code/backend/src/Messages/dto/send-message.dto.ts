import { IsUUID, IsString, Length, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  senderId: string;

  @IsUUID()
  receiverId: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  content?: string;

  @IsOptional()
  postId?: string;

  @IsOptional()
  eventId?: string;
}
