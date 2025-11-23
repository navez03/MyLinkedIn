import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { SupabaseService } from "../config/supabaseClient"; // Configuração do Supabase
import { CreateJobDto, JobResponseDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { JobApplicationDto } from "./dto/job-application.dto";

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(private readonly supabase: SupabaseService) {}

  // Criar um novo Job
  async createJob(
    createJobDto: CreateJobDto,
    token: string,
    userId: string
  ): Promise<JobResponseDto> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          title: createJobDto.title,
          company: createJobDto.company,
          location: createJobDto.location,
          job_type: createJobDto.job_type,
          workplace_type: createJobDto.workplace_type,
          description: createJobDto.description,
          salary_min: createJobDto.salary_min,
          salary_max: createJobDto.salary_max,
          skills: createJobDto.skills,
          user_id: userId, // Supondo que o userId seja o dono da vaga
          organizer_id: userId,
        })
        .select()
        .single();

      if (error) {
        this.logger.error("Error creating job", error.message);
        throw new BadRequestException(`Error creating job: ${error.message}`);
      }

      return this.mapJobToDto(data);
    } catch (error) {
      this.logger.error("Create job error", error.message);
      throw error;
    }
  }

  // Obter todos os Jobs
  async getAllJobs(
    token: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ jobs: JobResponseDto[]; total: number }> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      const { data, error, count } = await supabase
        .from("jobs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        this.logger.error("Error fetching jobs", error.message);
        throw new BadRequestException(`Error fetching jobs: ${error.message}`);
      }

      return {
        jobs: data.map((job) => this.mapJobToDto(job)),
        total: count || 0,
      };
    } catch (error) {
      this.logger.error("Get jobs error", error.message);
      throw error;
    }
  }

  // Obter Job por ID
  async getJobById(jobId: string, token: string): Promise<JobResponseDto> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error || !data) {
        this.logger.error("Error fetching job", error?.message);
        throw new NotFoundException("Job not found");
      }

      return this.mapJobToDto(data);
    } catch (error) {
      this.logger.error("Get job error", error.message);
      throw error;
    }
  }

  // Atualizar Job
  async updateJob(
    jobId: string,
    updateJobDto: UpdateJobDto,
    token: string,
    userId: string
  ): Promise<JobResponseDto> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      // Verificar se o job existe e se o usuário é o organizador
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("organizer_id")
        .eq("id", jobId)
        .single();

      if (jobError || !job) {
        throw new NotFoundException("Job not found");
      }

      if (job.organizer_id !== userId) {
        throw new BadRequestException(
          "Only the job organizer can update this job"
        );
      }

      const { data, error } = await supabase
        .from("jobs")
        .update(updateJobDto)
        .eq("id", jobId)
        .select()
        .single();

      if (error) {
        this.logger.error("Error updating job", error.message);
        throw new BadRequestException(`Error updating job: ${error.message}`);
      }

      return this.mapJobToDto(data);
    } catch (error) {
      this.logger.error("Update job error", error.message);
      throw error;
    }
  }

  // Deletar Job
  async deleteJob(
    jobId: string,
    token: string,
    userId: string
  ): Promise<{ message: string }> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      // Verificar se o job existe e se o usuário é o organizador
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("id, organizer_id")
        .eq("id", jobId)
        .single();

      if (jobError || !job) {
        throw new NotFoundException("Job not found");
      }

      if (job.organizer_id !== userId) {
        throw new BadRequestException(
          "Only the job organizer can delete this job"
        );
      }

      const { error } = await supabase.from("jobs").delete().eq("id", jobId);

      if (error) {
        this.logger.error("Error deleting job", error.message);
        throw new BadRequestException(`Error deleting job: ${error.message}`);
      }

      return { message: "Job deleted successfully" };
    } catch (error) {
      this.logger.error("Delete job error", error.message);
      throw error;
    }
  }

  // Candidatar-se a um Job
  async applyToJob(
    jobApplicationDto: JobApplicationDto,
    token: string
  ): Promise<string> {
    const { jobId, userId } = jobApplicationDto;

    if (!userId) {
      throw new BadRequestException("User ID is required to apply.");
    }
    const supabase = this.supabase.getClientWithToken(token);

    try {
      // Verificar se o job existe
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("id")
        .eq("id", jobId)
        .single();

      if (jobError || !job) {
        throw new NotFoundException("Job not found");
      }

      // Verificar se o usuário já se candidatou a este job
      const { data: existingApplication, error: existingAppError } =
        await supabase
          .from("job_applications")
          .select("id")
          .eq("applicant_id", userId)
          .eq("job_id", jobId)
          .maybeSingle(); // usa maybeSingle() para não tratar "0 rows" como erro

      if (existingAppError) {
        throw new BadRequestException("Error checking existing application");
      }
      if (existingApplication) {
        throw new BadRequestException("You have already applied to this job");
      }

      // Registrar a candidatura na tabela 'job_applications'
      const { data, error } = await supabase
        .from("job_applications")
        .insert({
          applicant_id: userId,
          job_id: jobId,
          status: "pending", // Status inicial é "pending"
        })
        .select()
        .single();

      if (error) {
        throw new BadRequestException(
          `Error creating application: ${error.message}`
        );
      }

      return `Application to job ${jobId} created successfully`;
    } catch (error) {
      throw error;
    }
  }
  // Obter Jobs por Localização
  async getJobsByLocation(
    location: string,
    token: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ jobs: JobResponseDto[]; total: number }> {
    const supabase = this.supabase.getClientWithToken(token);

    try {
      const { data, error, count } = await supabase
        .from("jobs")
        .select("*", { count: "exact" })
        .eq("location", location) // Filtro pela localização
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new BadRequestException(
          `Error fetching jobs by location: ${error.message}`
        );
      }

      return {
        jobs: data.map((job) => this.mapJobToDto(job)),
        total: count || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  // Função de mapeamento do job para DTO
  private mapJobToDto(job: any): JobResponseDto {
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      job_type: job.job_type,
      workplace_type: job.workplace_type,
      description: job.description,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      skills: job.skills,
      organizer_id: job.organizer_id,
      created_at: job.created_at,
      updated_at: job.updated_at,
    };
  }
}
