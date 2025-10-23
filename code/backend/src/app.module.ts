import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './User/user.module';
import { ConnectionModule } from './Connects/connect.module';
import { MessageModule } from './Messages/message.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UserModule,
    ConnectionModule,
    MessageModule,
  ],
})
export class AppModule { }