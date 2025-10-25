// get-notifications.dto.ts

import { IsBoolean, IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export type NotificationKind = "message" | "connection_request";

/**
 * Query DTO (validação dos query params do GET /notifications/list)
 */
export class ListNotificationsQueryDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

/**
 * Item devolvido na lista (apenas as colunas pedidas)
 */
export class NotificationListItemDto {
  user_id!: string;
  kind!: NotificationKind;
  // (opcional) se quiseres também o tempo:
  // created_at!: string;
}

/**
 * Response DTO do endpoint
 */
export class GetNotificationsResponseDto {
  success!: boolean;
  message!: string;
  notifications!: NotificationListItemDto[];
}
