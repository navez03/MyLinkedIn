import { Module } from '@nestjs/common';
import { PostController } from './postController';
import { PostService } from './postService';
import { SupabaseService } from '../config/supabaseClient';

@Module({
  controllers: [PostController],
  providers: [PostService, SupabaseService],
  exports: [PostService, SupabaseService],
})
export class PostModule { }