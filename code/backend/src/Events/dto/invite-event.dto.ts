import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class InviteToEventDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];
}

export class EventInvitationResponseDto {
  id: string;
  eventId: string;
  userId: string;
  invitedBy: string;
  status: 'pending' | 'going' | 'declined';
  createdAt: string;
}

export class InviteResponseDto {
  success: boolean;
  invitations: EventInvitationResponseDto[];
  message: string;
}
