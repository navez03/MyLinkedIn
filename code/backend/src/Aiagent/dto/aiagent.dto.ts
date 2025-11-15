import { IsOptional, IsString } from "class-validator";

export class AiAgentDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
