import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Query,
  BadRequestException,
  Delete,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  NotificationsService,
  Notification as Notif,
} from "./notificationsService";
import { MarkAllReadDto, MarkReadDto } from "./dto/mark-read.dto";
import { AuthGuard } from '../User/userGuard';
import { GetToken } from '../config/decorators';

type ListResponse =
  | {
    success: true;
    message: string;
    notifications: Notif[];
  }
  | { success: false; message: string; error?: string };

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly service: NotificationsService) { }

  @Get("list")
  @UseGuards(AuthGuard)
  async list(@Query() q: any, @GetToken() token: string): Promise<ListResponse> {
    const userId = q.userId as string;
    if (!userId) {
      throw new BadRequestException({
        success: false,
        message: "Missing 'userId' query param",
        error: "Bad Request",
      });
    }

    const unreadOnly = q.unreadOnly === "true" || q.unreadOnly === true;
    const limit = q.limit ? Number(q.limit) : 20;
    const offset = q.offset ? Number(q.offset) : 0;

    const data = await this.service.list(userId, token, unreadOnly, limit, offset);
    return {
      success: true,
      message: "Notifications retrieved successfully",
      notifications: data, // [{ user_id, kind }, ...]
    };
  }

  @Post("read")
  @UseGuards(AuthGuard)
  async markRead(@Body() body: MarkReadDto, @GetToken() token: string) {
    console.log('markRead endpoint called with body:', body);
    const { notificationId, read } = body;
    const notification = await this.service.markRead(notificationId, token, read ?? true);
    console.log('markRead endpoint returning:', { success: true, message: "Notification marked as read/unread", notification });
    return {
      success: true,
      message: "Notification marked as read/unread",
      notification,
    };
  }

  @Post("read/all")
  @UseGuards(AuthGuard)
  async markAllRead(@Body() body: MarkAllReadDto, @GetToken() token: string) {
    const result = await this.service.markAllRead(body.userId, token);
    return {
      success: true,
      message: "All notifications marked as read",
      ...result,
    };
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  async delete(@Param("id") id: string, @GetToken() token: string) {
    if (!id) {
      throw new BadRequestException({
        success: false,
        message: "Missing notification id",
        error: "Bad Request",
      });
    }
    await this.service.delete(id, token);
    return { success: true, message: "Notification deleted" };
  }
}
