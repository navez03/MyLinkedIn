
import { Controller, Post, Body, ValidationPipe, HttpStatus, HttpException, Get, Param, Delete, Req } from '@nestjs/common';
import { SendConnectionRequestDto } from '../Connects/dto/send-connection-request.dto';
import { AcceptConnectionRequestDto } from '../Connects/dto/accept-connection-request.dto';
import { ConnectionRequestResponseDto } from '../Connects/dto/connection-request-response.dto';
import { GetConnectionsResponseDto } from '../Connects/dto/get-connections-response.dto';
import { ConnectionService } from './connectService';

@Controller('connection')
export class ConnectionController {
  constructor(private readonly userService: ConnectionService) { }


  @Post('request')
  async sendConnectionRequest(
    @Body(ValidationPipe) sendConnectionRequestDto: SendConnectionRequestDto,
    @Req() req: any
  ): Promise<ConnectionRequestResponseDto> {
    try {
      const senderId = req.headers['user-id'] || req.body.senderId;

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

      const request = await this.userService.sendConnectionRequest(
        senderId,
        sendConnectionRequestDto.receiverId,
        sendConnectionRequestDto.receiverEmail
      );

      return {
        success: true,
        message: 'Connection request sent successfully',
        request,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error sending connection request',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('accept')
  async acceptConnectionRequest(
    @Body(ValidationPipe) acceptConnectionRequestDto: AcceptConnectionRequestDto,
    @Req() req: any
  ): Promise<ConnectionRequestResponseDto> {
    try {
      const userId = req.headers['user-id'] || req.body.userId;

      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: 'User ID is required',
            error: 'Authentication required',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.userService.acceptConnectionRequest(
        acceptConnectionRequestDto.requestId,
        userId
      );

      return {
        success: true,
        message: 'Connection request accepted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error accepting connection request',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reject/:requestId')
  async rejectConnectionRequest(
    @Param('requestId') requestId: string,
    @Req() req: any
  ): Promise<ConnectionRequestResponseDto> {
    try {
      const userId = req.headers['user-id'] || req.body.userId;

      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: 'User ID is required',
            error: 'Authentication required',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.userService.rejectConnectionRequest(requestId, userId);

      return {
        success: true,
        message: 'Connection request rejected successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error rejecting connection request',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('connections')
  async getConnections(@Req() req: any): Promise<GetConnectionsResponseDto> {
    try {
      const userId = req.headers['user-id'] || req.query.userId;

      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: 'User ID is required',
            error: 'Authentication required',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.userService.getConnections(userId);

      return {
        success: true,
        message: 'Connections retrieved successfully',
        connections: result.connections,
        pendingRequests: result.pendingRequests,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error retrieving connections',
          error: error.message,
          connections: [],
          pendingRequests: { sent: [], received: [] },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('connections/:connectionId')
  async removeConnection(
    @Param('connectionId') connectionId: string,
    @Req() req: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userId = req.headers['user-id'] || req.body.userId;

      if (!userId) {
        throw new HttpException(
          {
            success: false,
            message: 'User ID is required',
            error: 'Authentication required',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.userService.removeConnection(userId, connectionId);

      return {
        success: true,
        message: 'Connection removed successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error removing connection',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}