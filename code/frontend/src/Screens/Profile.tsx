import React from 'react';
import Navigation from '../components/header';
import { MapPin, Briefcase, GraduationCap, Edit2, Mail, Link as LinkIcon } from 'lucide-react';

const Profile: React.FC = () => {
  const user = {
    name: null,
    headline: null,
    location: null,
    avatar: 'Eu',
    connections: 0,
    coverImage: null,
  };

  const skills = [''];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-[1128px] mx-auto px-4 py-6">
        <div className="max-w-[880px] mx-auto space-y-2">

          {/* Profile Card */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Cover Image */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-primary relative">
              {user.coverImage && (
                <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
              )}
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="relative -mt-16 mb-4">
                <div className="w-32 h-32 rounded-full bg-primary border-4 border-card flex items-center justify-center">
                  <span className="text-3xl text-primary-foreground font-bold">
                    {user.avatar}
                  </span>
                </div>
              </div>

              {/* Name and Headline */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                  <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-base text-foreground mb-3">{user.headline}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
                <p className="text-sm text-primary font-medium">
                  {user.connections}+ connections
                </p>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">About</h2>
              <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Experience Section */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Experience</h2>
              <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-6">
            </div>
          </div>

          {/* Education Section */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Education</h2>
              <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-6">
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Skills</h2>
              <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </button>
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
  );
};

export default Profile;