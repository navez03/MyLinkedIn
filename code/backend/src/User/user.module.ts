import { Module } from '@nestjs/common';
import { UserController } from './userController';
import { SupabaseService } from '../config/supabaseClient';

@Module({
  controllers: [UserController],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class UserModule { }