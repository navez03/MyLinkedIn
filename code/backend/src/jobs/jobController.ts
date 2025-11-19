import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
} from "@nestjs/common";
import { JobService } from "./jobService";
import { CreateJobDto } from "./dto/create-job.dto";
import { JobApplicationDto } from "./dto/job-application.dto";
import { UpdateJobDto } from "./dto/update-job.dto";

@Controller("jobs")
export class JobController {
  constructor(private readonly jobService: JobService) {}

  // Criar um novo Job
  @Post()
  async create(
    @Body() createJobDto: CreateJobDto,
    @Body("token") token: string,
    @Body("userId") userId: string
  ) {
    return this.jobService.createJob(createJobDto, token, userId);
  }

  // Obter todos os Jobs
  @Get()
  async findAll(
    @Body("token") token: string,
    @Body("userId") userId: string,
    @Body("limit") limit: number = 20,
    @Body("offset") offset: number = 0
  ) {
    return this.jobService.getAllJobs(token, userId, limit, offset);
  }

  // Obter um Job específico por ID
  @Get(":jobId")
  async findOne(@Param("jobId") jobId: string, @Body("token") token: string) {
    return this.jobService.getJobById(jobId, token);
  }

  // Atualizar um Job
  @Put(":jobId")
  async update(
    @Param("jobId") jobId: string,
    @Body() updateJobDto: UpdateJobDto,
    @Body("token") token: string,
    @Body("userId") userId: string
  ) {
    return this.jobService.updateJob(jobId, updateJobDto, token, userId);
  }

  // Deletar um Job
  @Delete(":jobId")
  async remove(
    @Param("jobId") jobId: string,
    @Body("token") token: string,
    @Body("userId") userId: string
  ) {
    return this.jobService.deleteJob(jobId, token, userId);
  }

  // Candidatar-se a um Job
  @Post(":jobId/apply")
  async applyToJob(
    @Param("jobId") jobId: string,
    @Body() jobApplicationDto: JobApplicationDto,
    @Body("token") token: string
  ) {
    jobApplicationDto.jobId = jobId; // Atribui o jobId na DTO
    return this.jobService.applyToJob(jobApplicationDto, token);
  }
}
