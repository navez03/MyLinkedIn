import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePostDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class PostResponseDto {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  authorName?: string;
  authorEmail?: string;
}

export class GetPostsResponseDto {
  posts: PostResponseDto[];
  total: number;
}
