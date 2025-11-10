import { useState } from "react";
import { Calendar, MapPin, Clock, Users, Search, Filter, Plus, Video, X, Upload, Globe } from "lucide-react";
import Navigation from "../components/header";
import { Card } from "../components/card";

// Event interface
interface Event {
  id: string;
  title: string;
  organizer: string;
  organizerAvatar: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  image?: string;
  isOnline: boolean;
  category: string;
}

// Mock events data
const mockEvents: Event[] = [
  {
    id: "1",
    title: "Tech Leadership Summit 2025",
    organizer: "Tech Leaders Network",
    organizerAvatar: "TL",
    date: "2025-11-15",
    time: "09:00 AM",
    location: "San Francisco, CA",
    attendees: 234,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
    isOnline: false,
    category: "Technology"
  },
  {
    id: "2",
    title: "Digital Marketing Masterclass",
    organizer: "Marketing Pro Academy",
    organizerAvatar: "MP",
    date: "2025-11-20",
    time: "02:00 PM",
    location: "Online",
    attendees: 567,
    isOnline: true,
    category: "Marketing"
  },
  {
    id: "3",
    title: "Career Development Workshop",
    organizer: "Professional Growth Hub",
    organizerAvatar: "PG",
    date: "2025-11-25",
    time: "10:00 AM",
    location: "New York, NY",
    attendees: 89,
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=400&fit=crop",
    isOnline: false,
    category: "Career"
  },
  {
    id: "4",
    title: "AI & Machine Learning Conference",
    organizer: "AI Innovation Group",
    organizerAvatar: "AI",
    date: "2025-12-01",
    time: "09:30 AM",
    location: "Boston, MA",
    attendees: 412,
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop",
    isOnline: false,
    category: "Technology"
  },
  {
    id: "5",
    title: "Networking Mixer: Startup Edition",
    organizer: "Startup Community",
    organizerAvatar: "SC",
    date: "2025-11-18",
    time: "06:00 PM",
    location: "Austin, TX",
    attendees: 156,
    isOnline: false,
    category: "Networking"
  },
  {
    id: "6",
    title: "Remote Work Best Practices",
    organizer: "Future of Work Institute",
    organizerAvatar: "FW",
    date: "2025-11-22",
    time: "11:00 AM",
    location: "Online",
    attendees: 723,
    isOnline: true,
    category: "Career"
  }
];

export default function Events() {
  const [events] = useState<Event[]>(mockEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const style = document.createElement('style');
  style.innerHTML = `
    html, body {
      overflow: hidden !important;
      height: 100%;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;
  if (typeof window !== 'undefined' && !document.head.querySelector('style[data-scrollbar-hide]')) {
    style.setAttribute('data-scrollbar-hide', 'true');
    document.head.appendChild(style);
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filters = ["All", "Technology", "Marketing", "Career", "Networking"];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "All" || event.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="max-w-[1128px] mx-auto px-6 py-6 flex gap-6">
          {/* Left Sidebar */}
          <div className="hidden md:block w-[225px] flex-shrink-0 space-y-4 sticky top-20">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Filters</h3>
              </div>
              <div className="space-y-2">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedFilter === filter
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Event Type</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-foreground">In-person</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-foreground">Online</span>
                </label>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div
            className="max-w-[540px] w-full space-y-4 h-[calc(100vh-48px-48px)] overflow-y-auto scrollbar-hide"
            style={{ minHeight: 0 }}
          >
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
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                  <Plus className="w-4 h-4" />
                  Create Event
                </button>
              </div>
            </Card>

            {/* Events List */}
            {filteredEvents.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No events found matching your criteria.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    {event.image && (
                      <div className="relative">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="text-xs font-medium px-2.5 py-1 bg-card text-foreground rounded shadow-sm">
                            {event.category}
                          </span>
                          {event.isOnline && (
                            <span className="text-xs font-medium px-2.5 py-1 bg-card text-foreground rounded shadow-sm flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Online
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      {!event.image && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium px-2.5 py-1 bg-secondary text-foreground rounded">
                            {event.category}
                          </span>
                          {event.isOnline && (
                            <span className="text-xs font-medium px-2.5 py-1 bg-secondary text-foreground rounded flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Online
                            </span>
                          )}
                        </div>
                      )}

                      <h3 className="font-semibold text-lg text-foreground">
                        {event.title}
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
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{event.attendees} attendees</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                            {event.organizerAvatar}
                          </div>
                          <span className="text-sm text-foreground font-medium">
                            {event.organizer}
                          </span>
                        </div>
                        <button className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                          Attend
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-[300px] flex-shrink-0 space-y-4 sticky top-20">
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                {events.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex gap-3 cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors">
                    <div className="w-12 h-12 rounded bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs text-primary font-semibold">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                        {event.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {event.attendees} attendees
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Your Events</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Keep track of events you're attending
              </p>
              <button className="w-full px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors">
                View My Events
              </button>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}