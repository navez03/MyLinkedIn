import { Module, forwardRef } from '@nestjs/common';
import { ConnectionController } from './connectController';
import { ConnectionService } from './connectService';
import { SupabaseService } from '../config/supabaseClient';
import { MessageService } from '../Messages/messageService';
import { UserModule } from '../User/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [ConnectionController],
  providers: [ConnectionService, SupabaseService, MessageService],
  exports: [ConnectionService],
})
export class ConnectionModule { }