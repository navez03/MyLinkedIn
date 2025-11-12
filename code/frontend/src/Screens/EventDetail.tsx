import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, Users, Share2, ExternalLink, ChevronLeft, Video } from "lucide-react";
import Navigation from "../components/header";
import { Card } from "../components/card";
import { useState } from "react";

// Mock event data (in a real app, you'd fetch this from your API)
const mockEvents = {
  "1": {
    id: "1",
    title: "Tech Leadership Summit 2025",
    organizer: "Tech Leaders Network",
    organizerAvatar: "TL",
    date: "2025-11-15",
    time: "09:00 AM",
    endTime: "05:00 PM",
    location: "San Francisco, CA",
    fullLocation: "Moscone Center, 747 Howard St, San Francisco, CA 94103",
    attendees: 234,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop",
    isOnline: false,
    category: "Technology",
    description: "Join us for a full-day summit bringing together tech leaders from around the world. This event features keynote speakers, panel discussions, and networking opportunities focused on emerging technologies, leadership strategies, and innovation in the tech industry.",
    eventLink: "https://techleadershipsummit.com",
    agenda: [
      "09:00 - 09:30 - Registration & Welcome Coffee",
      "09:30 - 10:30 - Keynote: The Future of Tech Leadership",
      "10:45 - 12:00 - Panel Discussion: AI & Ethics",
      "12:00 - 13:00 - Networking Lunch",
      "13:00 - 14:30 - Workshop: Building High-Performance Teams",
      "14:45 - 16:00 - Case Studies & Best Practices",
      "16:15 - 17:00 - Closing Remarks & Networking"
    ]
  },
  "2": {
    id: "2",
    title: "Digital Marketing Masterclass",
    organizer: "Marketing Pro Academy",
    organizerAvatar: "MP",
    date: "2025-11-20",
    time: "02:00 PM",
    endTime: "04:00 PM",
    location: "Online",
    fullLocation: "Online Event via Zoom",
    image: "",
    attendees: 567,
    isOnline: true,
    category: "Marketing",
    description: "Learn the latest digital marketing strategies from industry experts. This masterclass covers SEO, social media marketing, content strategy, and conversion optimization techniques that drive real results.",
    eventLink: "https://zoom.us/j/example",
    agenda: [
      "14:00 - 14:15 - Introduction & Agenda Overview",
      "14:15 - 14:45 - SEO Best Practices for 2025",
      "14:45 - 15:15 - Social Media Marketing Strategies",
      "15:15 - 15:30 - Break",
      "15:30 - 16:00 - Q&A and Live Examples"
    ]
  },
  "3": {
    id: "3",
    title: "Career Development Workshop",
    organizer: "Professional Growth Hub",
    organizerAvatar: "PG",
    date: "2025-11-25",
    time: "10:00 AM",
    endTime: "12:00 PM",
    location: "New York, NY",
    fullLocation: "WeWork, 1460 Broadway, New York, NY 10036",
    attendees: 89,
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200&h=600&fit=crop",
    isOnline: false,
    category: "Career",
    description: "Transform your career with practical strategies for professional growth. This workshop covers resume optimization, interview techniques, personal branding, and networking strategies that will help you stand out in today's competitive job market.",
    eventLink: "https://careerworkshop.com",
    agenda: [
      "10:00 - 10:15 - Welcome & Introductions",
      "10:15 - 10:45 - Building Your Personal Brand",
      "10:45 - 11:15 - Resume & LinkedIn Optimization",
      "11:15 - 11:30 - Break",
      "11:30 - 12:00 - Networking Strategies & Q&A"
    ]
  },
  "4": {
    id: "4",
    title: "AI & Machine Learning Conference",
    organizer: "AI Innovation Group",
    organizerAvatar: "AI",
    date: "2025-12-01",
    time: "09:30 AM",
    endTime: "06:00 PM",
    location: "Boston, MA",
    fullLocation: "Boston Convention Center, 415 Summer St, Boston, MA 02210",
    attendees: 412,
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop",
    isOnline: false,
    category: "Technology",
    description: "Explore the cutting edge of artificial intelligence and machine learning. This conference brings together researchers, practitioners, and industry leaders to share insights on the latest developments in AI, deep learning, and neural networks.",
    eventLink: "https://aimlconf.com",
    agenda: [
      "09:30 - 10:00 - Registration & Networking",
      "10:00 - 11:00 - Keynote: The AI Revolution",
      "11:15 - 12:30 - Technical Sessions Track 1",
      "12:30 - 13:30 - Lunch & Poster Session",
      "13:30 - 15:00 - Technical Sessions Track 2",
      "15:15 - 16:30 - Panel: Ethics in AI",
      "16:30 - 18:00 - Networking Reception"
    ]
  },
  "5": {
    id: "5",
    title: "Networking Mixer: Startup Edition",
    organizer: "Startup Community",
    organizerAvatar: "SC",
    date: "2025-11-18",
    time: "06:00 PM",
    endTime: "09:00 PM",
    location: "Austin, TX",
    fullLocation: "Capital Factory, 701 Brazos St, Austin, TX 78701",
    attendees: 156,
    isOnline: false,
    image: "",
    category: "Networking",
    description: "Connect with fellow entrepreneurs, investors, and startup enthusiasts in an informal networking setting. This mixer is perfect for making meaningful connections, sharing ideas, and discovering collaboration opportunities in the startup ecosystem.",
    eventLink: "",
    agenda: [
      "18:00 - 18:30 - Check-in & Welcome Drinks",
      "18:30 - 19:00 - Speed Networking Sessions",
      "19:00 - 20:00 - Open Networking & Refreshments",
      "20:00 - 21:00 - Casual Conversations & Wrap-up"
    ]
  },
  "6": {
    id: "6",
    title: "Remote Work Best Practices",
    organizer: "Future of Work Institute",
    organizerAvatar: "FW",
    date: "2025-11-22",
    image:"",
    time: "11:00 AM",
    endTime: "01:00 PM",
    location: "Online",
    fullLocation: "Online Event via Microsoft Teams",
    attendees: 723,
    isOnline: true,
    category: "Career",
    description: "Master the art of remote work with proven strategies from industry leaders. Learn how to maintain productivity, build strong team connections, achieve work-life balance, and leverage tools for effective remote collaboration.",
    eventLink: "https://teams.microsoft.com/example",
    agenda: [
      "11:00 - 11:15 - Welcome & Introduction",
      "11:15 - 11:45 - Productivity Strategies for Remote Teams",
      "11:45 - 12:15 - Communication & Collaboration Tools",
      "12:15 - 12:30 - Break",
      "12:30 - 13:00 - Q&A and Best Practices Sharing"
    ]
  }
};


export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [isAttending, setIsAttending] = useState(false);

  // FIX FOR MOCK TESTING: Force load event '1' if the dynamic ID is not found in mockEvents
  // const event = eventId ? mockEvents[eventId as keyof typeof mockEvents] : null; // Original line
  const eventToLoad = eventId && mockEvents[eventId as keyof typeof mockEvents] ? eventId : "1";
  const event = mockEvents[eventToLoad as keyof typeof mockEvents] || null;

  if (!event) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Event not found</h2>
            <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist.</p>
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

  const handleParticipate = () => {
    setIsAttending(!isAttending);
    // Here you would call your backend API to register/unregister the user
    console.log(isAttending ? "Unregistered from event" : "Registered for event");
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
              {event.image && (
                <Card className="overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-[400px] object-cover"
                  />
                </Card>
              )}

              {/* Event Header */}
              <Card className="p-6">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded">
                    {event.category}
                  </span>
                  {event.isOnline && (
                    <span className="text-xs font-medium px-2.5 py-1 bg-secondary text-foreground rounded flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Online
                    </span>
                  )}
                  <span className="text-xs font-medium px-2.5 py-1 bg-orange-100 text-orange-700 rounded">
                    Happening Now
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-foreground mb-2">{event.title}</h1>
                <p className="text-muted-foreground mb-4">Event by {event.organizer}</p>

                {/* Event Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium">
                        {formatDate(event.date)}, {event.time} - {event.endTime}
                      </p>
                      <p className="text-muted-foreground text-xs">(Your local time)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground">{event.fullLocation}</p>
                    </div>
                  </div>

                  {event.eventLink && (
                    <div className="flex items-start gap-3">
                      <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <a
                        href={event.eventLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {event.eventLink}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{event.attendees} attendees</span>
                </div>
              </Card>

              {/* About Event */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">About the event</h2>
                <p className="text-foreground whitespace-pre-line leading-relaxed">{event.description}</p>
              </Card>

              {/* Agenda */}
              {event.agenda && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Agenda</h2>
                  <div className="space-y-2">
                    {event.agenda.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 py-2">
                        <Clock className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                        <p className="text-sm text-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block w-[300px] flex-shrink-0 space-y-4 sticky top-20 self-start">
              {/* Action Card */}
              <Card className="p-4">
                <button
                  type="button"
                  onClick={handleParticipate}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-all mb-3 ${
                    isAttending
                      ? "bg-secondary text-foreground border-2 border-primary"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {isAttending ? "Attending ✓" : "Participate"}
                </button>
                
                <button 
                  type="button"
                  className="w-full px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2 mb-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>

                <button 
                  type="button"
                  className="w-full px-4 py-2 text-muted-foreground rounded-lg font-medium hover:bg-secondary transition-colors text-sm"
                >
                  • • •
                </button>
              </Card>

              {/* Organizer Card */}
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Organizer</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {event.organizerAvatar}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{event.organizer}</p>
                    <button type="button" className="text-sm text-primary hover:underline">View Profile</button>
                  </div>
                </div>
              </Card>

              {/* Attendees Preview */}
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Attendees ({event.attendees})</h3>
                <div className="flex -space-x-2 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold border-2 border-card"
                    >
                      U{i}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center text-xs font-semibold border-2 border-card">
                    +{event.attendees - 5}
                  </div>
                </div>
                <button type="button" className="text-sm text-primary hover:underline">View All</button>
              </Card>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}