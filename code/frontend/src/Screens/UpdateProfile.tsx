import React, { useEffect, useState, useRef } from 'react';
import Loading from '../components/loading';
import Navigation from '../components/header';
import { Save, X, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/registerService';
import { useUser } from '../components/UserContext';

const UpdateProfile: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUserData } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar_url: '',
  });

  const [originalData, setOriginalData] = useState({
    name: '',
    email: '',
    avatar_url: '',
  });

  const getInitials = (name: string): string => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || '';
  };

  const initials = getInitials(formData.name);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await userAPI.getUserProfile();

        if (response.success && response.data) {
          const userData = {
            name: response.data.name || '',
            email: response.data.email || '',
            avatar_url: response.data.avatar_url || '',
          };
          setFormData(userData);
          setOriginalData(userData);
        } else {
          setError('Failed to load profile data');
        }
      } catch (err) {
        setError('Error loading profile');
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setSuccessMessage('');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setAvatarFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setError('');
    setSuccessMessage('');
  };

  const hasChanges = (): boolean => {
    return (
      formData.name !== originalData.name ||
      avatarFile !== null
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      // Validações
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }

      if (formData.name.trim().length < 2) {
        setError('Name must be at least 2 characters');
        return;
      }

      if (formData.name.trim().length > 30) {
        setError('Name must be less than 30 characters');
        return;
      }

      if (!hasChanges()) {
        setError('No changes to save');
        return;
      }

      let avatarUrl = formData.avatar_url;

      if (avatarFile) {
        setIsUploadingImage(true);
        const uploadResponse = await userAPI.uploadAvatar(avatarFile);
        setIsUploadingImage(false);

        if (uploadResponse.success && uploadResponse.data) {
          avatarUrl = uploadResponse.data.url;
        } else if (!uploadResponse.success) {
          let errorMsg = 'Failed to upload avatar';
          if ('error' in uploadResponse && typeof uploadResponse.error === 'string') {
            errorMsg = uploadResponse.error;
          }
          setError(errorMsg);
          return;
        }
      }

      const updateData: { name?: string; avatar_url?: string } = {};

      if (formData.name !== originalData.name) {
        updateData.name = formData.name.trim();
      }

      if (avatarUrl !== originalData.avatar_url) {
        updateData.avatar_url = avatarUrl;
      }

      const response = await userAPI.updateProfile(
        updateData.name,
        updateData.avatar_url
      );

      if (response.success) {
        setSuccessMessage('Profile updated successfully!');

        // Refresh user data in context
        await refreshUserData();

        // Redirecionar após 1.5 segundos
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating profile');
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      {/* Scrollable content wrapper */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-64px)]">
        <div className="max-w-[1128px] mx-auto px-4 py-6">
          <div className="max-w-[880px] mx-auto space-y-2">

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Profile Card */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Cover Image */}
              <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/40 relative"></div>

              {/* Profile Info */}
              <div className="px-6 pb-6">
                {/* Avatar with Upload Button */}
                <div className="relative -mt-16 mb-4">
                  <div className="relative inline-block">
                    {avatarPreview || formData.avatar_url ? (
                      <img
                        src={avatarPreview || formData.avatar_url}
                        alt="Avatar"
                        className="w-32 h-32 rounded-full border-4 border-card object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-32 h-32 rounded-full bg-primary border-4 border-card flex items-center justify-center ${avatarPreview || formData.avatar_url ? 'hidden' : ''
                        }`}
                    >
                      <span className="text-3xl text-primary-foreground font-bold">
                        {initials || <User className="w-12 h-12" />}
                      </span>
                    </div>

                    {/* Upload Button */}
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      disabled={isUploadingImage || isSaving}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors border-4 border-card shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Change avatar"
                    >
                      <Plus className="w-5 h-5" />
                    </button>

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {isUploadingImage && (
                    <p className="text-xs text-muted-foreground mt-2">Uploading image...</p>
                  )}
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      maxLength={50}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !hasChanges()}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>

                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;
