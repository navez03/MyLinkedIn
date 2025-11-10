import { Controller, Post, Get, Delete, Body, Param, Query, ValidationPipe, HttpCode, HttpStatus, HttpException, UseGuards, Logger, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventService } from './eventService';
import { CreateEventDto, EventResponseDto, GetEventsResponseDto } from './dto/create-event.dto';
import { InviteToEventDto, InviteResponseDto } from './dto/invite-event.dto';
import { AuthGuard } from '../User/userGuard';
import { GetToken, GetUserId } from '../config/decorators';
import { SupabaseService } from '../config/supabaseClient';
import 'multer';

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
    @GetToken() token: string
  ): Promise<{ success: boolean; event: EventResponseDto }> {
    try {
      const event = await this.eventService.getEventById(id, token);
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