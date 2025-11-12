import { apiHelpers, ApiResponse } from './api';

export enum EventType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum LocationType {
  ONLINE = 'online',
  IN_PERSON = 'in-person',
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface CreateEventDto {
  name: string;
  date: string;
  time: string;
  locationType: LocationType;
  location: string;
  description: string;
  bannerUrl?: string;
  eventType: EventType;
}

export interface EventResponse {
  id: string;
  name: string;
  date: string;
  time: string;
  locationType: LocationType;
  location: string;
  description: string;
  bannerUrl?: string;
  eventType: EventType;
  organizerId: string;
  organizerName?: string;
  organizerAvatar?: string;
  participants?: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface InviteToEventDto {
  eventId: string;
  userIds: string[];
}

export interface EventInvitationResponse {
  id: string;
  eventId: string;
  userId: string;
  invitedBy: string;
  status: 'pending' | 'interested' | 'going' | 'declined';
  createdAt: string;
}

export interface InviteResponse {
  success: boolean;
  invitations: EventInvitationResponse[];
  message: string;
}

export const eventsService = {

  uploadBanner: async (file: File): Promise<ApiResponse<{ bannerUrl: string }>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${apiHelpers.getBackendUrl()}/events/upload-banner`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Error uploading banner');
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error uploading banner',
      };
    }
  },


  createEvent: async (eventData: CreateEventDto): Promise<ApiResponse<{ event: EventResponse }>> => {
    return apiHelpers.post<{ event: EventResponse }>('/events', eventData, true);
  },


  inviteUsers: async (inviteData: InviteToEventDto): Promise<ApiResponse<InviteResponse>> => {
    return apiHelpers.post<InviteResponse>('/events/invite', inviteData, true);
  },

  getEventById: async (eventId: string): Promise<ApiResponse<{ event: EventResponse }>> => {
    return apiHelpers.get<{ event: EventResponse }>(`/events/${eventId}`, true);
  },

  getEventsByOrganizer: async (
    organizerId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<ApiResponse<{ events: EventResponse[]; total: number }>> => {
    return apiHelpers.get<{ events: EventResponse[]; total: number }>(
      `/events/organizer/${organizerId}?limit=${limit}&offset=${offset}`,
      true
    );
  },

  getAllEvents: async (
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<{ events: EventResponse[]; total: number }>> => {
    return apiHelpers.get<{ events: EventResponse[]; total: number }>(
      `/events?limit=${limit}&offset=${offset}`,
      true
    );
  },

  deleteEvent: async (eventId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiHelpers.delete<{ message: string }>(`/events/${eventId}`, true);
  },
};
