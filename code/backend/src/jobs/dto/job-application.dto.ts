import { IsNotEmpty } from "class-validator";

export class JobApplicationDto {
  @IsNotEmpty()
  jobId: string;
  @IsNotEmpty()
  userId: string;
}
