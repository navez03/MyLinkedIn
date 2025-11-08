
import { Controller, Post, Body, ValidationPipe, HttpStatus, HttpException, Get, Param, Delete, Req, UseGuards, Logger } from '@nestjs/common';
import { SendConnectionRequestDto } from '../Connects/dto/send-connection-request.dto';
import { AcceptConnectionRequestDto } from '../Connects/dto/accept-connection-request.dto';
import { ConnectionRequestResponseDto } from '../Connects/dto/connection-request-response.dto';
import { GetConnectionsResponseDto, GetPendingRequestsResponseDto } from '../Connects/dto/get-connections-response.dto';
import { ConnectionService } from './connectService';
import { AuthGuard } from '../User/userGuard';
import { GetToken } from '../config/decorators';

@Controller('connection')
export class ConnectionController {
  private readonly logger = new Logger(ConnectionController.name);

  constructor(private readonly connectionService: ConnectionService) { }


  @Post('request')
  @UseGuards(AuthGuard)
  async sendConnectionRequest(
    @Body(ValidationPipe) sendConnectionRequestDto: SendConnectionRequestDto,
    @GetToken() token: string
  ): Promise<ConnectionRequestResponseDto> {
    try {
      const senderId = sendConnectionRequestDto.senderId;

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

      const request = await this.connectionService.sendConnectionRequest(
        senderId,
        token,
        sendConnectionRequestDto.receiverId,
        sendConnectionRequestDto.receiverEmail
      );

      return {
        success: true,
        message: 'Connection request sent successfully',
        request,
      };
    } catch (error) {
      this.logger.error('Send connection request error', error.message);
      this.handleException(error, 'Error sending connection request');
    }
  }

  @Post('accept')
  @UseGuards(AuthGuard)
  async acceptConnectionRequest(
    @Body(ValidationPipe) acceptConnectionRequestDto: AcceptConnectionRequestDto,
    @GetToken() token: string
  ): Promise<ConnectionRequestResponseDto> {
    try {
      const userId = acceptConnectionRequestDto.userId;

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

      await this.connectionService.acceptConnectionRequest(
        acceptConnectionRequestDto.requestId,
        userId,
        token
      );

      return {
        success: true,
        message: 'Connection request accepted successfully',
      };
    } catch (error) {
      this.handleException(error, 'Error accepting connection request');
    }
  }

  @Post('reject/:requestId')
  @UseGuards(AuthGuard)
  async rejectConnectionRequest(
    @Param('requestId') requestId: string,
    @Body(ValidationPipe) body: { userId: string },
    @GetToken() token: string
  ): Promise<ConnectionRequestResponseDto> {
    try {
      const userId = body.userId;

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

      await this.connectionService.rejectConnectionRequest(requestId, userId, token);

      return {
        success: true,
        message: 'Connection request rejected successfully',
      };
    } catch (error) {
      this.handleException(error, 'Error rejecting connection request');
    }
  }

  @Get('connections')
  @UseGuards(AuthGuard)
  async getConnections(@Req() req: any, @GetToken() token: string): Promise<GetConnectionsResponseDto> {
    try {
      const userId = req.query.userId;

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

      const connections = await this.connectionService.getConnections(userId, token);

      return {
        success: true,
        message: 'Connections retrieved successfully',
        connections,
      };
    } catch (error) {
      this.handleException(error, 'Error retrieving connections');
    }
  }

  @Get('pending-requests')
  @UseGuards(AuthGuard)
  async getPendingRequests(@Req() req: any, @GetToken() token: string): Promise<GetPendingRequestsResponseDto> {
    try {
      const userId = req.query.userId;

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

      const pendingRequests = await this.connectionService.getPendingRequests(userId, token);

      return {
        success: true,
        message: 'Pending requests retrieved successfully',
        pendingRequests,
      };
    } catch (error) {
      this.handleException(error, 'Error retrieving pending requests');
    }
  }

  @Delete('connections/:connectionId')
  @UseGuards(AuthGuard)
  async removeConnection(
    @Param('connectionId') connectionId: string,
    @Body(ValidationPipe) body: { userId: string },
    @GetToken() token: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userId = body.userId;

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

      await this.connectionService.removeConnection(userId, connectionId, token);

      return {
        success: true,
        message: 'Connection removed successfully',
      };
    } catch (error) {
      this.handleException(error, 'Error removing connection');
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