// --- Enums ---
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

// --- Forms ---
export interface CreateJobForm {
    title: string;
    company: string;
    location: string;
    job_type: JobType;
    workplace_type: WorkplaceType;
    description: string;
    salary_min: number;
    salary_max: number;
    skills: string; // Comma-separated string for form input
}

// --- Responses ---
export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  workplace_type: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  skills: string[];
  organizer_id: string;
  created_at: string;
  updated_at: string;
  postedTime: string; // Calculated on frontend
  isEasyApply: boolean; // Placeholder (assuming true for now)
}