import React from 'react';
import { Card } from "../components/card";
import { Briefcase, MapPin, Clock, Send, Check, Trash2 } from "lucide-react";
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

    // Logic for the main Apply/Status button
    let buttonContent;
    let buttonClass = "";
    let buttonDisabled = isApplying;
    
    if (isApplying) {
        buttonContent = 'Applying...';
        buttonClass = "bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed";
    } else if (hasApplied) {
        buttonContent = 'Already Applied';
        // Green style for status
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
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {selectedJob.location}
                    </p>
                </div>
                
                {/* ACTIONS COLUMN */}
                <div className="flex flex-col gap-3 items-end">
                    {/* 1. Main Apply/Status Button */}
                    <button
                        onClick={() => !hasApplied && handleApply(selectedJob.id)}
                        disabled={buttonDisabled}
                        className={`px-5 py-2 rounded-lg font-medium transition-opacity flex items-center justify-center gap-2 w-full md:w-auto ${buttonClass}`}
                    >
                        {hasApplied ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        {buttonContent}
                    </button>

                    {/* 2. Withdraw Button (Red, same size/shape) */}
                    {hasApplied && (
                        <button
                            onClick={() => {
                                if(window.confirm("Are you sure you want to withdraw your application?")) {
                                    handleWithdraw(selectedJob.id);
                                }
                            }}
                            className="px-5 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full md:w-auto bg-red-600/10 text-red-600 border border-red-600 hover:bg-red-600/20"
                        >
                            <Trash2 className="w-4 h-4" />
                            Withdraw
                        </button>
                    )}
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