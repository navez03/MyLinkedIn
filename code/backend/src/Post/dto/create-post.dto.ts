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
  repostId?: string | null;
  repostedBy?: string;
  repostedByUserId?: string;
  repostedByName?: string;
  repostedByAvatarUrl?: string;
  repostComment?: string;
  originalPostContent?: string;
  originalPostAuthorName?: string;
  originalPostAuthorId?: string;
  originalPostAuthorAvatarUrl?: string;
  originalPostImageUrl?: string;
  originalPostCreatedAt?: string;
  likes?: number;
  commentsCount?: number;
  likedByCurrentUser?: boolean;
}

export class GetPostsResponseDto {
  posts: PostResponseDto[];
  total: number;
}
