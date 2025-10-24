import React, { useEffect, useState } from 'react';
import Loading from '../components/loading';
import Navigation from '../components/header';
import { Edit2, Mail } from 'lucide-react';
import { connectionAPI } from '../services/connectionService';
import { useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../services/registerService';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { userId: profileUserId } = useParams<{ userId: string }>();
  const [connectionsCount, setConnectionsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = localStorage.getItem('userId') || '';
  const isOwnProfile = !profileUserId || profileUserId === currentUserId;

  const currentUserName = localStorage.getItem('userName') || 'Meu Perfil';
  const currentUserEmail = localStorage.getItem('email') || '';

  const [profileData, setProfileData] = useState({
    name: isOwnProfile ? currentUserName : 'Loading...',
    email: isOwnProfile ? currentUserEmail : '',
  });

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const initials = getInitials(profileData.name);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);

        const userIdToFetch = profileUserId || currentUserId;

        if (!userIdToFetch) {
          console.error('User not logged in');
          navigate('/');
          return;
        }

        // ...

        // Se for o próprio perfil, usar dados do localStorage
        if (isOwnProfile) {
          setProfileData({
            name: currentUserName,
            email: currentUserEmail,
          });
        } else if (profileUserId) {
          // Se for perfil de outro utilizador, buscar do backend
          // ...
          const userProfileResponse = await authAPI.getUserProfile(profileUserId);

          // ...

          if (userProfileResponse.success) {
            // ...

            setProfileData({
              name: userProfileResponse.data.name || 'Unknown User',
              email: userProfileResponse.data.email || '',
            });
          } else {
            console.error('Failed to fetch user profile. Error:', userProfileResponse.error);
            setProfileData({
              name: 'Unknown User',
              email: '',
            });
          }
        }

        // Buscar conexões do utilizador
        const response = await connectionAPI.getConnections(userIdToFetch);

        if (response.success && response.data) {
          setConnectionsCount(response.data.connections.length);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [currentUserId, profileUserId, navigate, isOwnProfile, currentUserName, currentUserEmail]);

  const skills = [''];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      {/* Scrollable content wrapper */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-64px)]"> {/* Adjust 64px if Navigation height changes */}
        <div className="max-w-[1128px] mx-auto px-4 py-6">
          <div className="max-w-[880px] mx-auto space-y-2">
            {/* Profile Card */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Cover Image */}
              <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/40 relative">
              </div>

              {/* Profile Info */}
              <div className="px-6 pb-6">
                {/* Avatar */}
                <div className="relative -mt-16 mb-4">
                  <div className="w-32 h-32 rounded-full bg-primary border-4 border-card flex items-center justify-center">
                    <span className="text-3xl text-primary-foreground font-bold">
                      {initials}
                    </span>
                  </div>
                </div>

                {/* Name and Headline */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h1 className="text-2xl font-bold text-foreground">{profileData.name}</h1>
                    {isOwnProfile && (
                      <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  {profileData.email && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <Mail className="w-4 h-4" />
                      <span>{profileData.email}</span>
                    </div>
                  )}
                  <p className="text-sm text-primary font-medium">
                    {`${connectionsCount} connection${connectionsCount !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">About</h2>
                {isOwnProfile && (
                  <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Experience Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Experience</h2>
                {isOwnProfile && (
                  <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              <div className="space-y-6">
              </div>
            </div>

            {/* Education Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Education</h2>
                {isOwnProfile && (
                  <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              <div className="space-y-6">
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Skills</h2>
                {isOwnProfile && (
                  <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;