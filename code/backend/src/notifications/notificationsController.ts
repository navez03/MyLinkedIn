import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  BadRequestException,
} from "@nestjs/common";
import {
  NotificationsService,
  Notification as Notif,
} from "./notifications.service";
import { MarkAllReadDto, MarkReadDto } from "./dto/mark-read.dto";

type ListResponse =
  | {
      success: true;
      message: string;
      notifications: Array<Pick<Notif, "user_id" | "kind">>;
    }
  | { success: false; message: string; error?: string };

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get("list")
  async list(@Query() q: any): Promise<ListResponse> {
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

    const data = await this.service.list(userId, unreadOnly, limit, offset);
    return {
      success: true,
      message: "Notifications retrieved successfully",
      notifications: data, // [{ user_id, kind }, ...]
    };
  }

  @Patch("read")
  markRead(@Body() body: MarkReadDto) {
    const { notificationId, read } = body;
    return this.service.markRead(notificationId, read ?? true);
  }

  @Patch("read/all")
  markAllRead(@Body() body: MarkAllReadDto) {
    return this.service.markAllRead(body.userId);
  }
}
