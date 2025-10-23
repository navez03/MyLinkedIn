// Messages/message.controller.ts
import { Controller, Post, Get, Body, Param, Req, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { SendMessageDto } from '../Messages/dto/send-message.dto';
import { MessageService } from './messageService';
import { SendMessageResponseDto } from '../Messages/dto/send-message-response.dto';
import { GetMessagesResponseDto } from '../Messages/dto/get-messages-response.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) { }

  @Post()
  async sendMessage(
    @Body(ValidationPipe) dto: SendMessageDto,
    @Req() req: any
  ): Promise<SendMessageResponseDto> {
    try {
      const senderId = req.headers['user-id'];
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
      });

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

  @Get(':user1Id/:user2Id')
  async getMessagesBetweenUsers(
    @Param('user1Id') user1Id: string,
    @Param('user2Id') user2Id: string
  ): Promise<GetMessagesResponseDto> {
    try {
      const messages = await this.messageService.getMessagesBetweenUsers(user1Id, user2Id);

      return {
        success: true,
        message: 'Messages retrieved successfully',
        messages,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: 'Error retrieving messages',
          error: error.message,
          messages: [],
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}