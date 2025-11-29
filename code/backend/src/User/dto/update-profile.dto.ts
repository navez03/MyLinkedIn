import { IsString, MinLength, IsOptional, IsUrl, ValidateIf, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @ValidateIf((o) => o.name !== undefined && o.name !== null)
  @IsString({ message: 'Name must be a string' })
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(30, { message: 'Name is too long' })
  @Transform(({ value }) => value?.trim?.())
  name?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Only transform if the value exists
    if (value === '' || value === undefined) {
      return undefined;
    }
    return value;
  })
  @ValidateIf((o) => o.avatar_url !== undefined && o.avatar_url !== null)
  @IsUrl({}, { message: 'Invalid avatar URL' })
  avatar_url?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.description !== undefined)
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description is too long' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    return value?.trim?.() || null;
  })
  description?: string | null;
}