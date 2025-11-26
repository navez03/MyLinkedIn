import { IsUUID, IsString, IsOptional, Length } from 'class-validator';

export class RepostDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  comment?: string | null;
}
