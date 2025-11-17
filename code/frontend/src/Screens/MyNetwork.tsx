import { useState, useEffect } from "react";
import Loading from "../components/loading";
import { Card } from "../components/card";
import { Button } from "../components/button";
import { Users, UserPlus } from "lucide-react";
import Navigation from "../components/header";
import { connectionAPI } from "../services/connectionService";
import { userAPI } from "../services/registerService";
import AIChatWidget from "../components/AIChatWidget";

interface Connection {
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  };
  connected_at: string;
}

interface ConnectionRequest {
  id: number;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  };
}

const Network = () => {
  const [activeSection, setActiveSection] = useState<'connections' | 'invites'>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [invitations, setInvitations] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const currentUserId = localStorage.getItem('userId') || '';

  useEffect(() => {
    loadConnections();
    loadRequests();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const response = await connectionAPI.getConnections(currentUserId);
      if (response.success) {
        setConnections(response.data.connections);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await connectionAPI.getPendingRequests(currentUserId);
      if (response.success) {
        const received = response.data.pendingRequests.received;
        
        // Buscar informações completas de cada sender usando userAPI
        const invitationsWithSenderData = await Promise.all(
          received.map(async (inv) => {
            try {
              // Usar userAPI.getUserProfileById em vez de fetch direto
              const userResponse = await userAPI.getUserProfileById(inv.sender_id);
              
              if (userResponse.success && userResponse.data) {
                console.log('User profile loaded:', userResponse.data);
                return {
                  ...inv,
                  sender: {
                    id: inv.sender_id,
                    name: userResponse.data.name || 'Unknown User',
                    email: userResponse.data.email || '',
                    avatar_url: userResponse.data.avatar_url || null
                  }
                };
              }
            } catch (error) {
              console.error(`Error fetching sender data for ${inv.sender_id}:`, error);
            }
            
            return {
              ...inv,
              sender: {
                id: inv.sender_id,
                name: 'Unknown User',
                email: '',
                avatar_url: null
              }
            };
          })
        );
        
        console.log('Invitations with sender data:', invitationsWithSenderData);
        setInvitations(invitationsWithSenderData);
      }
    } catch (error) {
      console.error('Error loading connection requests:', error);
    }
  };

  const handleAcceptInvitation = async (requestId: number) => {
    try {
      const response = await connectionAPI.acceptConnectionRequest(currentUserId, {
        requestId,
        userId: currentUserId
      });
      if (response.success) {
        loadConnections();
        loadRequests();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleRejectInvitation = async (requestId: number) => {
    try {
      const response = await connectionAPI.rejectConnectionRequest(currentUserId, requestId.toString());
      if (response.success) {
        loadRequests();
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || '';
  };


  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-[1128px] mx-auto px-4 py-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-3">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Manage my network</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveSection('connections')}
                    className={`w-full flex items-center justify-between py-2 hover:bg-secondary rounded px-2 transition-colors ${activeSection === 'connections' ? 'bg-secondary' : ''}`}
                  >
                    <span className="text-sm">Connections</span>
                    <span className="text-sm font-semibold text-muted-foreground">{connections.length}</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('invites')}
                    className={`w-full flex items-center justify-between py-2 hover:bg-secondary rounded px-2 transition-colors ${activeSection === 'invites' ? 'bg-secondary' : ''}`}
                  >
                    <span className="text-sm">Invitations</span>
                    <span className="text-sm font-semibold text-muted-foreground">{invitations.length}</span>
                  </button>
                </div>
              </Card>
            </div>
            <div className="col-span-12 lg:col-span-9 space-y-4">
              {activeSection === 'invites' && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="w-5 h-5" />
                    <h2 className="text-xl font-semibold">Invitations to connect</h2>
                  </div>
                  {invitations.length === 0 ? (
                    <p className="text-center text-muted-foreground">No pending invitations</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {invitations.map((invitation) => (
                        <div key={invitation.id} className="flex flex-col items-center p-4 border border-border rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                          <div className="flex items-center w-full mb-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg flex-shrink-0 overflow-hidden ${invitation.sender?.avatar_url ? '' : 'bg-primary'}`}>
                              {invitation.sender?.avatar_url ? (
                                <img
                                  src={invitation.sender.avatar_url}
                                  alt={invitation.sender.name}
                                  className="w-full h-full object-cover"
                                  style={{ background: 'none', border: 'none' }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.classList.add('bg-primary');
                                      const initials = document.createElement('span');
                                      initials.className = 'text-sm text-white font-semibold';
                                      initials.textContent = getInitials(invitation.sender?.name || 'Unknown');
                                      parent.appendChild(initials);
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-sm text-white font-semibold">
                                  {getInitials(invitation.sender?.name || 'Unknown')}
                                </span>
                              )}
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{invitation.sender?.name || 'Unknown User'}</h3>
                              <p className="text-sm text-muted-foreground mb-2 truncate">
                                {invitation.sender?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full mt-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleAcceptInvitation(invitation.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleRejectInvitation(invitation.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
              {activeSection === 'connections' && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5" />
                    <h2 className="text-xl font-semibold">My connections</h2>
                  </div>
                  {connections.length === 0 ? (
                    <p className="text-center text-muted-foreground">No connections yet</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {connections.map((connection, index) => {
                        return (
                          <div key={index} className="flex flex-col items-center p-4 border border-border rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                            <div className="flex items-center w-full mb-2">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg flex-shrink-0 overflow-hidden ${connection.user.avatar_url ? '' : 'bg-primary'}`}>
                                {connection.user.avatar_url ? (
                                  <img
                                    src={connection.user.avatar_url}
                                    alt={connection.user.name}
                                    className="w-full h-full object-cover"
                                    style={{ background: 'none', border: 'none' }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.nextElementSibling) {
                                        e.currentTarget.nextElementSibling.classList.remove('hidden');
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-sm text-white font-semibold">
                                    {getInitials(connection.user.name) || '?'}
                                  </span>
                                )}
                              </div>
                              <div className="ml-4 flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{connection.user.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2 truncate">
                                  {connection.user.email}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm" variant="outline" className="w-full mt-2" onClick={() => { window.location.href = `/messages?userId=${connection.user.id}`; }}
                            >
                              Send message
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <AIChatWidget />
    </>
  );
};

export default Network;
