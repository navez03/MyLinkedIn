import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';
import { ConnectionService } from '../Connects/connectService';
import { CreatePostDto, PostResponseDto, GetPostsResponseDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly connectionService: ConnectionService,
  ) { }

  async createPost(createPostDto: CreatePostDto): Promise<PostResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', createPostDto.userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: createPostDto.userId,
        content: createPostDto.content,
      })
      .select()
      .single();

    if (postError) {
      throw new Error(`Error creating post: ${postError.message}`);
    }

    return {
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at,
      authorName: user.name,
      authorEmail: user.email,
    };
  }

  async getPostById(postId: string): Promise<PostResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (name, email)
      `)
      .eq('id', postId)
      .single();

    if (error || !post) {
      throw new Error('Post not found');
    }

    return {
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at,
      authorName: post.users?.name,
      authorEmail: post.users?.email,
    };
  }

  async getPostsByUserId(userId: string, limit: number = 10, offset: number = 0): Promise<GetPostsResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (name, email)
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
    }));

    return {
      posts: postResponses,
      total: count || 0,
    };
  }

  async getAllPosts(limit: number = 20, offset: number = 0): Promise<GetPostsResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (name, email)
      `, { count: 'exact' })
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
    }));

    return {
      posts: postResponses,
      total: count || 0,
    };
  }

  async getPostsByUserAndConnections(userId: string, limit: number = 20, offset: number = 0): Promise<GetPostsResponseDto> {
    const connections = await this.connectionService.getConnections(userId);

    const connectedUserIds = [userId];
    if (connections && connections.length > 0) {
      connections.forEach((connection: any) => {
        connectedUserIds.push(connection.user.id);
      });
    }

    const supabase = this.supabaseService.getClient();
    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (name, email)
      `, { count: 'exact' })
      .in('user_id', connectedUserIds)
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
    }));

    return {
      posts: postResponses,
      total: count || 0,
    };
  }

  async deletePost(postId: string, userId: string): Promise<{ message: string }> {
    const supabase = this.supabaseService.getClient();

    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !existingPost) {
      throw new Error('Post not found');
    }

    if (existingPost.user_id !== userId) {
      throw new Error('You do not have permission to delete this post');
    }

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      throw new Error(`Error deleting post: ${deleteError.message}`);
    }

    return { message: 'Post deleted successfully' };
  }

  async searchPosts(query: string): Promise<GetPostsResponseDto> {
    if (!query || query.trim() === '') {
      return { posts: [], total: 0 };
    }

    const searchTerm = `%${query.trim()}%`;
    const supabase = this.supabaseService.getClient();

    console.log('Searching with term:', searchTerm); // Debug log

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (name, email)
      `, { count: 'exact' })
      .textSearch('content', query.trim(), {
        type: 'websearch',
        config: 'english'
      });

    if (error) {
      console.error('Search error:', error); // Debug log
      throw new Error(`Error searching posts: ${error.message}`);
    }

    console.log('Found posts:', posts); // Debug log

    const postResponses: PostResponseDto[] = (posts || []).map((post) => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at,
      authorName: post.users?.name,
      authorEmail: post.users?.email,
    }));

    return {
      posts: postResponses,
      total: count || 0,
    };
  }
}
