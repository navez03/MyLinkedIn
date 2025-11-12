import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Search, Filter, Plus, Video, X, Upload, Lock, UserPlus } from "lucide-react";
import Navigation from "../components/header";
import { useNavigate } from 'react-router-dom';
import AIChatWidget from "../components/AIChatWidget";
import { Card } from "../components/card";
import { eventsService, EventType, LocationType, EventResponse } from "../services/eventsService";
import { connectionAPI } from "../services/connectionService";

interface Connection {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
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
      alert("Please select at least one person to invite");
      return;
    }

    setLoading(true);
    const response = await eventsService.inviteUsers({
      eventId: selectedEvent.id,
      userIds: selectedConnections,
    });

    if (response.success) {
      alert(`Successfully invited ${selectedConnections.length} people!`);
      setShowInviteModal(false);
      setSelectedEvent(null);
      setSelectedConnections([]);
    } else {
      alert("Error sending invites: " + response.error);
    }
    setLoading(false);
  };

  const filteredConnections = connections.filter(conn =>
    conn.user.name.toLowerCase().includes(inviteSearchQuery.toLowerCase()) ||
    conn.user.email.toLowerCase().includes(inviteSearchQuery.toLowerCase())
  );

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        {/* Invite Modal */}
        {showInviteModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Invite people</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedEvent.name}</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
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
                      className="w-full pl-10 pr-4 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Selected count */}
                {selectedConnections.length > 0 && (
                  <div className="mb-4 text-sm text-muted-foreground">
                    {selectedConnections.length} {selectedConnections.length === 1 ? 'person' : 'people'} selected
                  </div>
                )}

                {/* Connections List */}
                <div className="space-y-2">
                  {filteredConnections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {inviteSearchQuery ? "No connections found" : "No connections yet"}
                    </div>
                  ) : (
                    filteredConnections.map((connection) => (
                      <label
                        key={connection.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedConnections.includes(connection.user.id)}
                          onChange={() => handleToggleConnection(connection.user.id)}
                          className="w-4 h-4 rounded"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                            {connection.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{connection.user.name}</p>
                            <p className="text-sm text-muted-foreground">{connection.user.email}</p>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-border px-6 py-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendInvites}
                  disabled={loading || selectedConnections.length === 0}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : `Send ${selectedConnections.length > 0 ? `(${selectedConnections.length})` : ''}`}
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
                      className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        newEvent.locationType === LocationType.IN_PERSON
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
                      className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        newEvent.locationType === LocationType.ONLINE
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
                      className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                        newEvent.eventType === EventType.PUBLIC
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
                      className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                        newEvent.eventType === EventType.PRIVATE
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
                    Description (optional)
                  </label>
                  <textarea
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
              <div className="flex gap-0 bg-secondary rounded-lg p-1 shadow-sm">
                <button
                  className={`px-6 py-2 font-semibold text-sm rounded-l-lg transition-all focus:outline-none border-none ${selectedTab === 'suggested' ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-muted-foreground hover:bg-background'}`}
                  style={{ boxShadow: selectedTab === 'suggested' ? '0 2px 8px rgba(0,0,0,0.06)' : undefined }}
                  onClick={() => setSelectedTab('suggested')}
                >
                  Suggested Events
                </button>
                <button
                  className={`px-6 py-2 font-semibold text-sm rounded-r-lg transition-all focus:outline-none border-none ${selectedTab === 'my' ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-muted-foreground hover:bg-background'}`}
                  style={{ boxShadow: selectedTab === 'my' ? '0 2px 8px rgba(0,0,0,0.06)' : undefined }}
                  onClick={() => setSelectedTab('my')}
                >
                  My Events
                </button>
              </div>
              <div className="flex gap-0 bg-secondary rounded-lg p-1 shadow-sm">
                <button
                  className={`px-4 py-2 font-medium text-sm rounded-l-lg transition-all focus:outline-none border-none ${locationTypeFilter === 'all' ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-muted-foreground hover:bg-background'}`}
                  style={{ boxShadow: locationTypeFilter === 'all' ? '0 2px 8px rgba(0,0,0,0.06)' : undefined }}
                  onClick={() => setLocationTypeFilter('all')}
                >
                  All
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm transition-all focus:outline-none border-none ${locationTypeFilter === 'online' ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-muted-foreground hover:bg-background'}`}
                  style={{ boxShadow: locationTypeFilter === 'online' ? '0 2px 8px rgba(0,0,0,0.06)' : undefined }}
                  onClick={() => setLocationTypeFilter('online')}
                >
                  Online
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm rounded-r-lg transition-all focus:outline-none border-none ${locationTypeFilter === 'inperson' ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-muted-foreground hover:bg-background'}`}
                  style={{ boxShadow: locationTypeFilter === 'inperson' ? '0 2px 8px rgba(0,0,0,0.06)' : undefined }}
                  onClick={() => setLocationTypeFilter('inperson')}
                >
                  In Person
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
                        <div className="relative">
                          <img
                            src={event.bannerUrl}
                            alt={event.name}
                            className="w-full h-48 object-cover"
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
  );
}