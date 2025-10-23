import { Message } from "./message.dto";

export class SendMessageResponseDto {
  success: boolean;
  message: string;
  data?: Message;
  error?: string;
}
