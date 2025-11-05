import { Module } from "@nestjs/common";
import { SupabaseService } from "../config/supabaseClient";
import { NotificationsService } from "./notificationsService";
import { NotificationsController } from "./notificationsController";
import { UserModule } from '../User/user.module';

@Module({
  imports: [UserModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SupabaseService],
  exports: [NotificationsService],
})
export class NotificationsModule { }
