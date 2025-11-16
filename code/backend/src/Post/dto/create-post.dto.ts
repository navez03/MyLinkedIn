import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsUUID()
  @IsOptional()
  eventId?: string;
}

export class PostResponseDto {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  authorName?: string;
  authorEmail?: string;
  authorAvatarUrl?: string;
  imageUrl?: string;
  eventId?: string;
  event?: {
    id: string;
    name: string;
    date: string;
    bannerUrl?: string;
  };
}

export class GetPostsResponseDto {
  posts: PostResponseDto[];
  total: number;
}
