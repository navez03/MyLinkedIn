import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Share2, ChevronLeft, Video, Search } from "lucide-react";
import Navigation from "../components/header";
import { Card } from "../components/card";
import { useState, useEffect } from "react";
import { eventsService, EventResponse, LocationType } from "../services/eventsService";
import { messagesAPI } from "../services/messagesService";
import { connectionAPI } from "../services/connectionService";
import Loading from "../components/loading";


// Helper to get initials (same logic as used elsewhere)

// Helper to get initials (same logic as used elsewhere)
function getUserInitials(name?: string): string {
  if (!name) {
    return 'OR';
  }
  const parts = name.trim().split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [isAttending, setIsAttending] = useState(false);
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [shareSearchQuery, setShareSearchQuery] = useState("");
  const [selectedShareConnection, setSelectedShareConnection] = useState<string>("");
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    // Get current user ID from localStorage
    const userId = localStorage.getItem('userId');
    setCurrentUserId(userId);
    if (userId) {
      connectionAPI.getConnections(userId).then((res) => {
        if (res.success) setConnections(res.data.connections);
      });
    }
  }, []);

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) {
        setError("No event ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await eventsService.getEventById(eventId);

      if (response.success) {
        setEvent(response.data.event);
        setError(null);

        // Check if current user is already participating
        if (currentUserId && response.data.event.participants) {
          const isParticipating = response.data.event.participants.some(
            (p) => p.id === currentUserId
          );
          setIsAttending(isParticipating);
        }
      } else {
        setError(response.error || "Failed to load event");
      }
      setLoading(false);
    };

    loadEvent();
  }, [eventId, currentUserId]);

  if (loading) {
    return <Loading />;
  }

  if (error || !event) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Event not found</h2>
            <p className="text-muted-foreground mb-4">{error || "The event you're looking for doesn't exist."}</p>
            <button
              onClick={() => navigate('/events')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Back to Events
            </button>
          </Card>
        </div>
      </>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleParticipate = async () => {
    if (!eventId || !currentUserId) return;

    try {
      if (isAttending) {
        // Leave event
        const response = await eventsService.leaveEvent(eventId, currentUserId);
        if (response.success) {
          setIsAttending(false);
          // Update event participants list
          if (event) {
            setEvent({
              ...event,
              participants: event.participants?.filter(p => p.id !== currentUserId) || []
            });
          }
        }
      } else {
        // Join event
        const response = await eventsService.participateInEvent(eventId);
        if (response.success) {
          setIsAttending(true);
          // Reload event to get updated participants
          const eventResponse = await eventsService.getEventById(eventId);
          if (eventResponse.success) {
            setEvent(eventResponse.data.event);
          }
        }
      }
    } catch (error) {
      console.error("Error handling participation:", error);
    }
  };

  return (
    <>
      <div style={{ overflowY: 'auto', height: '100vh' }}>
        <Navigation />
        <div className="min-h-screen bg-background">
          <div className="max-w-[1128px] mx-auto px-6 py-6">
            {/* Back Button */}
            <button
              onClick={() => navigate('/events')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Events</span>
            </button>

            <div className="flex gap-6">
              {/* Main Content */}
              <div className="flex-1 space-y-4">
                {/* Event Image */}
                {event.bannerUrl && (
                  <Card className="overflow-hidden bg-white flex items-center justify-center" style={{ height: 400 }}>
                    <img
                      src={event.bannerUrl}
                      alt={event.name}
                      className="max-h-full max-w-full object-contain mx-auto"
                      style={{ background: 'white', width: '100%', height: '100%', display: 'block' }}
                    />
                  </Card>
                )}

                {/* Event Header */}
                <Card className="p-6">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-xs font-medium px-2.5 py-1 bg-white text-black rounded border border-border">
                      {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 bg-white text-black rounded border border-border">
                      {event.locationType.charAt(0).toUpperCase() + event.locationType.slice(1)}
                    </span>
                  </div>

                  <h1 className="text-3xl font-bold text-foreground mb-6">{event.name}</h1>

                  {/* Event Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground font-medium">
                          {formatDate(event.date)} at {event.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground font-medium">{event.location}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* About Event */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">About the event</h2>
                  <p className="text-foreground whitespace-pre-line leading-relaxed">{event.description}</p>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="hidden lg:block w-[300px] flex-shrink-0 space-y-4 sticky top-20 self-start">
                {/* Action Card */}
                <Card className="p-4">
                  {/* Only show Participate button if user is not the organizer */}
                  {currentUserId && event.organizerId !== currentUserId && (
                    <button
                      type="button"
                      onClick={handleParticipate}
                      className={`w-full px-4 py-3 rounded-lg font-semibold transition-all mb-3 ${isAttending
                        ? "bg-secondary text-foreground border-2 border-primary"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                        }`}
                    >
                      {isAttending ? "✓ Attending" : "Participate"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUserId) {
                        alert('You must be logged in to share this event');
                        return;
                      }
                      setShowShareModal(true);
                    }}
                    className="w-full px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2 mb-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  {/* Share Modal */}
                  {showShareModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="sticky top-0 bg-gradient-to-r from-orange-500/10 to-transparent border-b border-border px-6 py-4 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-semibold text-foreground">Share Event</h2>
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">{event?.name}</p>
                          </div>
                          <button
                            onClick={() => setShowShareModal(false)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded-full ml-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                          {/* Search */}
                          <div className="mb-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Search connections..."
                                value={shareSearchQuery}
                                onChange={(e) => setShareSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                              />
                            </div>
                          </div>
                          {/* Connections List */}
                          <div className="space-y-2">
                            {connections.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
                                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                </div>
                                <p className="text-sm font-medium text-foreground">No connections yet</p>
                                <p className="text-xs text-muted-foreground mt-1">Connect with people to share events</p>
                              </div>
                            ) : (
                              connections.filter(conn =>
                                conn.user.name.toLowerCase().includes(shareSearchQuery.toLowerCase()) ||
                                conn.user.email.toLowerCase().includes(shareSearchQuery.toLowerCase())
                              ).map((connection) => (
                                <label
                                  key={connection.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedShareConnection === connection.user.id
                                      ? 'bg-primary/10 border-primary'
                                      : 'bg-transparent border-transparent hover:bg-secondary'
                                    }`}
                                >
                                  <input
                                    type="radio"
                                    checked={selectedShareConnection === connection.user.id}
                                    onChange={() => setSelectedShareConnection(connection.user.id)}
                                    className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                                  />
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {connection.user.avatar_url ? (
                                      <img
                                        src={connection.user.avatar_url}
                                        alt={connection.user.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          if (e.currentTarget.nextElementSibling) {
                                            e.currentTarget.nextElementSibling.classList.remove('hidden');
                                          }
                                        }}
                                      />
                                    ) : null}
                                    <div className={`w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold ${connection.user.avatar_url ? 'hidden' : ''}`}>
                                      {connection.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-foreground truncate">{connection.user.name}</p>
                                      <p className="text-sm text-muted-foreground truncate">{connection.user.email}</p>
                                    </div>
                                  </div>
                                  {selectedShareConnection === connection.user.id && (
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                      <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="border-t border-border px-6 py-4 flex gap-3 bg-secondary/20">
                          <button
                            type="button"
                            onClick={() => setShowShareModal(false)}
                            className="flex-1 px-4 py-2.5 border-2 border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={shareLoading || !selectedShareConnection}
                            onClick={async () => {
                              if (!selectedShareConnection || !currentUserId || !event?.id) return;
                              setShareLoading(true);
                              try {
                                const res = await messagesAPI.sendMessage(currentUserId, selectedShareConnection, '', undefined, event.id);
                                setShareLoading(false);
                                if (res.success) {
                                  const userName = connections.find(c => c.user.id === selectedShareConnection)?.user.name || 'user';
                                  setShowShareModal(false);
                                  setSelectedShareConnection("");
                                } else {
                                  alert('X Error sharing event: ' + (res.error || 'Unknown error'));
                                }
                              } catch (error) {
                                setShareLoading(false);
                                alert('X Failed to share event. Please try again.');
                              }
                            }}
                            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 disabled:shadow-none"
                          >
                            {shareLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sharing...
                              </span>
                            ) : 'Share Event'}
                          </button>
                        </div>
                      </Card>
                    </div>
                  )}
                </Card>

                {/* Organizer Card */}
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-3">Organizer</h3>
                  <div className="flex items-center gap-3">
                    {event.organizerAvatar ? (
                      <img
                        src={event.organizerAvatar}
                        alt={event.organizerName || 'Organizer'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {getUserInitials(event.organizerName)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{event.organizerName || 'Unknown Organizer'}</p>
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => {
                          if (event.organizerId) {
                            navigate(`/profile/${event.organizerId}`);
                          }
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                </Card>
                {/* Attendance Card */}
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-3">
                    Attendance {event.participants && event.participants.length > 0 && `(${event.participants.length})`}
                  </h3>
                  {event.participants && event.participants.length > 0 ? (
                    <>
                      <div className="flex -space-x-2 mb-3">
                        {event.participants.slice(0, 5).map((participant) => (
                          <div
                            key={participant.id}
                            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold border-2 border-card"
                            title={participant.name}
                          >
                            {participant.avatarUrl ? (
                              <img
                                src={participant.avatarUrl}
                                alt={participant.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getUserInitials(participant.name)
                            )}
                          </div>
                        ))}
                        {event.participants.length > 5 && (
                          <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center text-xs font-semibold border-2 border-card">
                            +{event.participants.length - 5}
                          </div>
                        )}
                      </div>
                      {event.participants.length > 5 && (
                        <button type="button" className="text-sm text-primary hover:underline">
                          View All {event.participants.length} Participants
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No participants yet</p>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}