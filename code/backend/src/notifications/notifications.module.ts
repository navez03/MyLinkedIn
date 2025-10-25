import { Module } from "@nestjs/common";
import { SupabaseService } from "../config/supabaseClient";
import { NotificationsService } from "./notificationsService";
import { NotificationsController } from "./notificationsController";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, SupabaseService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
