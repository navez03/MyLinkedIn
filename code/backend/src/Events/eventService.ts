import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';
import { ConnectionService } from '../Connects/connectService';
import { CreateEventDto, EventResponseDto } from './dto/create-event.dto';
import { InviteToEventDto, EventInvitationResponseDto } from './dto/invite-event.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

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

  async getEventById(eventId: string, token: string, userId?: string): Promise<EventResponseDto> {
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

      // Fetch participant users from the participants array
      let participants = [];
      if (data.participants && data.participants.length > 0) {
        const { data: participantUsers } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .in('id', data.participants);
        participants = participantUsers || [];
      }

      // Get likes count and check if current user liked
      const totalLikes = await this.countLikes(eventId);
      const likedByCurrentUser = userId ? await this.isEventLikedByUser(eventId, userId) : false;

      return this.mapEventToDto(data, user, participants, totalLikes, likedByCurrentUser);
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

  async updateInviteStatus(eventId: string, userId: string, status: 'going' | 'declined', token: string): Promise<EventInvitationResponseDto> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      // Verify invitation exists
      const { data: invitation, error: invitationError } = await supabase
        .from('event_invitations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (invitationError || !invitation) {
        throw new NotFoundException('Convite não encontrado');
      }

      // If accepting, add user to participants array
      if (status === 'going') {
        // Get current event
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('participants')
          .eq('id', eventId)
          .single();

        if (eventError) {
          this.logger.error('Error fetching event', eventError.message);
          throw new BadRequestException(`Error fetching event: ${eventError.message}`);
        }

        // Add user to participants array if not already there
        const currentParticipants = event.participants || [];
        if (!currentParticipants.includes(userId)) {
          // Use admin client to bypass RLS
          const adminClient = this.supabase.getAdminClient();
          const { error: updateError } = await adminClient
            .from('events')
            .update({ participants: [...currentParticipants, userId] })
            .eq('id', eventId);

          if (updateError) {
            this.logger.error('Error updating participants', updateError.message);
            throw new BadRequestException(`Error updating participants: ${updateError.message}`);
          }
        }
      }

      // Delete the invitation (whether accepted or declined)
      const { error: deleteError } = await supabase
        .from('event_invitations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (deleteError) {
        this.logger.error('Error deleting invitation', deleteError.message);
        throw new BadRequestException(`Error deleting invitation: ${deleteError.message}`);
      }

      // Return the invitation data before deletion
      return {
        id: invitation.id,
        eventId: invitation.event_id,
        userId: invitation.user_id,
        invitedBy: invitation.invited_by,
        status: status,
        createdAt: invitation.created_at,
      };
    } catch (error) {
      this.logger.error('Erro updateInviteStatus', error.message);
      throw error;
    }
  }

  async getPendingInvitations(userId: string, token: string): Promise<EventInvitationResponseDto[]> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      const { data, error } = await supabase
        .from('event_invitations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) {
        this.logger.error('Error fetching pending invitations', error.message);
        throw new BadRequestException(`Error fetching pending invitations: ${error.message}`);
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
      this.logger.error('Get pending invitations error', error.message);
      throw error;
    }
  }

  async removeParticipant(eventId: string, participantId: string, requesterId: string, token: string): Promise<{ message: string }> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      // Get event and verify permissions
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('organizer_id, participants')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        throw new NotFoundException('Event not found');
      }

      // Allow if user is organizer or removing themselves
      if (event.organizer_id !== requesterId && participantId !== requesterId) {
        throw new BadRequestException('You do not have permission to remove this participant');
      }

      // Remove participant from array
      const currentParticipants = event.participants || [];
      const updatedParticipants = currentParticipants.filter(id => id !== participantId);

      // Use admin client to bypass RLS
      const adminClient = this.supabase.getAdminClient();
      const { error: updateError } = await adminClient
        .from('events')
        .update({ participants: updatedParticipants })
        .eq('id', eventId);

      if (updateError) {
        this.logger.error('Error removing participant', updateError.message);
        throw new BadRequestException(`Error removing participant: ${updateError.message}`);
      }

      return { message: 'Participant removed successfully' };
    } catch (error) {
      this.logger.error('Remove participant error', error.message);
      throw error;
    }
  }

  async participateInEvent(eventId: string, userId: string, token: string): Promise<{ message: string }> {
    try {
      const supabase = this.supabase.getClientWithToken(token);

      // Get event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('organizer_id, participants, event_type')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        throw new NotFoundException('Event not found');
      }

      // Don't allow organizer to participate in their own event
      if (event.organizer_id === userId) {
        throw new BadRequestException('Organizer cannot participate in their own event');
      }

      // Check if already participating
      const currentParticipants = event.participants || [];
      if (currentParticipants.includes(userId)) {
        throw new BadRequestException('You are already participating in this event');
      }

      // Use admin client to bypass RLS
      const adminClient = this.supabase.getAdminClient();
      const { error: updateError } = await adminClient
        .from('events')
        .update({ participants: [...currentParticipants, userId] })
        .eq('id', eventId);

      if (updateError) {
        this.logger.error('Error adding participant', updateError.message);
        throw new BadRequestException(`Error adding participant: ${updateError.message}`);
      }

      return { message: 'Successfully joined the event' };
    } catch (error) {
      this.logger.error('Participate in event error', error.message);
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

  async likeEvent(eventId: string, userId: string) {
    const supabase = this.supabase.getClient();

    const { error: insertErr } = await supabase
      .from('event_likes')
      .insert({ event_id: eventId, user_id: userId });

    if (insertErr && insertErr.code !== '23505') { // 23505 = unique_violation
      throw new Error(`Error liking post: ${insertErr.message}`);
    }

    const { count } = await supabase
      .from('event_likes')
      .select('*', { count: 'exact', head: false })
      .eq('event_id', eventId);

    return { liked: true, totalLikes: count || 0 };
  }

  async unlikeEvent(eventId: string, userId: string) {
    const supabase = this.supabase.getClient();
    const { error: deleteErr } = await supabase
      .from('event_likes')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);
    if (deleteErr) {
      throw new Error(`Error unliking post: ${deleteErr.message}`);
    }
    const { count } = await supabase
      .from('event_likes')
      .select('*', { count: 'exact', head: false })
      .eq('event_id', eventId);
    return { liked: false, totalLikes: count || 0 };
  }

  async countLikes(eventId: string) {
    const supabase = this.supabase.getClient();
    const { count } = await supabase
      .from('event_likes')
      .select('*', { count: 'exact' })
      .eq('event_id', eventId);

    return count || 0;
  }

  async isEventLikedByUser(eventId: string, userId: string) {
    const supabase = this.supabase.getClient();
    const { data } = await supabase
      .from('event_likes')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .limit(1);

    return (data && data.length > 0);
  }

  async addComment(createCommentDto: CreateCommentDto) {
    const supabase = this.supabase.getClient();

    const { data, error } = await supabase
      .from('event_comments')
      .insert([createCommentDto])
      .select('*')
      .single();

    if (error) throw error;

    // Buscar o nome do utilizador
    const { data: user } = await supabase
      .from('users')
      .select('name, email, avatar_url')
      .eq('id', createCommentDto.user_id)
      .single();

    return {
      ...data,
      authorName: user?.name,
      authorEmail: user?.email,
      authorAvatarUrl: user?.avatar_url,
    };
  }

  async getComments(eventId: string, limit = 10, offset = 0) {
    const supabase = this.supabase.getClient();

    const { data: comments, error, count } = await supabase
      .from('event_comments')
      .select('*', { count: 'exact' })
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Error fetching comments: ${error.message}`);

    // Fetch user data separately for each comment
    const mapped = await Promise.all((comments || []).map(async (c) => {
      const { data: user } = await supabase
        .from('users')
        .select('name, email, avatar_url')
        .eq('id', c.user_id)
        .single();

      return {
        id: c.id,
        eventId: c.event_id,
        userId: c.user_id,
        content: c.content,
        createdAt: c.created_at,
        user_name: user?.name || 'Unknown User',
        authorEmail: user?.email,
        authorAvatarUrl: user?.avatar_url,
      };
    }));

    return { comments: mapped, total: count || 0 };
  }

  async getCommentsCount(eventId: string) {
    const supabase = this.supabase.getClient();
    const { count } = await supabase
      .from('event_comments')
      .select('*', { count: 'exact' })
      .eq('event_id', eventId);
    return count || 0;
  }

  private mapEventToDto(event: any, user?: any, participants?: any[], likes?: number, likedByCurrentUser?: boolean): EventResponseDto {
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
      likes: likes || 0,
      likedByCurrentUser: likedByCurrentUser || false,
      createdAt: event.created_at,
      updatedAt: event.created_at,
    };
  }
}