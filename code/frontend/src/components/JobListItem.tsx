import React from 'react';
import { MapPin, Clock } from "lucide-react";
import { JobListing } from "../types/job.types";

interface JobListItemProps {
    job: JobListing;
    isSelected: boolean;
    onClick: (job: JobListing) => void;
}

export const JobListItem: React.FC<JobListItemProps> = ({ job, isSelected, onClick }) => {
    return (
        <div
            key={job.id}
            onClick={() => onClick(job)}
            className={`p-4 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors ${isSelected ? 'bg-secondary/70' : ''}`}
        >
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
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{job.job_type.toUpperCase()}</span>
                {job.isEasyApply && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">Easy Apply</span>
                )}
            </div>
        </div>
    );
};