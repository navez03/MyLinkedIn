import { IsString } from 'class-validator';

export class RejectConnectionRequestDto {
  @IsString()
  requestId: string;
}