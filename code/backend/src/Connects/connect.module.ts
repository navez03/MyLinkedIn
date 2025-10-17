import { Module } from '@nestjs/common';
import { ConnectionController } from './connectController';
import { ConnectionService } from './connectService';
import { SupabaseService } from '../config/supabaseClient';

@Module({
  controllers: [ConnectionController],
  providers: [ConnectionService, SupabaseService],
  exports: [ConnectionService],
})
export class ConnectionModule { }