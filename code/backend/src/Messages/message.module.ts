import { Module } from '@nestjs/common';
import { MessageController } from './messageController';
import { MessageService } from './messageService';
import { SupabaseService } from '../config/supabaseClient';

@Module({
  controllers: [MessageController],
  providers: [MessageService, SupabaseService],
  exports: [MessageService, SupabaseService],
})
export class MessageModule { }