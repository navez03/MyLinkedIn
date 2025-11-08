import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';
import { ConnectionService } from '../Connects/connectService';
import { CreatePostDto, PostResponseDto, GetPostsResponseDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly connectionService: ConnectionService,
  ) { }

  async createPost(createPostDto: CreatePostDto, token: string): Promise<PostResponseDto> {
    const supabase = this.supabaseService.getClientWithToken(token);

    // O RLS garante que apenas o utilizador autenticado pode criar posts
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: createPostDto.userId,
        content: createPostDto.content,
        image_url: createPostDto.imageUrl || null,
      })
      .select(`
        *,
        users:user_id (name, email, avatar_url)
      `)
      .single();

    if (postError) {
      this.logger.error('Error creating post', postError.message);
      throw new BadRequestException(`Error creating post: ${postError.message}`);
    }

    this.logger.log(`Post created by user: ${post.user_id}`);

    return {
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at,
      authorName: post.users?.name,
      authorEmail: post.users?.email,
      authorAvatarUrl: post.users?.avatar_url,
      imageUrl: post.image_url,
    };
  }

  async getPostById(postId: string, token: string): Promise<PostResponseDto> {
    const supabase = this.supabaseService.getClientWithToken(token);

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (name, email, avatar_url)
      `)
      .eq('id', postId)
      .single();

    if (error || !post) {
      throw new BadRequestException('Post not found');
    }

    return {
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at,
      authorName: post.users?.name,
      authorEmail: post.users?.email,
      authorAvatarUrl: post.users?.avatar_url,
      imageUrl: post.image_url,
    };
  }

  async getPostsByUserId(userId: string, token: string, limit: number = 10, offset: number = 0): Promise<GetPostsResponseDto> {
    const supabase = this.supabaseService.getClientWithToken(token);

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (name, email, avatar_url)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Error fetching posts: ${error.message}`);
    }

    const postResponses: PostResponseDto[] = (posts || []).map((post) => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at,
      authorName: post.users?.name,
      authorEmail: post.users?.email,
      authorAvatarUrl: post.users?.avatar_url,
      imageUrl: post.image_url,
    }));

    return {
      posts: postResponses,
      total: count || 0,
    };
  }

  async getAllPosts(token: string, limit: number = 20, offset: number = 0): Promise<GetPostsResponseDto> {
    const supabase = this.supabaseService.getClientWithToken(token);

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (name, email, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error('Error fetching posts', error.message);
      throw new BadRequestException(`Error fetching posts: ${error.message}`);
    }

    const postResponses: PostResponseDto[] = (posts || []).map((post) => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at,
      authorName: post.users?.name,
      authorEmail: post.users?.email,
      authorAvatarUrl: post.users?.avatar_url,
      imageUrl: post.image_url,
    }));

    return {
      posts: postResponses,
      total: count || 0,
    };
  }

  async getPostsByUserAndConnections(userId: string, token: string, limit: number = 20, offset: number = 0): Promise<GetPostsResponseDto> {
    const supabase = this.supabaseService.getClientWithToken(token);

    const connections = await this.connectionService.getConnections(userId, token);

    const connectedUserIds = [userId];
    if (connections && connections.length > 0) {
      connections.forEach((connection: any) => {
        connectedUserIds.push(connection.user.id);
      });
    }

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (name, email, avatar_url)
      `, { count: 'exact' })
      .in('user_id', connectedUserIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error('Error fetching feed posts', error.message);
      throw new BadRequestException(`Error fetching posts: ${error.message}`);
    }

    const postResponses: PostResponseDto[] = (posts || []).map((post) => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at,
      authorName: post.users?.name,
      authorEmail: post.users?.email,
      authorAvatarUrl: post.users?.avatar_url,
      imageUrl: post.image_url,
    }));

    return {
      posts: postResponses,
      total: count || 0,
    };
  }

  async deletePost(postId: string, token: string): Promise<{ message: string }> {
    const supabase = this.supabaseService.getClientWithToken(token);

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      this.logger.error('Error deleting post', deleteError.message);
      throw new BadRequestException(`Error deleting post: ${deleteError.message}`);
    }

    this.logger.log(`Post deleted: ${postId}`);
    return { message: 'Post deleted successfully' };
  }
}
