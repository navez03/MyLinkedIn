import React from 'react';
import { Card } from "../components/card";
import { Briefcase, MapPin, Clock, Send, Check, Trash2, Banknote } from "lucide-react"; // Added Banknote
import { JobListing } from "../types/job.types";

interface JobDetailPanelProps {
    selectedJob: JobListing | null;
    handleApply: (jobId: string) => void;
    handleWithdraw: (jobId: string) => void;
    isApplying: boolean;
    hasApplied: boolean;
}

export const JobDetailPanel: React.FC<JobDetailPanelProps> = ({
    selectedJob,
    handleApply,
    handleWithdraw,
    isApplying,
    hasApplied
}) => {
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

    // Helper to format salary
    const formatSalary = (min?: number, max?: number) => {
        if (!min && !max) return null;

        const format = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

        if (min && max) {
            return min === max ? format(min) : `${format(min)} - ${format(max)}`;
        }
        if (min) return `From ${format(min)}`;
        if (max) return `Up to ${format(max)}`;
        return null;
    };

    const salaryString = formatSalary(selectedJob.salary_min, selectedJob.salary_max);

    // Button Logic
    let buttonContent;
    let buttonClass = "";
    let buttonDisabled = isApplying;

    if (isApplying) {
        buttonContent = 'Applying...';
        buttonClass = "bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed";
    } else if (hasApplied) {
        buttonContent = 'Applied';
        buttonClass = "bg-green-600/10 text-green-600 border border-green-600 cursor-default";
        buttonDisabled = true;
    } else {
        buttonContent = 'Apply';
        buttonClass = "bg-primary text-primary-foreground hover:opacity-90";
    }

    return (
        <Card className="p-6 h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide sticky top-20">
            <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">{selectedJob.title}</h1>
                    <h2 className="text-lg font-medium text-muted-foreground">{selectedJob.company}</h2>

                    {/* Metadata Row 1: Location & Salary */}
                    <div className="flex flex-col gap-1 mt-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            {selectedJob.location}
                        </p>
                        {salaryString && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Banknote className="w-4 h-4 text-muted-foreground" />
                                {salaryString}
                            </p>
                        )}
                    </div>
                </div>

                {/* ACTIONS COLUMN */}
                <div className="flex flex-col gap-3 items-end">
                    <button
                        onClick={() => !hasApplied && handleApply(selectedJob.id)}
                        disabled={buttonDisabled}
                        className={`px-5 py-2 rounded-lg font-medium transition-opacity flex items-center justify-center gap-2 w-full md:w-auto ${buttonClass}`}
                    >
                        {hasApplied ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        {buttonContent}
                    </button>

                    {hasApplied && (
                        <button
                            onClick={() => {
                                handleWithdraw(selectedJob.id);
                            }}
                            className="px-5 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full md:w-auto bg-red-600/10 text-red-600 border border-red-600 hover:bg-red-600/20"
                        >
                            <Trash2 className="w-4 h-4" />
                            Withdraw
                        </button>
                    )}
                </div>
            </div>

            {/* Metadata Row 2: Time & Type */}
            <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Posted: {selectedJob.postedTime}</span>
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium capitalize">
                        {selectedJob.job_type.replace('-', ' ')} &bull; {selectedJob.workplace_type.replace('_', '-')}
                    </span>
                </div>
            </div>

            {/* Description Section */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">About the job</h3>
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                        {selectedJob.description || "No description provided."}
                    </div>
                </div>

                {/* Skills Section */}
                {selectedJob.skills && selectedJob.skills.length > 0 && (
                    <div className="pt-6 border-t border-border">
                        <h4 className="font-semibold mb-3">Required Skills</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedJob.skills.map(skill => (
                                <span key={skill} className="px-3 py-1.5 text-sm font-medium bg-secondary text-foreground rounded-md border border-border">
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