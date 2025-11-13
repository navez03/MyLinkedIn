import { userAPI } from "../services/registerService";
import React from 'react';
import { Card } from './card';
import { useNavigate } from 'react-router-dom';
import { Grid3x3, Calendar } from 'lucide-react';
import { connectionAPI } from "../services/connectionService";
import { useEffect, useState } from "react";
import { useUser } from "./UserContext";

const ProfileCard: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const [connectionsCount, setConnectionsCount] = useState<number | null>(null);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const currentUserName = userData?.name || 'Meu Perfil';
  const userAvatarUrl = userData?.avatar_url || null;

  // Função para obter as iniciais
  const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return 'MP';
    if (name === 'Meu Perfil') return 'MP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || 'MP';
  };

  const initials = getInitials(currentUserName);

  useEffect(() => {
    // Buscar conexões
    const fetchConnections = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      try {
        const res = await connectionAPI.getConnections(userId);
        if (res.success && res.data && res.data.connections) {
          setConnectionsCount(res.data.connections.length);
        }
      } catch (e) {
        setConnectionsCount(null);
      }
    };

    fetchConnections();
  }, []);

  return (
    <div className="space-y-2">
      {/* Main Profile Card */}
      <Card className="overflow-hidden cursor-pointer" onClick={handleProfileClick}>
        <div className="h-[54px] bg-gradient-to-r from-primary/20 to-primary/40" />
        <div className="px-4 pb-4">
          <div className="-mt-8 mb-3 flex justify-start pl-0">
            <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xl overflow-hidden">
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={currentUserName}
                  className="w-full h-full rounded-full object-cover"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <span className={userAvatarUrl ? 'hidden' : ''}>{initials}</span>
            </div>
          </div>
          <h3 className="font-semibold text-sm mb-3">{currentUserName}</h3>
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Conexões</span>
              <span className="text-primary font-semibold">{connectionsCount !== null ? connectionsCount : '...'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Links Card */}
      <Card className="p-4">
        <div className="space-y-2">
          <button
            type="button"
            className="w-full flex items-center gap-3 py-2 text-sm text-foreground hover:bg-secondary/50 rounded px-2 -mx-2 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Groups clicked');
            }}
          >
            <Grid3x3 className="w-4 h-4 text-muted-foreground" />
            <span>Groups</span>
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-3 py-2 text-sm text-foreground hover:bg-secondary/50 rounded px-2 -mx-2 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/events');
            }}
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