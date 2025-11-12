import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';
import { ConnectionService } from '../Connects/connectService';
import { CreateEventDto, EventResponseDto } from './dto/create-event.dto';
import { InviteToEventDto, EventInvitationResponseDto } from './dto/invite-event.dto';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly connectionService: ConnectionService,
  ) { }

  async createEvent(createEventDto: CreateEventDto, token: string, userId: string): Promise<EventResponseDto> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      const { data, error } = await supabase
        .from('events')
        .insert({
          name: createEventDto.name,
          date: createEventDto.date,
          time: createEventDto.time,
          location_type: createEventDto.locationType,
          location: createEventDto.location,
          description: createEventDto.description,
          banner_url: createEventDto.bannerUrl || null,
          event_type: createEventDto.eventType,
          organizer_id: userId,
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error creating event', error.message);
        throw new BadRequestException(`Error creating event: ${error.message}`);
      }

      return this.mapEventToDto(data);
    } catch (error) {
      this.logger.error('Create event error', error.message);
      throw error;
    }
  }

  async uploadEventBanner(file: Express.Multer.File, token: string, userId: string): Promise<string> {
    try {
      const supabase = this.supabase.getClientWithToken(token);
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('event-banners')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error('Error uploading banner', error.message);
        throw new BadRequestException(`Error uploading banner: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('event-banners')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      this.logger.error('Upload banner error', error.message);
      throw error;
    }
  }

  async getEventById(eventId: string, token: string): Promise<EventResponseDto> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !data) {
        this.logger.error('Error fetching event', error?.message);
        throw new NotFoundException('Event not found');
      }

      // Fetch organizer user separately
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('id', data.organizer_id)
        .single();

      // Fetch participants (invitations with status 'going')
      const { data: invitations } = await supabase
        .from('event_invitations')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'going');

      // Fetch participant users
      let participants = [];
      if (invitations && invitations.length > 0) {
        const userIds = invitations.map(inv => inv.user_id);
        const { data: participantUsers } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .in('id', userIds);
        participants = participantUsers || [];
      }

      return this.mapEventToDto(data, user, participants);
    } catch (error) {
      this.logger.error('Get event error', error.message);
      throw error;
    }
  }

  async getEventsByOrganizer(organizerId: string, token: string, limit: number = 10, offset: number = 0): Promise<{ events: EventResponseDto[]; total: number }> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      const { data, error, count } = await supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('organizer_id', organizerId)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        this.logger.error('Error fetching events', error.message);
        throw new BadRequestException(`Error fetching events: ${error.message}`);
      }

      // Fetch organizer user
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('id', organizerId)
        .single();

      return {
        events: data.map(event => this.mapEventToDto(event, user)),
        total: count || 0,
      };
    } catch (error) {
      this.logger.error('Get events error', error.message);
      throw error;
    }
  }

  async getAllEvents(token: string, userId: string, limit: number = 20, offset: number = 0): Promise<{ events: EventResponseDto[]; total: number }> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      // Get all public events OR events created by the user
      const { data, error, count } = await supabase
        .from('events')
        .select('*', { count: 'exact' })
        .or(`event_type.eq.public,organizer_id.eq.${userId}`)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        this.logger.error('Error fetching events', error.message);
        throw new BadRequestException(`Error fetching events: ${error.message}`);
      }

      // Fetch organizer users for all events
      const organizerIds = [...new Set(data.map(event => event.organizer_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', organizerIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      return {
        events: data.map(event => this.mapEventToDto(event, userMap.get(event.organizer_id))),
        total: count || 0,
      };
    } catch (error) {
      this.logger.error('Get all events error', error.message);
      throw error;
    }
  }

  async inviteUsersToEvent(inviteDto: InviteToEventDto, token: string, invitedBy: string): Promise<EventInvitationResponseDto[]> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      // Verify event exists and user is organizer
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, organizer_id, event_type')
        .eq('id', inviteDto.eventId)
        .single();

      if (eventError || !event) {
        throw new NotFoundException('Event not found');
      }

      if (event.organizer_id !== invitedBy) {
        throw new BadRequestException('Only the event organizer can invite users');
      }

      // Get user's connections to validate invitations
      const connections = await this.connectionService.getConnections(invitedBy, token);
      const connectionIds = connections.map(conn => conn.user.id);

      // Filter userIds to only include connections
      const validUserIds = inviteDto.userIds.filter(userId => connectionIds.includes(userId));

      if (validUserIds.length === 0) {
        throw new BadRequestException('You can only invite your connections');
      }

      // Create invitations
      const invitations = validUserIds.map(userId => ({
        event_id: inviteDto.eventId,
        user_id: userId,
        invited_by: invitedBy,
        status: 'pending',
      }));

      const { data, error } = await supabase
        .from('event_invitations')
        .upsert(invitations, {
          onConflict: 'event_id,user_id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        this.logger.error('Error creating invitations', error.message);
        throw new BadRequestException(`Error creating invitations: ${error.message}`);
      }

      return data.map(invitation => ({
        id: invitation.id,
        eventId: invitation.event_id,
        userId: invitation.user_id,
        invitedBy: invitation.invited_by,
        status: invitation.status,
        createdAt: invitation.created_at,
      }));
    } catch (error) {
      this.logger.error('Invite users error', error.message);
      throw error;
    }
  }

  async deleteEvent(eventId: string, token: string, userId: string): Promise<{ message: string }> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      // Verify event exists and user is organizer
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, organizer_id')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        throw new NotFoundException('Event not found');
      }

      if (event.organizer_id !== userId) {
        throw new BadRequestException('Only the event organizer can delete this event');
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        this.logger.error('Error deleting event', error.message);
        throw new BadRequestException(`Error deleting event: ${error.message}`);
      }

      return { message: 'Event deleted successfully' };
    } catch (error) {
      this.logger.error('Delete event error', error.message);
      throw error;
    }
  }

  private mapEventToDto(event: any, user?: any, participants?: any[]): EventResponseDto {
    return {
      id: event.id,
      name: event.name,
      date: event.date,
      time: event.time,
      locationType: event.location_type,
      location: event.location,
      description: event.description,
      bannerUrl: event.banner_url,
      eventType: event.event_type,
      organizerId: event.organizer_id,
      organizerName: user?.name || null,
      organizerAvatar: user?.avatar_url || null,
      participants: participants?.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        avatarUrl: p.avatar_url,
      })) || [],
      createdAt: event.created_at,
      updatedAt: event.created_at,
    };
  }
}