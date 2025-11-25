import React, { useState } from "react";
import { Card } from "../components/card";
import { Input } from "../components/input";
import { X } from "lucide-react";

const BASE_URL = "http://localhost:3000";

const getAuthToken = () => {
    return localStorage.getItem("token") || "";
};

enum JobType { FULL_TIME = "full-time", PART_TIME = "part-time", INTERNSHIP = "internship" }
enum WorkplaceType { REMOTE = "remote", HYBRID = "hybrid", ON_SITE = "on-site" }

interface CreateJobForm {
    title: string;
    company: string;
    location: string;
    job_type: JobType;
    workplace_type: WorkplaceType;
    description: string;
    salary_min: number;
    salary_max: number;
    skills: string;
}

export const frontendJobService = {
  createJob: async (data: CreateJobForm): Promise<any> => {
    const token = getAuthToken();
    const skillsArray = data.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    const jobData = {
        ...data,
        salary_min: data.salary_min || 0,
        salary_max: data.salary_max || 0,
        skills: skillsArray,
    };
    
    const response = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create job");
    }
    return response.json();
  }
};


interface CreateJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJobCreated: () => void;
}

const initialFormState: CreateJobForm = {
    title: "",
    company: "",
    location: "",
    job_type: JobType.FULL_TIME,
    workplace_type: WorkplaceType.ON_SITE,
    description: "",
    salary_min: 0,
    salary_max: 0,
    skills: "",
};

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
    const [form, setForm] = useState<CreateJobForm>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (!form.title || !form.company || !form.location || !form.job_type || !form.workplace_type || !form.skills) {
                alert("Please fill in all required fields (Title, Company, Location, Type, Skills).");
                return;
            }

            await frontendJobService.createJob(form);
            
            setForm(initialFormState);
            onClose();
            onJobCreated(); 

        } catch (error: any) {
            console.error("Failed to create job:", error);
            alert("Failed to post job: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Create a New Job Listing</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-3">
                    {/* Basic Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Title *</label>
                            <Input type="text" name="title" value={form.title} onChange={handleChange} required className="text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Company *</label>
                            <Input type="text" name="company" value={form.company} onChange={handleChange} required className="text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium mb-1">Location *</label>
                        <Input type="text" name="location" value={form.location} onChange={handleChange} required className="text-sm" />
                    </div>
                    
                    {/* Type Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Job Type *</label>
                            <select name="job_type" value={form.job_type} onChange={handleChange} className="w-full p-2 border border-border rounded-lg bg-background text-sm">
                                {Object.values(JobType).map(type => (
                                    <option key={type} value={type} className="text-sm">{type.replace('-', ' ').toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Workplace Type *</label>
                            <select name="workplace_type" value={form.workplace_type} onChange={handleChange} className="w-full p-2 border border-border rounded-lg bg-background text-sm">
                                {Object.values(WorkplaceType).map(type => (
                                    <option key={type} value={type} className="text-sm">{type.replace('_', '-').toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium mb-1">Description (Optional)</label>
                        <textarea 
                            name="description" 
                            value={form.description} 
                            onChange={handleChange} 
                            rows={3} 
                            className="w-full p-3 border border-border rounded-lg bg-background text-sm resize-none"
                            placeholder="Detailed job description..."
                        />
                    </div>

                    {/* Salary Fields - Changed to Type="number" */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Min Salary (Optional)</label>
                            <input 
                                type="number" 
                                name="salary_min" 
                                value={form.salary_min || ''} 
                                onChange={handleChange} 
                                min="0" 
                                placeholder="0" 
                                className="w-full p-2 border border-border rounded-lg bg-background text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Max Salary (Optional)</label>
                            <input 
                                type="number" 
                                name="salary_max" 
                                value={form.salary_max || ''} 
                                onChange={handleChange} 
                                min="0" 
                                placeholder="e.g., 95000" 
                                className="w-full p-2 border border-border rounded-lg bg-background text-sm"
                            />
                        </div>
                    </div>
                    
                    {/* Skills */}
                    <div>
                        <label className="block text-xs font-medium mb-1">Skills (Comma-separated) *</label>
                        <Input 
                            type="text" 
                            name="skills" 
                            value={form.skills} 
                            onChange={handleChange} 
                            placeholder="React, TypeScript, AWS"
                            required
                            className="text-sm"
                        />
                    </div>


                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Posting Job...' : 'Post Job'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};