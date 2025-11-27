import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';

export enum EventType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum LocationType {
  ONLINE = 'online',
  IN_PERSON = 'in-person',
}

export class ParticipantDto {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsEnum(LocationType)
  @IsNotEmpty()
  locationType: LocationType;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsEnum(EventType)
  @IsNotEmpty()
  eventType: EventType;
}

export class EventResponseDto {
  id: string;
  name: string;
  date: string;
  time: string;
  locationType: LocationType;
  location: string;
  description: string;
  bannerUrl?: string;
  eventType: EventType;
  organizerId: string;
  organizerName?: string;
  organizerAvatar?: string;
  participants?: ParticipantDto[];
  likes?: number;
  likedByCurrentUser?: boolean;
  createdAt: string;
  updatedAt: string;
}

export class GetEventsResponseDto {
  events: EventResponseDto[];
  total: number;
}
