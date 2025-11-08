import { Module } from '@nestjs/common';
import { UserController } from './userController';
import { UserService } from './userService';
import { SessionService } from './sessionService';
import { AuthGuard } from './userGuard';
import { SupabaseService } from '../config/supabaseClient';

@Module({
  controllers: [UserController],
  providers: [UserService, SessionService, AuthGuard, SupabaseService],
  exports: [UserService, SessionService, AuthGuard, SupabaseService],
})
export class UserModule { }