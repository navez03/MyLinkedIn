import { IsString, MinLength, IsOptional, IsUrl } from 'class-validator';
import { MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(30, { message: 'Name is too long' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid avatar URL' })
  avatar_url?: string;
}