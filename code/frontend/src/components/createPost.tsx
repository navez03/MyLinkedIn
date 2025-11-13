import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Card } from "./card";
import { Button } from "./button";
import { Image, Video, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../utils";
import { postsAPI } from "../services/postsService";
import { userAPI } from "../services/registerService";
import { useUser } from "./UserContext";

const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
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
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
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

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[40px] w-[98%] rounded-md border border-gray-400 bg-background px-8 py-6 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

function getUserInitials(name: string) {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0]?.toUpperCase() || '';
}

const CreatePostModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { userData } = useUser();
  const userName = userData?.name || '';
  const userAvatar = userData?.avatar_url || null;
  const initials = getUserInitials(userName);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select an image file');
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePost = async () => {
    if (content.trim() || selectedImage) {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem('userId');

        if (!userId) {
          alert('You must be logged in to create a post');
          return;
        }

        let imageUrl: string | undefined = undefined;

        // Upload image if selected
        if (selectedImage) {
          const uploadResponse = await postsAPI.uploadImage(selectedImage);
          if (uploadResponse.success && uploadResponse.data) {
            imageUrl = uploadResponse.data.imageUrl;
          } else {
            const errorMsg = !uploadResponse.success ? (uploadResponse as any).error : 'Unknown error';
            alert('Error uploading image: ' + errorMsg);
            return;
          }
        }

        const response = await postsAPI.createPost({
          userId,
          content: content.trim(),
          imageUrl,
        });

        if (response.success) {
          setContent("");
          setSelectedImage(null);
          setImagePreview(null);
          onOpenChange(false);
          window.location.reload();
        } else {
          alert('Error creating post: ' + response.error);
        }
      } catch (error) {
        alert('Failed to create post. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <div className="space-y-4">
          <div className="flex gap-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    e.currentTarget.nextElementSibling.classList.remove('hidden');
                  }
                }}
              />
            ) : null}
            <div className={`w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold ${userAvatar ? 'hidden' : ''}`}>
              {initials}
            </div>
            <div>
              <h3 className="font-semibold mt-3">{userName || "My Profile"}</h3>
            </div>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to talk about?"
            className="min-h-[200px] resize-none px-6 py-4"
          />

          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-96 object-cover rounded-lg"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                disabled={isLoading}
              >
                <Image className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-secondary rounded-lg transition-colors" disabled>
                <Video className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <Button onClick={handlePost} disabled={(!content.trim() && !selectedImage) || isLoading}>
              {isLoading ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CreatePostCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userData } = useUser();
  const userName = userData?.name || '';
  const userAvatar = userData?.avatar_url || null;
  const initials = getUserInitials(userName);

  return (
    <>
      <Card className="p-4">
        <div className="flex gap-3 mb-3">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.classList.remove('hidden');
                }
              }}
            />
          ) : null}
          <div className={`w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold ${userAvatar ? 'hidden' : ''}`}>
            {initials}
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
            <span className="text-sm font-medium text-muted-foreground">Photo</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <Video className="w-5 h-5 text-[#5F9B41]" />
            <span className="text-sm font-medium text-muted-foreground">Video</span>
          </button>
        </div>
      </Card>

      <CreatePostModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};

export default CreatePostCard;
