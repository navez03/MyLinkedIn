import { Module } from '@nestjs/common';
import { MessageController } from './messageController';
import { MessageService } from './messageService';
import { MessageGateway } from './messageGateway';
import { SupabaseService } from '../config/supabaseClient';

@Module({
  controllers: [MessageController],
  providers: [MessageService, MessageGateway, SupabaseService],
  exports: [MessageService, SupabaseService],
})
export class MessageModule { }