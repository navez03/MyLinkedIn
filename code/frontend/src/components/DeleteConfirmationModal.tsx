import React from 'react';
import { Card } from "../components/card";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    jobTitle?: string;
    isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    jobTitle,
    isDeleting = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
            <Card className="w-full max-w-md overflow-hidden shadow-2xl border-none">
                {/* Header */}
                <div className="bg-background px-6 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Confirm Deletion
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 bg-background">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Are you sure you want to permanently delete the job listing for <span className="font-semibold text-foreground">"{jobTitle || 'this job'}"</span>?
                    </p>
                    <p className="text-sm text-red-500/80 mt-2 font-medium">
                        This action cannot be undone.
                    </p>
                </div>

                {/* Footer / Actions */}
                <div className="bg-secondary/30 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Job'}
                    </button>
                </div>
            </Card>
        </div>
    );
};