import { Controller, Post, Get, Delete, Body, Param, Query, Req, ValidationPipe, HttpCode, HttpStatus, HttpException, UseGuards, Logger, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostService } from './postService';
import { CreatePostDto, PostResponseDto, GetPostsResponseDto } from './dto/create-post.dto';
import { CreateCommentDto, CommentResponseDto } from './dto/create-comment.dto';
import { RepostDto } from './dto/repost.dto';
import { AuthGuard } from '../User/userGuard';
import { GetToken, GetUserId } from '../config/decorators';
import { SupabaseService } from '../config/supabaseClient';
import 'multer';

@Controller('posts')
export class PostController {
  private readonly logger = new Logger(PostController.name);

  constructor(
    private readonly postService: PostService,
    private readonly supabase: SupabaseService,
  ) { }

  @Post('upload-image')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @GetUserId() userId: string,
    @GetToken() token: string
  ): Promise<{ success: boolean; imageUrl: string }> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const supabase = this.supabase.getClientWithToken(token);
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error('Error uploading image', error.message);
        throw new BadRequestException(`Error uploading image: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      return {
        success: true,
        imageUrl: publicUrlData.publicUrl,
      };
    } catch (error) {
      this.logger.error('Upload image error', error.message);
      this.handleException(error, 'Error uploading image');
    }
  }

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
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Body(ValidationPipe) createPostDto: CreatePostDto,
    @GetToken() token: string
  ): Promise<{ success: boolean; post: PostResponseDto }> {
    try {
      const post = await this.postService.createPost(createPostDto, token);
      return {
        success: true,
        post,
      };
    } catch (error) {
      this.logger.error('Create post error', error.message);
      this.handleException(error, 'Error creating post');
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getPostById(
    @Param('id') id: string,
    @GetToken() token: string
  ): Promise<{ success: boolean; post: PostResponseDto }> {
    try {
      const post = await this.postService.getPostById(id, token);
      return {
        success: true,
        post,
      };
    } catch (error) {
      this.logger.error('Get post error', error.message);
      this.handleException(error, 'Error fetching post', HttpStatus.NOT_FOUND);
    }
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  async getPostsByUserId(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @GetToken() token?: string
  ): Promise<{ success: boolean; posts: PostResponseDto[]; total: number }> {
    try {
      const result = await this.postService.getPostsByUserId(
        userId,
        token,
        limit ? Number(limit) : 10,
        offset ? Number(offset) : 0,
      );
      return {
        success: true,
        posts: result.posts,
        total: result.total,
      };
    } catch (error) {
      this.logger.error('Get user posts error', error.message);
      this.handleException(error, 'Error fetching user posts');
    }
  }

  @Get('feed/:userId')
  @UseGuards(AuthGuard)
  async getPostsByUserAndConnections(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @GetToken() token?: string
  ): Promise<{ success: boolean; posts: PostResponseDto[]; total: number }> {
    try {
      const result = await this.postService.getPostsByUserAndConnections(
        userId,
        token,
        limit ? Number(limit) : 20,
        offset ? Number(offset) : 0,
      );
      return {
        success: true,
        posts: result.posts,
        total: result.total,
      };
    } catch (error) {
      this.logger.error('Get feed posts error', error.message);
      this.handleException(error, 'Error fetching feed posts');
    }
  }

  @Get()
  @UseGuards(AuthGuard)
  async getAllPosts(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @GetToken() token?: string
  ): Promise<{ success: boolean; posts: PostResponseDto[]; total: number }> {
    try {
      const result = await this.postService.getAllPosts(
        token,
        limit ? Number(limit) : 20,
        offset ? Number(offset) : 0,
      );
      return {
        success: true,
        posts: result.posts,
        total: result.total,
      };
    } catch (error) {
      this.logger.error('Get all posts error', error.message);
      this.handleException(error, 'Error fetching posts');
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async deletePost(
    @Param('id') id: string,
    @GetToken() token: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.postService.deletePost(id, token);
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      this.logger.error('Delete post error', error.message);
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

  @Post(':postId/repost')
  @HttpCode(HttpStatus.CREATED)
  async repostPost(
    @Param('postId') postId: string,
    @Body(ValidationPipe) repostDto: RepostDto
  ): Promise<{ success: boolean; post: PostResponseDto }> {
    try {
      const post = await this.postService.repostPost(postId, repostDto.userId, repostDto.comment);
      return {
        success: true,
        post,
      };
    } catch (error) {
      this.logger.error('Repost error', error.message);
      this.handleException(error, 'Error reposting post');
    }
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
