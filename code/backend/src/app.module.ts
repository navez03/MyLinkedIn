import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './User/user.module';
import { ConnectionModule } from './Connects/connect.module';
import { MessageModule } from './Messages/message.module';
import { PostModule } from './Post/post.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UserModule,
    ConnectionModule,
    MessageModule,
    PostModule,
  ],
})
export class AppModule { }