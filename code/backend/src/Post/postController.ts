import { Controller, Post, Get, Delete, Body, Param, Query, Req, ValidationPipe, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { PostService } from './postService';
import { CreatePostDto, PostResponseDto, GetPostsResponseDto } from './dto/create-post.dto';
import { CreateCommentDto, CommentResponseDto } from './dto/create-comment.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @Get('search')
  async searchPosts(
    @Query('query') query: string
  ): Promise<{ success: boolean; posts: PostResponseDto[]; total: number }> {
    try {
      const result = await this.postService.searchPosts(query);
      return {
        success: true,
        posts: result.posts,
        total: result.total,
      };
    } catch (error) {
      this.handleException(error, 'Error searching posts');
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body(ValidationPipe) createPostDto: CreatePostDto): Promise<{ success: boolean; post: PostResponseDto }> {
    try {
      const post = await this.postService.createPost(createPostDto);
      return {
        success: true,
        post,
      };
    } catch (error) {
      this.handleException(error, 'Error creating post');
    }
  }

  @Get(':id')
  async getPostById(@Param('id') id: string): Promise<{ success: boolean; post: PostResponseDto }> {
    try {
      const post = await this.postService.getPostById(id);
      return {
        success: true,
        post,
      };
    } catch (error) {
      this.handleException(error, 'Error fetching post', HttpStatus.NOT_FOUND);
    }
  }

  @Get('user/:userId')
  async getPostsByUserId(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ success: boolean; posts: PostResponseDto[]; total: number }> {
    try {
      const result = await this.postService.getPostsByUserId(
        userId,
        limit ? Number(limit) : 10,
        offset ? Number(offset) : 0,
      );
      return {
        success: true,
        posts: result.posts,
        total: result.total,
      };
    } catch (error) {
      this.handleException(error, 'Error fetching user posts');
    }
  }

  @Get('feed/:userId')
  async getPostsByUserAndConnections(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ success: boolean; posts: PostResponseDto[]; total: number }> {
    try {
      const result = await this.postService.getPostsByUserAndConnections(
        userId,
        limit ? Number(limit) : 20,
        offset ? Number(offset) : 0,
      );
      return {
        success: true,
        posts: result.posts,
        total: result.total,
      };
    } catch (error) {
      this.handleException(error, 'Error fetching feed posts');
    }
  }

  @Get()
  async getAllPosts(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ success: boolean; posts: PostResponseDto[]; total: number }> {
    try {
      const result = await this.postService.getAllPosts(
        limit ? Number(limit) : 20,
        offset ? Number(offset) : 0,
      );
      return {
        success: true,
        posts: result.posts,
        total: result.total,
      };
    } catch (error) {
      this.handleException(error, 'Error fetching posts');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePost(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.postService.deletePost(id, userId);
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      this.handleException(error, 'Error deleting post');
    }
  }

  @Post(':postId/comments')
  async addComment(
    @Param('postId') postId: string,
    @Body(new ValidationPipe({ whitelist: true })) createCommentDto: CreateCommentDto
  ) {
    try {
      createCommentDto.post_id = postId; // Garantir que o post_id corresponde ao URL
      const comment = await this.postService.addComment(createCommentDto);
      return { success: true, comment };
    } catch (error) {
      throw error;
    }
  }

  @Get(':postId/comments')
  async getComments(
    @Param('postId') postId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const result = await this.postService.getComments(postId, limit ? Number(limit) : 10, offset ? Number(offset) : 0);
    return { success: true, comments: result.comments, total: result.total };
  }

  @Delete(':postId/comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @Req() req) {
    const userId = req.user?.id || req.body.userId;
    await this.postService.deleteComment(commentId, userId);
    return { success: true };
  }

  @Post(':postId/likes')
  async likePost(@Param('postId') postId: string, @Req() req) {
    const userId = req.user?.id || req.body.userId;
    const res = await this.postService.likePost(postId, userId);
    return { success: true, liked: true, totalLikes: res.totalLikes };
  }

  @Delete(':postId/likes')
  async unlikePost(@Param('postId') postId: string, @Req() req) {
    const userId = req.user?.id || req.body.userId;
    const res = await this.postService.unlikePost(postId, userId);
    return { success: true, liked: false, totalLikes: res.totalLikes };
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
