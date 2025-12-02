import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Search, Filter, Plus, Video, X, Upload, Lock, UserPlus } from "lucide-react";
import Navigation from "../components/header";
import { useNavigate } from 'react-router-dom';
import AIChatWidget from "../components/AIChatWidget";
import { Card } from "../components/card";
import { eventsService, EventType, LocationType, EventResponse } from "../services/eventsService";
import { connectionAPI } from "../services/connectionService";
import Loading from "../components/loading";

interface Connection {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  };
  connected_at: string;
}

export default function Events() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'my' | 'suggested'>('suggested');
  const [locationTypeFilter, setLocationTypeFilter] = useState<'all' | 'online' | 'inperson'>('all');
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
    description: "",
    locationType: LocationType.IN_PERSON,
    eventType: EventType.PUBLIC,
    bannerUrl: ""
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Load events on component mount
  useEffect(() => {
    loadEvents();
    loadConnections();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const response = await eventsService.getAllEvents(20, 0);
    if (response.success) {
      setEvents(response.data.events);
    } else {
      console.error("Error loading events:", response.error);
    }
    setLoading(false);
  };

  const loadConnections = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const response = await connectionAPI.getConnections(userId);
    if (response.success) {
      setConnections(response.data.connections);
    } else {
      console.error("Error loading connections:", response.error);
    }
  };

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
      (event.organizerName && event.organizerName.toLowerCase().startsWith(searchQuery.toLowerCase()));
    const matchesFilter = selectedFilter === "All";
    const matchesTab = selectedTab === 'my'
      ? event.organizerId === userId
      : event.organizerId !== userId;
    const matchesLocationType = locationTypeFilter === 'all'
      ? true
      : locationTypeFilter === 'online'
        ? event.locationType === LocationType.ONLINE
        : event.locationType === LocationType.IN_PERSON;
    return matchesSearch && matchesFilter && matchesTab && matchesLocationType;
  });

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("File must be an image");
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let bannerUrl = "";

      // Upload banner if one was selected
      if (bannerFile) {
        setUploadingBanner(true);
        const uploadResponse = await eventsService.uploadBanner(bannerFile);
        setUploadingBanner(false);

        if (uploadResponse.success) {
          bannerUrl = uploadResponse.data.bannerUrl;
        } else {
          alert("Error uploading banner: " + uploadResponse.error);
          setLoading(false);
          return;
        }
      }

      // Create event
      const eventData = {
        name: newEvent.name,
        date: newEvent.date,
        time: newEvent.time,
        locationType: newEvent.locationType,
        location: newEvent.location,
        description: newEvent.description,
        eventType: newEvent.eventType,
        bannerUrl: bannerUrl || undefined,
      };

      const response = await eventsService.createEvent(eventData);

      if (response.success) {
        setShowCreateModal(false);
        // Reset form
        setNewEvent({
          name: "",
          date: "",
          time: "",
          location: "",
          description: "",
          locationType: LocationType.IN_PERSON,
          eventType: EventType.PUBLIC,
          bannerUrl: ""
        });
        setBannerFile(null);
        setBannerPreview("");
        // Reload events
        loadEvents();
        // Aqui pode adicionar um toast ou snackbar se quiser feedback visual
      } else {
        alert("Error creating event: " + response.error);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Error creating event");
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/event-detail/${eventId}`); // This assumes your detail route is set up as /event-detail/:eventId
  };

  const handleOpenInviteModal = (event: EventResponse) => {
    const userId = localStorage.getItem('userId');
    if (event.organizerId !== userId) {
      alert("Only the event organizer can invite people");
      return;
    }
    setSelectedEvent(event);
    setSelectedConnections([]);
    setInviteSearchQuery("");
    setShowInviteModal(true);
  };

  const handleToggleConnection = (connectionId: string) => {
    setSelectedConnections(prev =>
      prev.includes(connectionId)
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    );
  };

  const handleSendInvites = async () => {
    if (!selectedEvent || selectedConnections.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const response = await eventsService.inviteUsers({
        eventId: selectedEvent.id,
        userIds: selectedConnections,
      });

      if (response.success) {
        setShowInviteModal(false);
        setSelectedEvent(null);
        setSelectedConnections([]);
        // Success feedback - you can replace alert with a toast notification
        const count = selectedConnections.length;
      } else {
        alert("❌ Error sending invites: " + response.error);
      }
    } catch (error) {
      console.error("Error sending invites:", error);
      alert("❌ Failed to send invitations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(conn =>
    conn.user.name.toLowerCase().includes(inviteSearchQuery.toLowerCase()) ||
    conn.user.email.toLowerCase().includes(inviteSearchQuery.toLowerCase())
  );

  return (
    <>
      {loading && events.length === 0 ? (
        <Loading />
      ) : (
        <>
          <Navigation />
          <div className="min-h-screen bg-background">
            {/* Invite Modal */}
            {showInviteModal && selectedEvent && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                  <div className="sticky top-0 bg-gradient-to-r from-blue-500/10 to-transparent border-b border-border px-6 py-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-semibold text-foreground">Invite to Event</h2>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{selectedEvent.name}</p>
                    </div>
                    <button
                      onClick={() => setShowInviteModal(false)}
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
                          value={inviteSearchQuery}
                          onChange={(e) => setInviteSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                      </div>
                    </div>

                    {/* Selected count */}
                    {selectedConnections.length > 0 && (
                      <div className="mb-4 px-3 py-2 bg-primary/10 rounded-lg">
                        <p className="text-sm font-medium text-foreground">
                          {selectedConnections.length} {selectedConnections.length === 1 ? 'person' : 'people'} selected
                        </p>
                      </div>
                    )}

                    {/* Connections List */}
                    <div className="space-y-2">
                      {filteredConnections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
                            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {inviteSearchQuery ? "No connections found" : "No connections yet"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {inviteSearchQuery ? "Try a different search" : "Connect with people to invite them"}
                          </p>
                        </div>
                      ) : (
                        filteredConnections.map((connection) => (
                          <label
                            key={connection.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedConnections.includes(connection.user.id)
                              ? 'bg-primary/10 border-primary hover:bg-primary/15'
                              : 'bg-transparent border-transparent hover:bg-secondary'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedConnections.includes(connection.user.id)}
                              onChange={() => handleToggleConnection(connection.user.id)}
                              className="w-5 h-5 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                            />
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
                            {selectedConnections.includes(connection.user.id) && (
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
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 px-4 py-2.5 border-2 border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendInvites}
                      disabled={loading || selectedConnections.length === 0}
                      className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 disabled:shadow-none"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        `Invite ${selectedConnections.length > 0 ? `(${selectedConnections.length})` : ''}`
                      )}
                    </button>
                  </div>
                </Card>
              </div>
            )}

            {/* Create Event Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Create an event</h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                    {/* Event Title */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Event title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                        placeholder="Enter event name"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Location Type */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Location type *
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setNewEvent({ ...newEvent, locationType: LocationType.IN_PERSON })}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${newEvent.locationType === LocationType.IN_PERSON
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <MapPin className="w-4 h-4 inline mr-2" />
                          In person
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({ ...newEvent, locationType: LocationType.ONLINE })}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${newEvent.locationType === LocationType.ONLINE
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <Video className="w-4 h-4 inline mr-2" />
                          Online
                        </button>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {newEvent.locationType === LocationType.ONLINE ? "Event link" : "Location"} *
                      </label>
                      <input
                        type="text"
                        required
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        placeholder={newEvent.locationType === LocationType.ONLINE ? "Add meeting link" : "Add location"}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={newEvent.date}
                          onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Time *
                        </label>
                        <input
                          type="time"
                          required
                          value={newEvent.time}
                          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Event Type (Public/Private) */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Visibility *
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setNewEvent({ ...newEvent, eventType: EventType.PUBLIC })}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2 ${newEvent.eventType === EventType.PUBLIC
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <Plus className="w-4 h-4 inline mr-2" />
                          Public
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent({ ...newEvent, eventType: EventType.PRIVATE })}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2 ${newEvent.eventType === EventType.PRIVATE
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <Lock className="w-4 h-4 inline mr-2" />
                          Private
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description *
                      </label>
                      <textarea
                        required
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Describe your event..."
                        rows={4}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>

                    {/* Event Image Upload (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Event banner (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                        id="banner-upload"
                      />
                      <label
                        htmlFor="banner-upload"
                        className="block border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        {bannerPreview ? (
                          <div className="relative">
                            <img src={bannerPreview} alt="Banner preview" className="w-full h-32 object-cover rounded" />
                            <p className="text-xs text-muted-foreground mt-2">Click to change banner</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || uploadingBanner}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingBanner ? 'Uploading banner...' : loading ? 'Creating...' : 'Create Event'}
                      </button>
                    </div>
                  </form>
                </Card>
              </div>
            )}

            <div className="w-full flex flex-col items-center justify-center px-6 py-6">
              {/* Main Content */}
              <div
                className="max-w-6xl w-full space-y-4 mx-auto" // REMOVIDO h-[...] e overflow-y-auto
                style={{ minHeight: 0 }}
              >
                {/* Tabs & Location Type Filter */}
                <div className="flex flex-wrap mb-6 justify-between items-center w-full mx-auto">
                  <div className="flex gap-3 bg-secondary rounded-lg p-2 shadow-sm">
                    <button
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all focus:outline-none border-none"
                      style={{ background: selectedTab === 'suggested' ? 'rgba(0, 65, 130, 0.08)' : 'transparent' }}
                      onClick={() => setSelectedTab('suggested')}
                    >
                      <span
                        className={`w-4 h-4 rounded-full ${selectedTab === 'suggested' ? 'bg-primary' : 'bg-border'}`}
                      ></span>
                      <span className={`font-semibold text-sm ${selectedTab === 'suggested' ? 'text-primary' : 'text-muted-foreground'}`}>Suggested Events</span>
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all focus:outline-none border-none"
                      style={{ background: selectedTab === 'my' ? 'rgba(0, 65, 130, 0.08)' : 'transparent' }}
                      onClick={() => setSelectedTab('my')}
                    >
                      <span
                        className={`w-4 h-4 rounded-full ${selectedTab === 'my' ? 'bg-primary' : 'bg-border'}`}
                      ></span>
                      <span className={`font-semibold text-sm ${selectedTab === 'my' ? 'text-primary' : 'text-muted-foreground'}`}>My Events</span>
                    </button>
                  </div>
                  <div className="flex gap-3 bg-secondary rounded-lg p-2 shadow-sm">
                    <button
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all focus:outline-none border-none"
                      style={{ background: locationTypeFilter === 'all' ? 'rgba(0, 65, 130, 0.08)' : 'transparent' }}
                      onClick={() => setLocationTypeFilter('all')}
                    >
                      <span
                        className={`w-4 h-4 rounded-full ${locationTypeFilter === 'all' ? 'bg-primary' : 'bg-border'}`}
                      ></span>
                      <span className={`font-medium text-sm ${locationTypeFilter === 'all' ? 'text-primary' : 'text-muted-foreground'}`}>All</span>
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all focus:outline-none border-none"
                      style={{ background: locationTypeFilter === 'online' ? 'rgba(0, 65, 130, 0.08)' : 'transparent' }}
                      onClick={() => setLocationTypeFilter('online')}
                    >
                      <span
                        className={`w-4 h-4 rounded-full ${locationTypeFilter === 'online' ? 'bg-primary' : 'bg-border'}`}
                      ></span>
                      <span className={`font-medium text-sm ${locationTypeFilter === 'online' ? 'text-primary' : 'text-muted-foreground'}`}>Online</span>
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all focus:outline-none border-none"
                      style={{ background: locationTypeFilter === 'inperson' ? 'rgba(0, 65, 130, 0.08)' : 'transparent' }}
                      onClick={() => setLocationTypeFilter('inperson')}
                    >
                      <span
                        className={`w-4 h-4 rounded-full ${locationTypeFilter === 'inperson' ? 'bg-primary' : 'bg-border'}`}
                      ></span>
                      <span className={`font-medium text-sm ${locationTypeFilter === 'inperson' ? 'text-primary' : 'text-muted-foreground'}`}>In Person</span>
                    </button>
                  </div>
                </div>
                {/* Search and Create Event */}
                <Card className="p-4">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowCreateModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      Create Event
                    </button>
                  </div>
                </Card>

                <div
                  style={{ maxHeight: '70vh', overflowY: 'auto' }}
                  className="scrollbar-hide"
                >
                  {loading && events.length === 0 ? (
                    <Card className="p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                      <p className="text-muted-foreground">Loading events...</p>
                    </Card>
                  ) : filteredEvents.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No events found matching your criteria.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {filteredEvents.map((event) => (
                        <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                          {event.bannerUrl && (
                            <div className="relative bg-white flex items-center justify-center" style={{ height: 192 }}>
                              <img
                                src={event.bannerUrl}
                                alt={event.name}
                                className="object-contain mx-auto"
                                style={{ background: 'white', width: '100%', height: '100%', maxHeight: '100%', maxWidth: '100%', display: 'block' }}
                              />
                              <div className="absolute top-3 left-3 flex gap-2">
                                <span className="text-xs font-medium px-2.5 py-1 bg-card text-foreground rounded shadow-sm">
                                  {event.eventType === EventType.PUBLIC ? 'Public' : 'Private'}
                                </span>
                                {event.locationType === LocationType.ONLINE && (
                                  <span className="text-xs font-medium px-2.5 py-1 bg-card text-foreground rounded shadow-sm flex items-center gap-1">
                                    <Video className="w-3 h-3" />
                                    Online
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="p-4 space-y-3">
                            {!event.bannerUrl && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium px-2.5 py-1 bg-secondary text-foreground rounded">
                                  {event.eventType === EventType.PUBLIC ? 'Public' : 'Private'}
                                </span>
                                {event.locationType === LocationType.ONLINE && (
                                  <span className="text-xs font-medium px-2.5 py-1 bg-secondary text-foreground rounded flex items-center gap-1">
                                    <Video className="w-3 h-3" />
                                    Online
                                  </span>
                                )}
                              </div>
                            )}

                            <h3 className="font-semibold text-lg text-foreground">
                              {event.name}
                            </h3>

                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(event.date)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" />
                                  <span>{event.time}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="flex items-center gap-2">
                                {event.organizerAvatar ? (
                                  <img src={event.organizerAvatar} alt={event.organizerName || 'Organizer'} className="w-8 h-8 rounded-full" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                                    {event.organizerName?.charAt(0) || 'U'}
                                  </div>
                                )}
                                <span className="text-sm text-foreground font-medium">
                                  {event.organizerName || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {event.organizerId === localStorage.getItem('userId') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenInviteModal(event);
                                    }}
                                    className="px-3 py-1.5 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors flex items-center gap-1.5"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    Invite
                                  </button>
                                )}
                                <button
                                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(`/events/${event.id}`);
                                  }}
                                >
                                  <span>View Event</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <AIChatWidget />
        </>
      )}
    </>
  );
}