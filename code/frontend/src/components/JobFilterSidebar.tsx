import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Card } from "../components/card";
import { Input } from "../components/input";
import { Plus, Filter, Briefcase } from "lucide-react"; // Added Briefcase icon

interface JobFilterSidebarProps {
    searchQuery: string;
    locationFilter: string;
    setSearchQuery: (query: string) => void;
    setLocationFilter: (location: string) => void;
    setIsModalOpen: (isOpen: boolean) => void;
}

export const JobFilterSidebar: React.FC<JobFilterSidebarProps> = ({
    searchQuery,
    locationFilter,
    setSearchQuery,
    setLocationFilter,
    setIsModalOpen
}) => {
    const navigate = useNavigate(); // Initialize navigation hook

    return (
        <div className="hidden lg:block w-[300px] flex-shrink-0 space-y-4 sticky top-20 self-start">
            
            {/* Create Job Button Card */}
            <Card className="p-4">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Post a Job Listing
                </button>
            </Card>

            {/* Job Filters Card */}
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

            {/* NEW: Manage My Jobs Button */}
            <Card className="p-4">
                <button
                    onClick={() => navigate('/my-jobs')}
                    className="w-full px-4 py-2 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                >
                    <Briefcase className="w-4 h-4" />
                    Manage My Posted Jobs
                </button>
            </Card>
        </div>
    );
};