import { Type } from "class-transformer";
import {
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export enum JobType {
  FULL_TIME = "full-time",
  PART_TIME = "part-time",
  INTERNSHIP = "internship",
}

export enum WorkplaceType {
  REMOTE = "remote",
  HYBRID = "hybrid",
  ON_SITE = "on-site",
}

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsEnum(JobType)
  job_type: JobType; // full-time, part-time, internship

  @IsEnum(WorkplaceType)
  workplace_type: WorkplaceType; // remote, hybrid, on-site

  @IsString()
  @IsOptional()
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

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  skills: string[]; // Array de skills (habilidades)
}

export class JobResponseDto {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: JobType;
  workplace_type: WorkplaceType;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  skills: string[];
  organizer_id: string;
  created_at: string;
  updated_at: string;
}
