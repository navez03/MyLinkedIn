import React from 'react';
import { Card } from "../components/card";
import { Briefcase, MapPin, Clock, Send } from "lucide-react";
import { JobListing } from "../types/job.types";

interface JobDetailPanelProps {
    selectedJob: JobListing | null;
    handleApply: (jobId: string) => void;
    isApplying: boolean;
}

export const JobDetailPanel: React.FC<JobDetailPanelProps> = ({ selectedJob, handleApply, isApplying }) => {
    if (!selectedJob) {
        return (
            <Card className="p-6 h-full flex items-center justify-center">
                <div className="text-center">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">Select a job to view details</h3>
                    <p className="text-sm text-muted-foreground">Click on a listing in the left panel to see the full description.</p>
                </div>
            </Card>
        );
    }

    return (
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
                    <button
                        onClick={() => handleApply(selectedJob.id)}
                        disabled={isApplying}
                        className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                        {isApplying ? 'Applying...' : 'Apply'} 
                    </button>
                </div>
            </div>

            <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Posted: {selectedJob.postedTime}</span>
                </div>
                <span>{'\u2022'}</span>
                <span className="font-medium">{selectedJob.job_type.toUpperCase()} ({selectedJob.workplace_type.toUpperCase()})</span>
            </div>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">Job Description</h3>
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
                <p className="whitespace-pre-line">{selectedJob.description}</p>
                
                {selectedJob.skills && selectedJob.skills.length > 0 && (
                    <div className="pt-2 border-t border-border">
                        <h4 className="font-semibold mb-2">Required Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedJob.skills.map(skill => (
                                <span key={skill} className="px-3 py-1 text-xs font-medium bg-secondary text-foreground rounded-full border border-border">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};