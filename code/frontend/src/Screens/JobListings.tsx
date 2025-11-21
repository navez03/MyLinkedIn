import React, { useState, useEffect } from "react";
import Navigation from "../components/header";
import { Card } from "../components/card";
import Loading from "../components/loading";
import AIChatWidget from "../components/AIChatWidget";
import {
  Briefcase,
  MapPin,
  Clock,
  Send,
  Filter,
} from "lucide-react"; // Save icon removed from imports
import { Input } from "../components/input";

// Placeholder data structure for a job
interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  postedTime: string;
  isEasyApply: boolean;
  type: 'Full-time' | 'Part-time' | 'Contract';
}

// Placeholder service functions
const jobService = {
  getJobs: async (): Promise<JobListing[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: "1",
        title: "Senior Frontend Developer",
        company: "TechCorp",
        location: "New York, NY (Hybrid)",
        postedTime: "1h ago",
        isEasyApply: true,
        type: 'Full-time'
      },
      {
        id: "2",
        title: "Product Manager",
        company: "Innovate Inc.",
        location: "Remote",
        postedTime: "3d ago",
        isEasyApply: false,
        type: 'Full-time'
      },
      {
        id: "3",
        title: "UX Designer - Contract",
        company: "DesignFlow",
        location: "San Francisco, CA",
        postedTime: "1w ago",
        isEasyApply: true,
        type: 'Contract'
      },
    ];
  },
};

export default function JobListings() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      const fetchedJobs = await jobService.getJobs();
      setJobs(fetchedJobs);
      if (fetchedJobs.length > 0) {
        setSelectedJob(fetchedJobs[0]);
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

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
          {/* Left Sidebar: Filters and Management (Fixed Width) */}
          <div className="hidden lg:block w-[300px] flex-shrink-0 space-y-4 sticky top-20 self-start">
            <Card className="p-4 space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Filter className="w-5 h-5" /> Job Filters
              </h2>
              <div>
                <label className="block text-sm font-medium mb-1">Keywords</label>
                <Input
                  placeholder="e.g., Engineer, Product"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-secondary border-0 placeholder:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <Input
                  placeholder="e.g., Remote, London"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="bg-secondary border-0 placeholder:text-sm"
                />
              </div>
            </Card>
          </div>

          {/* Main Content: Job Listings (Fixed Width) */}
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
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleJobClick(job)}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors ${selectedJob?.id === job.id ? 'bg-secondary/70' : ''}`}
                >
                  {/* Save button removed from here */}
                  <div className="flex justify-between items-start mb-2"> 
                    <h3 className="font-semibold text-base text-primary hover:underline">
                      {job.title}
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-foreground">{job.company}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{job.postedTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{job.type}</span>
                    {job.isEasyApply && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">Easy Apply</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Content: Job Detail View (Flexible Width) */}
          <div className="flex-1 space-y-4 hidden md:block">
            {selectedJob ? (
              <Card className="p-6 h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide sticky top-20">
                <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground mb-1">{selectedJob.title}</h1>
                        <h2 className="text-lg font-medium text-muted-foreground">{selectedJob.company}</h2>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {selectedJob.location}
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        {/* Save button removed from here */}
                        <button
                            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {'Apply'} 
                        </button>
                    </div>
                </div>

                <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Posted: {selectedJob.postedTime}</span>
                    </div>
                    <span>{'\u2022'}</span>
                    <span className="font-medium">{selectedJob.type}</span>
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">Job Description</h3>
                <div className="space-y-4 text-sm text-foreground leading-relaxed">
                    <p>
                    We are looking for a highly skilled and motivated **{selectedJob.title}** to join our dynamic team. You will be responsible for building and maintaining user-facing applications.
                    </p>
                    <p>
                    **Responsibilities:**
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Develop and implement new features and user interfaces from wireframe to production.</li>
                        <li>Collaborate with product managers and designers to define and implement innovative solutions.</li>
                        <li>Optimize application for maximum speed and scalability.</li>
                        <li>Write clean, efficient, and well-documented code.</li>
                    </ul>
                    <p>
                    **Qualifications:**
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>5+ years of professional experience in frontend development.</li>
                        <li>Expertise in React, TypeScript, and modern JavaScript practices.</li>
                        <li>Experience with state management libraries (e.g., Redux, Zustand).</li>
                        <li>Strong understanding of responsive design principles.</li>
                    </ul>
                </div>
              </Card>
            ) : (
                <Card className="p-6 h-full flex items-center justify-center">
                    <div className="text-center">
                        <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <h3 className="text-lg font-semibold text-foreground">Select a job to view details</h3>
                        <p className="text-sm text-muted-foreground">Click on a listing in the left panel to see the full description.</p>
                    </div>
                </Card>
            )}
          </div>
        </div>
      </div>
      <AIChatWidget />
    </>
  );
}