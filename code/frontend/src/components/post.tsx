
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Card } from "./card";
import { Button } from "./button";
import { Image, Video, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../utils";

const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out " +
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border " +
        "bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out " +
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 " +
        "data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] " +
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity
                   hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[40px] w-[98%] rounded-md border border-gray-400 bg-background px-8 py-6 text-sm " +
          "placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

const CreatePostModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [content, setContent] = useState("");

  const handlePost = () => {
    if (content.trim()) {
      console.log("Post publicado:", content);
      setContent("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              MP
            </div>
            <div>
              <h3 className="font-semibold mt-3">My Profile</h3>
            </div>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to talk about?"
            className="min-h-[200px] resize-none px-6 py-4"
          />

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex gap-2">
              <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <Image className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <Video className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <Button onClick={handlePost} disabled={!content.trim()}>
              Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CreatePostCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card className="p-4">
        <div className="flex gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            MP
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 text-left px-4 py-3 rounded-full border border-border hover:bg-secondary transition-colors text-muted-foreground"
          >
            Create a post
          </button>
        </div>
        <div className="flex items-center justify-around">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <Image className="w-5 h-5 text-[#378FE9]" />
            <span className="text-sm font-medium text-muted-foreground">
              Photo
            </span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <Video className="w-5 h-5 text-[#5F9B41]" />
            <span className="text-sm font-medium text-muted-foreground">
              Video
            </span>
          </button>
        </div>
      </Card>

      <CreatePostModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};

export default CreatePostCard;
