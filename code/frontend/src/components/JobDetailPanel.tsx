import React from 'react';
import { Card } from "../components/card";
import { Briefcase, MapPin, Clock, Send, Check, Trash2 } from "lucide-react"; // Import Trash2
import { JobListing } from "../types/job.types";

interface JobDetailPanelProps {
    selectedJob: JobListing | null;
    handleApply: (jobId: string) => void;
    handleWithdraw: (jobId: string) => void; // <-- NEW PROP
    isApplying: boolean;
    hasApplied: boolean;
}

export const JobDetailPanel: React.FC<JobDetailPanelProps> = ({ 
    selectedJob, 
    handleApply, 
    handleWithdraw, // <-- Destructure new prop
    isApplying, 
    hasApplied 
}) => {
    if (!selectedJob) {
        // ... (loading state remains same)
        return <Card className="p-6">Select a job...</Card>;
    }

    // ... (Button logic for Apply button remains same) ...
    let buttonContent;
    let buttonClass = "";
    let buttonDisabled = isApplying;
    
    if (isApplying) {
        buttonContent = 'Applying...';
        buttonClass = "bg-primary text-primary-foreground disabled:opacity-50";
    } else if (hasApplied) {
        buttonContent = 'Already Applied';
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
                <div className="flex flex-col gap-2 items-end">
                    {/* Main Apply Button */}
                    <button
                        onClick={() => !hasApplied && handleApply(selectedJob.id)}
                        disabled={buttonDisabled}
                        className={`px-5 py-2 rounded-lg font-medium transition-opacity flex items-center gap-2 ${buttonClass}`}
                    >
                        {hasApplied ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        {buttonContent}
                    </button>

                    {/* NEW: Withdraw Button (Only shows if already applied) */}
                    {hasApplied && (
                        <button
                            onClick={() => {
                                if(window.confirm("Are you sure you want to withdraw your application?")) {
                                    handleWithdraw(selectedJob.id);
                                }
                            }}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium underline decoration-red-500/30 underline-offset-4 hover:decoration-red-500 transition-all"
                        >
                            <Trash2 className="w-3 h-3" />
                            Withdraw Application
                        </button>
                    )}
                </div>
            </div>

            {/* ... Rest of description/skills remains same ... */}
            <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                 {/* ... */}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Job Description</h3>
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
                <p className="whitespace-pre-line">{selectedJob.description}</p>
                {/* ... skills ... */}
            </div>
        </Card>
    );
};