import { Module } from '@nestjs/common';
import { EventController } from './eventController';
import { EventService } from './eventService';
import { SupabaseService } from '../config/supabaseClient';
import { ConnectionModule } from '../Connects/connect.module';
import { UserModule } from '../User/user.module';

@Module({
  imports: [ConnectionModule, UserModule],
  controllers: [EventController],
  providers: [EventService, SupabaseService],
  exports: [EventService, SupabaseService],
})

export class EventModule { }