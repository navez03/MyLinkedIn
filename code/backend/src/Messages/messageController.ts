// Messages/message.controller.ts
import { Controller, Post, Get, Body, Param, Req, ValidationPipe, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { SendMessageDto } from '../Messages/dto/send-message.dto';
import { MessageService } from './messageService';
import { SendMessageResponseDto } from '../Messages/dto/send-message-response.dto';
import { GetMessagesResponseDto } from '../Messages/dto/get-messages-response.dto';
import { AuthGuard } from '../User/userGuard';
import { GetToken } from '../config/decorators';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) { }

  @Post()
  @UseGuards(AuthGuard)
  async sendMessage(
    @Body(ValidationPipe) dto: SendMessageDto,
    @GetToken() token: string
  ): Promise<SendMessageResponseDto> {
    try {
      const senderId = dto.senderId;
      if (!senderId) {
        throw new HttpException(
          {
            success: false,
            message: 'Sender ID is required',
            error: 'Authentication required',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.messageService.sendMessage({
        senderId,
        receiverId: dto.receiverId,
        content: dto.content,
        postId: (dto as any).postId,
      }, token);

      return {
        success: true,
        message: 'Message sent successfully',
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: 'Error sending message',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('conversations/:userId')
  @UseGuards(AuthGuard)
  async getUserConversations(
    @Param('userId') userId: string,
    @GetToken() token: string
  ) {
    console.log('[Controller] getUserConversations called with userId:', userId);
    try {
      const users = await this.messageService.getUserConversations(userId, token);
      console.log('[Controller] getUserConversations success, users count:', users?.length || 0);
      return {
        success: true,
        message: 'Conversations retrieved successfully',
        users,
      };
    } catch (error: any) {
      console.error('[Controller] getUserConversations error:', error.message);
      console.error('[Controller] Full error:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Error retrieving conversations',
          error: error.message,
          users: [],
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':user1Id/:user2Id')
  @UseGuards(AuthGuard)
  async getMessagesBetweenUsers(
    @Param('user1Id') user1Id: string,
    @Param('user2Id') user2Id: string,
    @GetToken() token: string
  ): Promise<GetMessagesResponseDto> {
    try {
      const messages = await this.messageService.getMessagesBetweenUsers(user1Id, user2Id, token);

      return {
        success: true,
        message: messages.length > 0 ? 'Messages retrieved successfully' : 'No messages found',
        messages: messages || [],
      };
    } catch (error: any) {
      console.error('[Controller] Error in getMessagesBetweenUsers:', error);
      // Retornar 200 com array vazio em vez de 400
      return {
        success: true,
        message: 'No messages found',
        messages: [],
      };
    }
  }
}