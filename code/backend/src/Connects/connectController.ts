
import { Controller, Post, Body, ValidationPipe, HttpStatus, HttpException, Get, Param, Delete, Req } from '@nestjs/common';
import { SendConnectionRequestDto } from '../Connects/dto/send-connection-request.dto';
import { AcceptConnectionRequestDto } from '../Connects/dto/accept-connection-request.dto';
import { ConnectionRequestResponseDto } from '../Connects/dto/connection-request-response.dto';
import { GetConnectionsResponseDto, GetPendingRequestsResponseDto } from '../Connects/dto/get-connections-response.dto';
import { ConnectionService } from './connectService';

@Controller('connection')
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) { }


  @Post('request')
  async sendConnectionRequest(
    @Body(ValidationPipe) sendConnectionRequestDto: SendConnectionRequestDto,
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
        sendConnectionRequestDto.receiverId,
        sendConnectionRequestDto.receiverEmail
      );

      return {
        success: true,
        message: 'Connection request sent successfully',
        request,
      };
    } catch (error) {
      this.handleException(error, 'Error sending connection request');
    }
  }

  @Post('accept')
  async acceptConnectionRequest(
    @Body(ValidationPipe) acceptConnectionRequestDto: AcceptConnectionRequestDto,
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
        userId
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
  async rejectConnectionRequest(
    @Param('requestId') requestId: string,
    @Body(ValidationPipe) body: { userId: string },
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

      await this.connectionService.rejectConnectionRequest(requestId, userId);

      return {
        success: true,
        message: 'Connection request rejected successfully',
      };
    } catch (error) {
      this.handleException(error, 'Error rejecting connection request');
    }
  }

  @Get('connections')
  async getConnections(@Req() req: any): Promise<GetConnectionsResponseDto> {
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

      const connections = await this.connectionService.getConnections(userId);

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
  async getPendingRequests(@Req() req: any): Promise<GetPendingRequestsResponseDto> {
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

      const pendingRequests = await this.connectionService.getPendingRequests(userId);

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
  async removeConnection(
    @Param('connectionId') connectionId: string,
    @Body(ValidationPipe) body: { userId: string },
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

      await this.connectionService.removeConnection(userId, connectionId);

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