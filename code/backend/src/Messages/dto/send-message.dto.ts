import { IsUUID, IsString, Length } from 'class-validator';

export class SendMessageDto {

  @IsUUID()
  receiverId: string;

  @IsString()
  @Length(1, 1000)
  content: string;
}
