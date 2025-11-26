import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';
import { ConnectionService } from '../Connects/connectService';
import { CreatePostDto, PostResponseDto, GetPostsResponseDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly connectionService: ConnectionService,
  ) { }

  private async getEventDetails(eventId: string | null, supabase: any) {
    if (!eventId) return null;

    const { data: event } = await supabase
      .from('events')
      .select('id, name, date, banner_url')
      .eq('id', eventId)
      .single();

    if (!event) return null;

    return {
      id: event.id,
      name: event.name,
      date: event.date,
      bannerUrl: event.banner_url,
    };
  }

  async createPost(createPostDto: CreatePostDto, token: string): Promise<PostResponseDto> {
    const supabase = this.supabaseService.getClientWithToken(token);

    // O RLS garante que apenas o utilizador autenticado pode criar posts
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: createPostDto.userId,
        content: createPostDto.content,
        image_url: createPostDto.imageUrl || null,
        event_id: createPostDto.eventId || null,
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

    const eventDetails = await this.getEventDetails(post.event_id, supabase);

    return {
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at,
      authorName: post.users?.name,
      authorEmail: post.users?.email,
      authorAvatarUrl: post.users?.avatar_url,
      imageUrl: post.image_url,
      eventId: post.event_id,
      event: eventDetails,
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

    const eventDetails = await this.getEventDetails(post.event_id, supabase);

    // Handle repost data - if this post is a repost (has repost_id)
    let repostData: Partial<PostResponseDto> = {};
    if (post.repost_id) {
      // This is a repost - fetch the original post data
      const { data: originalPost } = await supabase
        .from('posts')
        .select('*, users:user_id (name, email, avatar_url)')
        .eq('id', post.repost_id)
        .single();

      repostData = {
        repostId: post.repost_id,
        repostedBy: post.users?.name,
        repostedByUserId: post.user_id,
        repostedByName: post.users?.name,
        repostedByAvatarUrl: post.users?.avatar_url,
        repostComment: post.content, // The repost comment is stored in the content field
        // Original post data
        originalPostContent: originalPost?.content,
        originalPostAuthorName: originalPost?.users?.name,
        originalPostAuthorId: originalPost?.user_id,
        originalPostAuthorAvatarUrl: originalPost?.users?.avatar_url,
        originalPostImageUrl: originalPost?.image_url,
        originalPostCreatedAt: originalPost?.created_at,
      };
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
      eventId: post.event_id,
      event: eventDetails,
      ...repostData,
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

    const postResponses: PostResponseDto[] = await Promise.all((posts || []).map(async (post) => {
      const eventDetails = await this.getEventDetails(post.event_id, supabase);
      return {
        id: post.id,
        userId: post.user_id,
        content: post.content,
        createdAt: post.created_at,
        authorName: post.users?.name,
        authorEmail: post.users?.email,
        authorAvatarUrl: post.users?.avatar_url,
        imageUrl: post.image_url,
        eventId: post.event_id,
        event: eventDetails,
        likes: await this.countLikes(post.id),
        commentsCount: await this.getCommentsCount(post.id),
      };
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

    const postResponses: PostResponseDto[] = await Promise.all((posts || []).map(async (post) => {
      const eventDetails = await this.getEventDetails(post.event_id, supabase);
      return {
        id: post.id,
        userId: post.user_id,
        content: post.content,
        createdAt: post.created_at,
        authorName: post.users?.name,
        authorEmail: post.users?.email,
        authorAvatarUrl: post.users?.avatar_url,
        imageUrl: post.image_url,
        eventId: post.event_id,
        event: eventDetails,
        likes: await this.countLikes(post.id),
        commentsCount: await this.getCommentsCount(post.id),
      };
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

    const postResponses: PostResponseDto[] = await Promise.all((posts || []).map(async (post) => {
      // Verifica se o utilizador atual já deu like neste post
      const likedByCurrentUser = await this.isPostLikedByUser(post.id, userId);
      const eventDetails = await this.getEventDetails(post.event_id, supabase);

      // Handle repost data - if this post is a repost (has repost_id)
      let repostData: Partial<PostResponseDto> = {};
      if (post.repost_id) {
        // This is a repost - fetch the original post data
        const { data: originalPost } = await supabase
          .from('posts')
          .select('*, users:user_id (name, email, avatar_url)')
          .eq('id', post.repost_id)
          .single();

        repostData = {
          repostId: post.repost_id,
          repostedBy: post.users?.name,
          repostedByUserId: post.user_id,
          repostedByName: post.users?.name,
          repostedByAvatarUrl: post.users?.avatar_url,
          repostComment: post.content, // The repost comment is stored in the content field
          // Original post data
          originalPostContent: originalPost?.content,
          originalPostAuthorName: originalPost?.users?.name,
          originalPostAuthorId: originalPost?.user_id,
          originalPostAuthorAvatarUrl: originalPost?.users?.avatar_url,
          originalPostImageUrl: originalPost?.image_url,
          originalPostCreatedAt: originalPost?.created_at,
        };
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
        eventId: post.event_id,
        event: eventDetails,
        likes: await this.countLikes(post.id),
        commentsCount: await this.getCommentsCount(post.id),
        likedByCurrentUser,
        ...repostData,
      };
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

    const postResponses: PostResponseDto[] = await Promise.all((posts || []).map(async (post) => {
      const eventDetails = await this.getEventDetails(post.event_id, supabase);
      return {
        id: post.id,
        userId: post.user_id,
        content: post.content,
        createdAt: post.created_at,
        authorName: post.users?.name,
        authorEmail: post.users?.email,
        imageUrl: post.image_url,
        eventId: post.event_id,
        event: eventDetails,
        likes: await this.countLikes(post.id),
        commentsCount: await this.getCommentsCount(post.id),
      };
    }));

    return {
      posts: postResponses,
      total: count || 0,
    };
  }

  async likePost(postId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    // Tentar inserir; caso já exista, trata como idempotente
    const { error: insertErr } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });

    if (insertErr && insertErr.code !== '23505') { // 23505 = unique_violation
      throw new Error(`Error liking post: ${insertErr.message}`);
    }

    // Contar likes
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: false })
      .eq('post_id', postId);

    return { liked: true, totalLikes: count || 0 };
  }

  async unlikePost(postId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw new Error(`Error unliking post: ${error.message}`);

    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact' })
      .eq('post_id', postId);

    return { liked: false, totalLikes: count || 0 };
  }

  async countLikes(postId: string) {
    const supabase = this.supabaseService.getClient();
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact' })
      .eq('post_id', postId);

    return count || 0;
  }

  async isPostLikedByUser(postId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .limit(1);

    return (data && data.length > 0);
  }

  async addComment(createCommentDto: CreateCommentDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('post_comments')
      .insert([createCommentDto])
      .select('*')
      .single();

    if (error) throw error;

    // Buscar o nome do utilizador
    const { data: user } = await supabase
      .from('users')
      .select('name, email, avatar_url')
      .eq('id', createCommentDto.user_id)
      .single();

    return {
      ...data,
      authorName: user?.name,
      authorEmail: user?.email,
      authorAvatarUrl: user?.avatar_url,
    };
  }

  async getComments(postId: string, limit = 10, offset = 0) {
    const supabase = this.supabaseService.getClient();

    const { data: comments, error, count } = await supabase
      .from('post_comments')
      .select(`
      *,
      users:user_id (name, email, avatar_url)
    `, { count: 'exact' })
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Error fetching comments: ${error.message}`);

    const mapped = (comments || []).map((c) => ({
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at,
      authorName: c.users?.name,
      authorEmail: c.users?.email,
      authorAvatarUrl: c.users?.avatar_url,
    }));

    return { comments: mapped, total: count || 0 };
  }

  async deleteComment(commentId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: existing, error: fetchErr } = await supabase
      .from('post_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchErr || !existing) throw new Error('Comment not found');
    if (existing.user_id !== userId) throw new Error('Forbidden');

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw new Error(`Error deleting comment: ${error.message}`);

    return { success: true };
  }

  async getCommentsCount(postId: string) {
    const supabase = this.supabaseService.getClient();
    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact' })
      .eq('post_id', postId);
    return count || 0;
  }

  async repostPost(originalPostId: string, userId: string, comment?: string | null): Promise<PostResponseDto> {
    const supabase = this.supabaseService.getClient();

    // Verify original post exists
    const { data: originalPost, error: originalPostError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', originalPostId)
      .single();

    if (originalPostError || !originalPost) {
      throw new BadRequestException('Original post not found');
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new BadRequestException('User not found');
    }

    // Create repost (new post with repost_id and optional comment as content)
    // Copy image_url and event_id from original post
    const repostContent = comment || ''; // If no comment, content is empty string
    const { data: repost, error: repostError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: repostContent,
        repost_id: originalPostId,
        image_url: originalPost.image_url, // Copy from original
        event_id: originalPost.event_id, // Copy from original
      })
      .select(`
        *,
        users:user_id (name, email, avatar_url)
      `)
      .single();

    if (repostError) {
      this.logger.error('Error creating repost', repostError.message);
      throw new BadRequestException(`Error creating repost: ${repostError.message}`);
    }

    this.logger.log(`Post reposted by user: ${userId}`);

    // Get event details if original post had one
    const eventDetails = await this.getEventDetails(repost.event_id, supabase);

    return {
      id: repost.id,
      userId: repost.user_id,
      content: repost.content,
      createdAt: repost.created_at,
      authorName: repost.users?.name,
      authorEmail: repost.users?.email,
      authorAvatarUrl: repost.users?.avatar_url,
      imageUrl: repost.image_url,
      eventId: repost.event_id,
      event: eventDetails,
    };
  }

}
