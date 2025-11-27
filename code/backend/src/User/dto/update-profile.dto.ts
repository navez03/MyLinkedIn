import { IsString, MinLength, IsOptional, IsUrl, ValidateIf, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(30, { message: 'Name is too long' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Convert empty strings to null
    if (value === '' || value === undefined) {
      return null;
    }
    return value;
  })
  @ValidateIf((o) => o.avatar_url !== null && o.avatar_url !== undefined)
  @IsUrl({}, { message: 'Invalid avatar URL' })
  avatar_url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description is too long' })
  @Transform(({ value }) => value?.trim() || null)
  description?: string | null;
}