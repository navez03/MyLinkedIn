import React from 'react';
import { Card } from './card';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Bookmark, Grid3x3, Mail, Calendar } from 'lucide-react';

const ProfileCard: React.FC = () => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className="space-y-2">
      {/* Main Profile Card */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        <div 
          className="h-14 bg-gradient-to-r from-blue-500 to-primary cursor-pointer"
          onClick={handleProfileClick}
        />
        
        {/* Profile Info */}
        <div className="px-4 pb-4 -mt-8 relative">

          {/* Name and Location */}
          <div 
            onClick={handleProfileClick}
            className="cursor-pointer hover:underline"
          >
            <h3 className="font-semibold text-base text-foreground mb-1">Eu</h3>
            <p className="text-xs text-muted-foreground"></p>
          </div>
        </div>
      </Card>


      {/* Quick Links Card */}
      <Card className="p-4">
        <div className="space-y-2">
          <button 
            className="w-full flex items-center gap-3 py-2 text-sm text-foreground hover:bg-secondary/50 rounded px-2 -mx-2 transition-colors"
            onClick={() => console.log('Groups')}
          >
            <Grid3x3 className="w-4 h-4 text-muted-foreground" />
            <span>Groups</span>
          </button>         
          <button 
            className="w-full flex items-center gap-3 py-2 text-sm text-foreground hover:bg-secondary/50 rounded px-2 -mx-2 transition-colors"
            onClick={() => console.log('Events')}
          >
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Events</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ProfileCard;