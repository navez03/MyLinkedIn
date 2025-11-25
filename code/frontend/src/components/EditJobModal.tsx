import React, { useState, useEffect } from "react";
import { Card } from "../components/card";
import { Input } from "../components/input";
import { X, Save } from "lucide-react";
import { JobListing, JobType, WorkplaceType, CreateJobForm } from "../types/job.types"; // Ensure you have these types

const BASE_URL = "http://localhost:3000";

interface EditJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: JobListing | null;
    onJobUpdated: () => void;
}

export const EditJobModal: React.FC<EditJobModalProps> = ({ isOpen, onClose, job, onJobUpdated }) => {
    const [form, setForm] = useState<CreateJobForm | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate form when job data loads
    useEffect(() => {
        if (job) {
            setForm({
                title: job.title,
                company: job.company,
                location: job.location,
                job_type: job.job_type as JobType,
                workplace_type: job.workplace_type as WorkplaceType,
                description: job.description || "",
                salary_min: job.salary_min || 0,
                salary_max: job.salary_max || 0,
                skills: job.skills.join(", "), 
            });
        }
    }, [job]);

    if (!isOpen || !form || !job) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => prev ? ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value,
        }) : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token")?.replace(/^"|"$/g, '') || "";
            const skillsArray = form.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
            
            const updateData = { ...form, skills: skillsArray };

            const response = await fetch(`${BASE_URL}/jobs/${job.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to update job");
            }

            onJobUpdated();
            onClose();
        } catch (error: any) {
            alert("Update failed: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Edit Job: {job.title}</h2>
                    <button onClick={onClose}><X className="w-6 h-6 text-muted-foreground" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-3">
                    {/* Reusing fields from Create form */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Title</label>
                            <Input name="title" value={form.title} onChange={handleChange} required className="text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Company</label>
                            <Input name="company" value={form.company} onChange={handleChange} required className="text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Location</label>
                        <Input name="location" value={form.location} onChange={handleChange} required className="text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Job Type</label>
                            <select name="job_type" value={form.job_type} onChange={handleChange} className="w-full p-2 border border-border rounded-lg bg-background text-sm">
                                {Object.values(JobType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Workplace</label>
                            <select name="workplace_type" value={form.workplace_type} onChange={handleChange} className="w-full p-2 border border-border rounded-lg bg-background text-sm">
                                {Object.values(WorkplaceType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Description</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full p-3 border border-border rounded-lg bg-background text-sm resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Min Salary</label>
                            <input type="number" name="salary_min" value={form.salary_min} onChange={handleChange} className="w-full p-2 border border-border rounded-lg bg-background text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Max Salary</label>
                            <input type="number" name="salary_max" value={form.salary_max} onChange={handleChange} className="w-full p-2 border border-border rounded-lg bg-background text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Skills</label>
                        <Input name="skills" value={form.skills} onChange={handleChange} required className="text-sm" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 border border-border rounded-lg text-sm">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-2">
                            <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};