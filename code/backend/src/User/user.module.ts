import { Module } from '@nestjs/common';
import { UserController } from './userController';
import { UserService } from './userService';
import { SupabaseService } from '../config/supabaseClient';

@Module({
  controllers: [UserController],
  providers: [UserService, SupabaseService],
  exports: [UserService, SupabaseService],
})
export class UserModule { }