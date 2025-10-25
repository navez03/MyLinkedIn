import { Module } from '@nestjs/common';
import { ConnectionController } from './connectController';
import { ConnectionService } from './connectService';
import { SupabaseService } from '../config/supabaseClient';
import { MessageService } from '../Messages/messageService';

@Module({
  controllers: [ConnectionController],
  providers: [ConnectionService, SupabaseService, MessageService],
  exports: [ConnectionService],
})
export class ConnectionModule { }