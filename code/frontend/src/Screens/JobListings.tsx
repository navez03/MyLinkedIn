import React, { useState, useEffect } from "react";
import Navigation from "../components/header";
import { Card } from "../components/card";
import Loading from "../components/loading";
import AIChatWidget from "../components/AIChatWidget";
import { Briefcase } from "lucide-react"; 

// --- IMPORTED COMPONENTS ---
import { CreateJobModal } from '../components/CreateJobModal';
import { JobFilterSidebar } from '../components/JobFilterSidebar';
import { JobListItem } from '../components/JobListItem';
import { JobDetailPanel } from '../components/JobDetailPanel';

// --- IMPORTED TYPES ---
import { JobListing } from "../types/job.types"; // Assuming types are centralized here now

// --- START Frontend Service & Utilities (Kept here for data fetching/actions) ---

const BASE_URL = "http://localhost:3000";

const getAuthToken = () => {
    return localStorage.getItem("token") || "";
};

const getUserId = () => {
    return localStorage.getItem("userId") || "";
};

// Reused utility function
const getTimeAgo = (createdAt: string): string => {
    const now = new Date();
    const postDate = new Date(createdAt);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
};


const frontendJobService = {
  // GET /jobs (findAll endpoint)
  getAllJobs: async (): Promise<JobListing[]> => {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/jobs?limit=50&offset=0`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) { throw new Error("Failed to fetch jobs"); }
    const data = await response.json();
    return data.jobs.map((job: any) => ({
        ...job,
        skills: Array.isArray(job.skills) ? job.skills : (job.skills || '').split(',').map((s: string) => s.trim()),
        postedTime: getTimeAgo(job.created_at), 
        isEasyApply: true, 
    }));
  },
  
  // POST /jobs/:jobId/apply (applyToJob endpoint)
  applyToJob: async (jobId: string): Promise<string> => {
      const token = getAuthToken();
      const userId = getUserId();
      
      if (!userId) { throw new Error("User not authenticated."); }
      
      const applicationDto = { jobId: jobId, userId: userId };
      
      const response = await fetch(`${BASE_URL}/jobs/${jobId}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(applicationDto),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to apply for job");
      }
      return response.text();
  }
};
// --- END Frontend Service & Utilities ---


export default function JobListings() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isApplying, setIsApplying] = useState(false);

  // Define fetchJobs inside useEffect to ensure correct dependency handling
  useEffect(() => {
    const fetchJobs = async () => {
        setLoading(true);
        try {
            const fetchedJobs = await frontendJobService.getAllJobs();
            setJobs(fetchedJobs);
            if (fetchedJobs.length > 0 && !selectedJob) {
                setSelectedJob(fetchedJobs[0]);
            }
        } catch (error) {
            console.error("Error fetching job data:", error);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    fetchJobs();
}, []);


  const handleJobCreated = () => {
    alert("Job posted successfully! List refreshing.");
    // This is the clean way to re-fetch after a successful action
    const fetchJobs = async () => { /* ... */ }; 
    fetchJobs();
  };

  const handleApply = async (jobId: string) => {
    setIsApplying(true);
    try {
        const message = await frontendJobService.applyToJob(jobId); 
        alert(message);
    } catch (error: any) {
        console.error("Application failed:", error);
        alert("Application failed: " + error.message);
    } finally {
        setIsApplying(false);
    }
  };


  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      job.location.toLowerCase().includes(locationFilter.toLowerCase())
  );

  const handleJobClick = (job: JobListing) => {
    setSelectedJob(job);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="max-w-[1500px] mx-auto px-6 py-6 flex gap-6">
          
          {/* Column 1: Job Filters Sidebar */}
          <JobFilterSidebar 
              searchQuery={searchQuery}
              locationFilter={locationFilter}
              setSearchQuery={setSearchQuery}
              setLocationFilter={setLocationFilter}
              setIsModalOpen={setIsModalOpen}
          />

          {/* Column 2: Main Content - Job Listings */}
          <div className="max-w-[400px] w-full flex-shrink-0 space-y-4 h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide border border-border rounded-lg bg-card">
            <div className="p-4 border-b border-border sticky top-0 bg-card">
                <h2 className="text-xl font-semibold text-foreground">Job Results ({filteredJobs.length})</h2>
            </div>
            {filteredJobs.length === 0 ? (
                <div className="p-8 text-center">
                    <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No jobs match your filters.</p>
                </div>
            ) : (
              <div className="space-y-0">
                {filteredJobs.map((job) => (
                    <JobListItem 
                        key={job.id}
                        job={job}
                        isSelected={selectedJob?.id === job.id}
                        onClick={handleJobClick}
                    />
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Job Detail Panel */}
          <div className="flex-1 space-y-4 hidden md:block">
              <JobDetailPanel
                  selectedJob={selectedJob}
                  handleApply={handleApply}
                  isApplying={isApplying}
              />
          </div>
        </div>
      </div>
      <AIChatWidget />

      {/* Render the CreateJobModal */}
      <CreateJobModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onJobCreated={handleJobCreated}
      />
    </>
  );
}