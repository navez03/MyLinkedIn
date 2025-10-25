import { useState, useEffect } from "react";
import Loading from "../components/loading";
import { Card } from "../components/card";
import { Button } from "../components/button";
import { Users, UserPlus } from "lucide-react";
import Navigation from "../components/header";
import { connectionAPI } from "../services/connectionService";
import { authAPI, UserProfileDto } from "../services/registerService";

interface Connection {
  user: {
    id: string;
    name: string;
    email: string;
  };
  connected_at: string;
}

interface ConnectionRequest {
  id: number;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
}

const Network = () => {
  const [activeSection, setActiveSection] = useState<'connections' | 'invites'>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [invitations, setInvitations] = useState<(ConnectionRequest & { senderName?: string })[]>([]);
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
        // Buscar nomes dos utilizadores
        const invitationsWithNames = await Promise.all(
          received.map(async (inv) => {
            try {
              const userResp = await authAPI.getUserProfile(inv.sender_id);
              console.log('User profile response for sender:', inv.sender_id, userResp);
              if (userResp.success && userResp.data) {
                return { ...inv, senderName: userResp.data.name };
              }
              return { ...inv, senderName: inv.sender_id };
            } catch (error) {
              console.error('Error fetching user profile for sender:', inv.sender_id, error);
              return { ...inv, senderName: inv.sender_id };
            }
          })
        );
        console.log('Invitations with names:', invitationsWithNames);
        setInvitations(invitationsWithNames);
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
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 bg-primary">
                            {getInitials(invitation.senderName || invitation.sender_id)}
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{invitation.senderName}</h3>
                            <p className="text-sm text-muted-foreground mb-2 truncate">
                              Sent on {new Date(invitation.created_at).toLocaleDateString()}
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
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 bg-primary">
                              {getInitials(connection.user.name)}
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
  );
};

export default Network;
