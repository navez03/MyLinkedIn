import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/header";
import { Card } from "../components/card";
import Loading from "../components/loading";
import { Briefcase, Trash2, Edit2, MapPin, Clock, Plus, ChevronLeft, Banknote } from "lucide-react";
import { JobListItem } from '../components/JobListItem';
import { EditJobModal } from '../components/EditJobModal';
import { CreateJobModal } from '../components/CreateJobModal'; 
import { JobListing } from "../types/job.types";

const BASE_URL = "http://localhost:3000";

const getAuthToken = () => localStorage.getItem("token")?.replace(/^"|"$/g, '') || "";

const getTimeAgo = (createdAt: string): string => {
    return new Date(createdAt).toLocaleDateString();
};

const myJobsService = {
    getMyJobs: async (): Promise<JobListing[]> => {
        const token = getAuthToken();
        const response = await fetch(`${BASE_URL}/jobs/posted`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch my jobs");
        const data = await response.json();
        return data.map((job: any) => ({
            ...job,
            skills: Array.isArray(job.skills) ? job.skills : (job.skills || '').split(','),
            postedTime: getTimeAgo(job.created_at),
            isEasyApply: true,
        }));
    },
    deleteJob: async (jobId: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(`${BASE_URL}/jobs/${jobId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to delete job");
    }
};

export default function MyJobs() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchMyJobs = async () => {
        if (jobs.length === 0) setLoading(true);
        
        try {
            const data = await myJobsService.getMyJobs();
            setJobs(data);
            setSelectedJob(prevSelected => {
                if (!prevSelected) return data.length > 0 ? data[0] : null;
                const found = data.find(j => j.id === prevSelected.id);
                if (found) {
                    return found; 
                }
                return data.length > 0 ? data[0] : null;
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyJobs();
    }, []);

    const handleDelete = async (jobId: string) => {
        if (window.confirm("Are you sure you want to delete this job? This cannot be undone.")) {
            try {
                await myJobsService.deleteJob(jobId);
                // No alert needed, just refresh. The logic in fetchMyJobs handles the selection switch.
                fetchMyJobs(); 
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    // Helper to format salary
    const formatSalary = (min?: number, max?: number) => {
        if (!min && !max) return null;
        const format = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
        if (min && max) return min === max ? format(min) : `${format(min)} - ${format(max)}`;
        if (min) return `From ${format(min)}`;
        if (max) return `Up to ${format(max)}`;
        return null;
    };

    const salaryString = selectedJob ? formatSalary(selectedJob.salary_min, selectedJob.salary_max) : null;

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-background">
                <div className="max-w-[1500px] mx-auto px-6 py-6">
                    
                    <button
                        onClick={() => navigate('/jobs')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Back to Job Listings</span>
                    </button>

                    <div className="flex gap-6">
                        {/* Left Sidebar */}
                        <div className="hidden lg:block w-[300px] flex-shrink-0 space-y-4 sticky top-20 self-start">
                            <Card className="p-4">
                                <h2 className="text-lg font-semibold mb-2">Manage My Jobs</h2>
                                <p className="text-sm text-muted-foreground mb-4">View, edit, or delete the job listings you have posted.</p>
                                <button 
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90"
                                >
                                    <Plus className="w-4 h-4"/> Post New Job
                                </button>
                            </Card>
                        </div>

                        {/* Main List */}
                        <div className="max-w-[400px] w-full flex-shrink-0 space-y-4 h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide border border-border rounded-lg bg-card">
                            <div className="p-4 border-b border-border sticky top-0 bg-card">
                                <h2 className="text-xl font-semibold">My Posted Jobs ({jobs.length})</h2>
                            </div>
                            {jobs.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">You haven't posted any jobs yet.</div>
                            ) : (
                                jobs.map(job => (
                                    <JobListItem 
                                        key={job.id} 
                                        job={job} 
                                        isSelected={selectedJob?.id === job.id} 
                                        onClick={setSelectedJob} 
                                    />
                                ))
                            )}
                        </div>

                        {/* Detail Panel (Custom for 'My Jobs') */}
                        <div className="flex-1 space-y-4 hidden md:block">
                            {selectedJob ? (
                                <Card className="p-6 h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide sticky top-20">
                                    <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
                                        <div>
                                            <h1 className="text-2xl font-bold">{selectedJob.title}</h1>
                                            <h2 className="text-lg text-muted-foreground">{selectedJob.company}</h2>
                                            
                                            <div className="flex flex-col gap-1 mt-2">
                                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4" /> {selectedJob.location}
                                                </p>
                                                {salaryString && (
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                        <Banknote className="w-4 h-4" /> {salaryString}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setIsEditModalOpen(true)}
                                                className="px-4 py-2 border border-primary text-primary rounded-lg flex items-center gap-2 hover:bg-primary/5"
                                            >
                                                <Edit2 className="w-4 h-4"/> Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(selectedJob.id)}
                                                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg flex items-center gap-2 hover:opacity-90"
                                            >
                                                <Trash2 className="w-4 h-4"/> Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> Posted: {selectedJob.postedTime}</span>
                                            <div className="h-4 w-px bg-border hidden sm:block" />
                                            <span className="flex items-center gap-1"><Briefcase className="w-4 h-4"/> {selectedJob.job_type.toUpperCase()} &bull; {selectedJob.workplace_type.toUpperCase().replace('_', '-')}</span>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground mb-3">About the job</h3>
                                            <p className="whitespace-pre-line text-sm text-foreground leading-relaxed">{selectedJob.description || "No description provided."}</p>
                                        </div>

                                        {selectedJob.skills.length > 0 && (
                                            <div className="pt-6 border-t border-border">
                                                <h4 className="font-semibold mb-3">Required Skills</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedJob.skills.map(s => (
                                                        <span key={s} className="px-3 py-1.5 text-sm font-medium bg-secondary text-foreground rounded-md border border-border">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ) : (
                                <Card className="p-6 h-full flex items-center justify-center">
                                    <p className="text-muted-foreground">Select a job to manage</p>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <EditJobModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                job={selectedJob} 
                onJobUpdated={fetchMyJobs} 
            />
            <CreateJobModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onJobCreated={fetchMyJobs} 
            />
        </>
    );
}