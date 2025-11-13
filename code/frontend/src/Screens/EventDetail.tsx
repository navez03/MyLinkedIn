import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Share2, ChevronLeft, Video } from "lucide-react";
import Navigation from "../components/header";
import { Card } from "../components/card";
import { useState, useEffect } from "react";
import { eventsService, EventResponse, LocationType } from "../services/eventsService";
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

  useEffect(() => {
    // Get current user ID from localStorage
    const userId = localStorage.getItem('userId');
    setCurrentUserId(userId);
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
        } else {
          alert(response.error || "Failed to leave event");
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
        } else {
          alert(response.error || "Failed to join event");
        }
      }
    } catch (error) {
      console.error("Error handling participation:", error);
      alert("An error occurred. Please try again.");
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
                  <Card className="overflow-hidden">
                    <img
                      src={event.bannerUrl}
                      alt={event.name}
                      className="w-full h-[400px] object-cover"
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
                      {isAttending ? "Attending ✓" : "Participate"}
                    </button>
                  )}

                  <button
                    type="button"
                    className="w-full px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2 mb-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </Card>

                {/* Organizer Card */}
                <Card className="p-4">
                  <h3 className="font-semibold text-foreground mb-3">Organizer</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {event.organizerAvatar ? null : getUserInitials(event.organizerName)}
                    </div>
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