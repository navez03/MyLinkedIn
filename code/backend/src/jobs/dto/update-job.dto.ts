import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  ArrayUnique,
  ArrayNotEmpty
} from "class-validator";
import { JobType, WorkplaceType } from "./create-job.dto"; // Import enums from create DTO

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsEnum(JobType)
  job_type?: JobType;

  @IsOptional()
  @IsEnum(WorkplaceType)
  workplace_type?: WorkplaceType;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salary_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salary_max?: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  skills?: string[];
}