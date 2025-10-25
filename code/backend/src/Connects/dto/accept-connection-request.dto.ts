import { IsInt, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AcceptConnectionRequestDto {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  requestId: number;

  @IsString()
  userId: string;
}
