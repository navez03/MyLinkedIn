import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MulterModule } from '@nestjs/platform-express';
import { UserModule } from "./User/user.module";
import { ConnectionModule } from "./Connects/connect.module";
import { MessageModule } from "./Messages/message.module";
import { PostModule } from "./Post/post.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { EventModule } from "./Events/event.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    UserModule,
    ConnectionModule,
    MessageModule,
    PostModule,
    NotificationsModule,
    EventModule,
  ],
})
export class AppModule { }
