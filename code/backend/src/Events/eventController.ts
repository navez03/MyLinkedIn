import { Controller, Post, Get, Delete, Body, Param, Query, ValidationPipe, HttpCode, HttpStatus, HttpException, UseGuards, Logger, UseInterceptors, UploadedFile, BadRequestException, Put, Req } from '@nestjs/common';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventService } from './eventService';
import { CreateEventDto, EventResponseDto } from './dto/create-event.dto';
import { InviteToEventDto, InviteResponseDto } from './dto/invite-event.dto';
import { AuthGuard } from '../User/userGuard';
import { GetToken, GetUserId } from '../config/decorators';
import { SupabaseService } from '../config/supabaseClient';
import 'multer';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('events')
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(
    private readonly eventService: EventService,
    private readonly supabase: SupabaseService,
  ) { }

  @Post('upload-banner')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadBanner(
    @UploadedFile() file: Express.Multer.File,
    @GetUserId() userId: string,
    @GetToken() token: string
  ): Promise<{ success: boolean; bannerUrl: string }> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const bannerUrl = await this.eventService.uploadEventBanner(file, token, userId);

      return {
        success: true,
        bannerUrl,
      };
    } catch (error) {
      this.logger.error('Upload banner error', error.message);
      this.handleException(error, 'Error uploading banner');
    }
  }

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @Body(ValidationPipe) createEventDto: CreateEventDto,
    @GetToken() token: string,
    @GetUserId() userId: string
  ): Promise<{ success: boolean; event: EventResponseDto }> {
    try {
      const event = await this.eventService.createEvent(createEventDto, token, userId);
      return {
        success: true,
        event,
      };
    } catch (error) {
      this.logger.error('Create event error', error.message);
      this.handleException(error, 'Error creating event');
    }
  }

  @Post('invite')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async inviteUsers(
    @Body(ValidationPipe) inviteDto: InviteToEventDto,
    @GetToken() token: string,
    @GetUserId() userId: string
  ): Promise<InviteResponseDto> {
    try {
      const invitations = await this.eventService.inviteUsersToEvent(inviteDto, token, userId);
      return {
        success: true,
        invitations,
        message: `Successfully invited ${invitations.length} user(s) to the event`,
      };
    } catch (error) {
      this.logger.error('Invite users error', error.message);
      this.handleException(error, 'Error inviting users');
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getEventById(
    @Param('id') id: string,
    @GetToken() token: string,
    @GetUserId() userId: string
  ): Promise<{ success: boolean; event: EventResponseDto }> {
    try {
      const event = await this.eventService.getEventById(id, token, userId);
      return {
        success: true,
        event,
      };
    } catch (error) {
      this.logger.error('Get event error', error.message);
      this.handleException(error, 'Error fetching event', HttpStatus.NOT_FOUND);
    }
  }

  @Get('organizer/:organizerId')
  @UseGuards(AuthGuard)
  async getEventsByOrganizer(
    @Param('organizerId') organizerId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @GetToken() token?: string
  ): Promise<{ success: boolean; events: EventResponseDto[]; total: number }> {
    try {
      const result = await this.eventService.getEventsByOrganizer(
        organizerId,
        token,
        limit ? Number(limit) : 10,
        offset ? Number(offset) : 0,
      );
      return {
        success: true,
        events: result.events,
        total: result.total,
      };
    } catch (error) {
      this.logger.error('Get organizer events error', error.message);
      this.handleException(error, 'Error fetching organizer events');
    }
  }

  @Get()
  @UseGuards(AuthGuard)
  async getAllEvents(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @GetToken() token?: string,
    @GetUserId() userId?: string
  ): Promise<{ success: boolean; events: EventResponseDto[]; total: number }> {
    try {
      const result = await this.eventService.getAllEvents(
        token,
        userId,
        limit ? Number(limit) : 20,
        offset ? Number(offset) : 0,
      );
      return {
        success: true,
        events: result.events,
        total: result.total,
      };
    } catch (error) {
      this.logger.error('Get all events error', error.message);
      this.handleException(error, 'Error fetching events');
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteEvent(
    @Param('id') id: string,
    @GetToken() token: string,
    @GetUserId() userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.eventService.deleteEvent(id, token, userId);
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      this.logger.error('Delete event error', error.message);
      this.handleException(error, 'Error deleting event');
    }
  }

  @Put(':id/invite-status')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateInviteStatus(
    @Param('id') eventId: string,
    @Body('status') status: 'going' | 'declined',
    @GetToken() token: string,
    @GetUserId() userId: string
  ): Promise<{ success: boolean; invitation: any }> {
    try {
      const invitation = await this.eventService.updateInviteStatus(eventId, userId, status, token);
      return {
        success: true,
        invitation,
      };
    }
    catch (error) {
      this.logger.error('Update invite status error', error.message);
      this.handleException(error, 'Error updating invite status');
    }
  }

  @Get('invitations/pending')
  @UseGuards(AuthGuard)
  async getPendingInvitations(
    @GetToken() token: string,
    @GetUserId() userId: string
  ): Promise<{ success: boolean; invitations: any[] }> {
    try {
      const invitations = await this.eventService.getPendingInvitations(userId, token);
      return {
        success: true,
        invitations,
      };
    }
    catch (error) {
      this.logger.error('Get pending invitations error', error.message);
      this.handleException(error, 'Error fetching pending invitations');
    }
  }

  @Delete(':eventId/participants/:participantId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeParticipant(
    @Param('eventId') eventId: string,
    @Param('participantId') participantId: string,
    @GetToken() token: string,
    @GetUserId() userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.eventService.removeParticipant(eventId, participantId, userId, token);
      return {
        success: true,
        message: result.message,
      };
    }
    catch (error) {
      this.logger.error('Remove participant error', error.message);
      this.handleException(error, 'Error removing participant');
    }
  }

  @Post(':eventId/participate')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async participateInEvent(
    @Param('eventId') eventId: string,
    @GetToken() token: string,
    @GetUserId() userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.eventService.participateInEvent(eventId, userId, token);
      return {
        success: true,
        message: result.message,
      };
    }
    catch (error) {
      this.logger.error('Participate in event error', error.message);
      this.handleException(error, 'Error participating in event');
    }
  }

  @Post(':eventId/comments')
  async addComment(
    @Param('eventId') eventId: string,
    @Body(new ValidationPipe({ whitelist: true })) createCommentDto: CreateCommentDto
  ) {
    try {
      createCommentDto.event_id = eventId;
      const comment = await this.eventService.addComment(createCommentDto);
      return { success: true, comment };
    } catch (error) {
      throw error;
    }
  }

  @Get(':eventId/comments')
  async getComments(
    @Param('eventId') eventId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const result = await this.eventService.getComments(eventId, limit ? Number(limit) : 10, offset ? Number(offset) : 0);
    return { success: true, comments: result.comments, total: result.total };
  }

  @Post(':eventId/likes')
  async likePost(@Param('eventId') eventId: string, @Req() req) {
    const userId = req.user?.id || req.body.userId;
    const res = await this.eventService.likeEvent(eventId, userId);
    return { success: true, liked: true, totalLikes: res.totalLikes };
  }

  @Delete(':eventId/likes')
  async unlikeEvent(@Param('eventId') eventId: string, @Req() req) {
    const userId = req.user?.id || req.body.userId;
    const res = await this.eventService.unlikeEvent(eventId, userId);
    return { success: true, liked: false, totalLikes: res.totalLikes };
  }



  private handleException(error: any, defaultMessage: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Unexpected error:', error);
    throw new HttpException(
      {
        success: false,
        message: defaultMessage,
        error: error.message || 'Internal server error',
      },
      status,
    );
  }
}