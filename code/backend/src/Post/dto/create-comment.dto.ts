import { IsNotEmpty, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsNotEmpty()
  post_id: string;
}

export class CommentResponseDto {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  authorName?: string;
  authorEmail?: string;
}