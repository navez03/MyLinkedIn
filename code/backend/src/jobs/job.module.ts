import { Module } from "@nestjs/common";
import { JobController } from "./jobController";
import { JobService } from "./jobService";
import { SupabaseService } from "../config/supabaseClient";
import { ConnectionModule } from "../Connects/connect.module";
import { UserModule } from "../User/user.module";

@Module({
  imports: [ConnectionModule, UserModule],
  controllers: [JobController],
  providers: [JobService, SupabaseService],
  exports: [JobService, SupabaseService],
})
export class JobModule {}
