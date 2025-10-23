import { Message } from "./message.dto";

export class GetMessagesResponseDto {
  success: boolean;
  message: string;
  messages: Message[];
  error?: string;
}

