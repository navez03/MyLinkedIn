import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import { JobService } from "./jobService";
import { CreateJobDto } from "./dto/create-job.dto";
import { JobApplicationDto } from "./dto/job-application.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { GetToken, GetUserId } from "@/config/decorators";
import { AuthGuard } from "@/User/userGuard";

@Controller("jobs")
export class JobController {
  constructor(private readonly jobService: JobService) {}

  // Criar um novo Job
  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() createJobDto: CreateJobDto,
    @GetToken() token: string,
    @GetUserId() userId: string
  ) {
    return this.jobService.createJob(createJobDto, token, userId);
  }

  // Obter todos os Jobs
  @Get()
  @UseGuards(AuthGuard)
  async findAll(
    @GetToken() token: string,
    @Query("limit") limit: number = 20,
    @Query("offset") offset: number = 0
  ) {
    return this.jobService.getAllJobs(token, limit, offset);
  }

  // Obter um Job específico por ID
  @Get(":jobId")
  async findOne(@Param("jobId") jobId: string, @Body("token") token: string) {
    return this.jobService.getJobById(jobId, token);
  }

  // Atualizar um Job
  @Put(":jobId")
  @UseGuards(AuthGuard)
  async update(
    @Param("jobId") jobId: string,
    @Body() updateJobDto: UpdateJobDto,
    @GetToken() token: string,
    @GetUserId() userId: string
  ) {
    return this.jobService.updateJob(jobId, updateJobDto, token, userId);
  }

  // Deletar um Job
  @Delete(":jobId")
  @UseGuards(AuthGuard)
  async remove(
    @Param("jobId") jobId: string,
    @GetToken() token: string,
    @GetUserId() userId: string
  ) {
    return this.jobService.deleteJob(jobId, token, userId);
  }

  // Candidatar-se a um Job
  @Post(":jobId/apply")
  @UseGuards(AuthGuard)
  async applyToJob(
    @Param("jobId") jobId: string,
    @Body() jobApplicationDto: JobApplicationDto,
    @GetToken() token: string
  ) {
    jobApplicationDto.jobId = jobId; // Atribui o jobId na DTO
    return this.jobService.applyToJob(jobApplicationDto, token);
  }

  // Obter todos os Jobs por localização
  @Get("/location/:location")
  @UseGuards(AuthGuard)
  async getJobsByLocation(
    @Param("location") location: string,
    @GetToken() token: string,
    @Query("limit") limit: number = 20,
    @Query("offset") offset: number = 0
  ) {
    return this.jobService.getJobsByLocation(location, token, limit, offset);
  }
}
