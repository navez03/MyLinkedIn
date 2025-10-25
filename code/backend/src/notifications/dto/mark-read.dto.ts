import { IsBoolean, IsOptional, IsUUID } from "class-validator";

export class MarkReadDto {
  @IsUUID() notificationId!: string;
  @IsOptional() @IsBoolean() read?: boolean; // default true
}

export class MarkAllReadDto {
  @IsUUID() userId!: string;
}
