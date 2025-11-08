import React, { useEffect, useState } from 'react';
import Loading from '../components/loading';
import Navigation from '../components/header';
import { Edit2, Mail, UserPlus, Check, UserMinus } from 'lucide-react';
import { connectionAPI } from '../services/connectionService';
import { useNavigate, useParams } from 'react-router-dom';
import { userAPI } from '../services/registerService';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { userId: profileUserId } = useParams<{ userId: string }>();
  const [connectionsCount, setConnectionsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isRemovingConnection, setIsRemovingConnection] = useState(false);

  const currentUserId = localStorage.getItem('userId') || '';
  const isOwnProfile = !profileUserId || profileUserId === currentUserId;

  const [profileData, setProfileData] = useState({
    name: 'Loading...',
    email: '',
    avatar_url: null as string | null,
  });

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || '';
  };

  const initials = getInitials(profileData.name);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);

        const userIdToFetch = profileUserId || currentUserId;

        if (!userIdToFetch) {
          navigate('/');
          return;
        }

        // Obter o perfil do utilizador (próprio ou outro)
        let userProfileResponse;

        if (isOwnProfile) {
          // Se for o próprio perfil, usar a API autenticada
          userProfileResponse = await userAPI.getUserProfile();
        } else {
          // Se for perfil de outro utilizador, buscar por ID
          userProfileResponse = await userAPI.getUserProfileById(userIdToFetch);
        }

        if (userProfileResponse.success && userProfileResponse.data) {
          // Response.data is now UserProfileDto: { id, name, email, avatar_url }
          const userData = userProfileResponse.data;

          setProfileData({
            name: userData.name || 'Unknown User',
            email: userData.email || '',
            avatar_url: userData.avatar_url || null,
          });
        } else {
          setProfileData({
            name: 'Unknown User',
            email: '',
            avatar_url: null,
          });
        }

        const response = await connectionAPI.getConnections(userIdToFetch);

        if (response.success && response.data) {
          setConnectionsCount(response.data.connections.length);

          if (!isOwnProfile && profileUserId) {
            const connection = response.data.connections.find(
              (conn: any) => conn.user.id === currentUserId
            );
            if (connection) {
              setIsConnected(true);
              setConnectionId(connection.id);
            } else {
              setIsConnected(false);
              setConnectionId(null);
            }
          }
        }

        if (!isOwnProfile && currentUserId) {
          const pendingResponse = await connectionAPI.getPendingRequests(currentUserId);
          if (pendingResponse.success && pendingResponse.data) {
            const hasPending = pendingResponse.data.pendingRequests.sent.some(
              (req: any) => req.receiver_id === profileUserId
            );
            setHasPendingRequest(hasPending);
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [currentUserId, profileUserId, navigate, isOwnProfile]);

  const skills = [''];

  const handleSendConnectionRequest = async () => {
    if (!profileUserId || !currentUserId) return;

    try {
      setIsSendingRequest(true);
      console.log('Sending connection request:', { senderId: currentUserId, receiverId: profileUserId });
      const response = await connectionAPI.sendConnectionRequest(currentUserId, {
        senderId: currentUserId,
        receiverId: profileUserId,
      });

      if (response.success) {
        setHasPendingRequest(true);
      } else {
        console.error('Error response:', response);
        alert(`Error sending connection request: ${response.success === false ? response.error : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Exception:', error);
      alert('Error sending connection request');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (!connectionId || !currentUserId) return;

    try {
      setIsRemovingConnection(true);
      console.log('Removing connection:', { userId: currentUserId, connectionId });
      const response = await connectionAPI.removeConnection(currentUserId, connectionId);

      if (response.success) {
        setIsConnected(false);
        setConnectionId(null);
        setConnectionsCount(prev => prev - 1);
      } else {
        console.error('Error response:', response);
        alert(`Error removing connection: ${response.success === false ? response.error : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Exception:', error);
      alert('Error removing connection');
    } finally {
      setIsRemovingConnection(false);
    }
  };

  if (isLoading) {
    return <Loading />;
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
                  {profileData.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt={profileData.name}
                      className="w-32 h-32 rounded-full border-4 border-card object-cover"
                      onError={(e) => {
                        // Fallback para iniciais se a imagem falhar
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.classList.remove('hidden');
                        }
                      }}
                    />
                  ) : null}
                  <div className={`w-32 h-32 rounded-full bg-primary border-4 border-card flex items-center justify-center ${profileData.avatar_url ? 'hidden' : ''}`}>
                    <span className="text-3xl text-primary-foreground font-bold">
                      {initials}
                    </span>
                  </div>
                </div>

                {/* Name and Headline */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h1 className="text-2xl font-bold text-foreground">{profileData.name}</h1>
                    {isOwnProfile ? (
                      <button
                        onClick={() => navigate('/update-profile')}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        {isConnected ? (
                          <>
                            <button
                              disabled
                              className="flex items-center gap-2 px-4 py-2 bg-secondary text-muted-foreground rounded-full cursor-not-allowed"
                            >
                              <Check className="w-4 h-4" />
                              <span className="font-medium">Connected</span>
                            </button>
                            <button
                              onClick={handleRemoveConnection}
                              disabled={isRemovingConnection}
                              className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <UserMinus className="w-4 h-4" />
                              <span className="font-medium">
                                {isRemovingConnection ? 'Removing...' : 'Remove'}
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                window.location.href = `/messages?userId=${profileUserId}`;
                              }}

                              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Mail className="w-4 h-4" />
                              <span className="font-medium">Send Message</span>
                            </button>
                          </>
                        ) : hasPendingRequest ? (
                          <button
                            disabled
                            className="flex items-center gap-2 px-4 py-2 bg-secondary text-muted-foreground rounded-full cursor-not-allowed"
                          >
                            <Check className="w-4 h-4" />
                            <span className="font-medium">Request Sent</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleSendConnectionRequest}
                            disabled={isSendingRequest}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span className="font-medium">
                              {isSendingRequest ? 'Sending...' : 'Add'}
                            </span>
                          </button>
                        )}
                      </div>
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
    </div >
  );
};

export default Profile;