import { IsUUID } from 'class-validator';

export class RejectConnectionRequestDto {
  @IsUUID()
  requestId: string;
}