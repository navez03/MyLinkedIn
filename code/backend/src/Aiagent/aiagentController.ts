// src/aiagent/aiagent.controller.ts
import { Body, Controller, Post } from "@nestjs/common";
import { AiAgentService } from "./aiagentService";
import { AiAgentDto } from "./dto/aiagent.dto";

@Controller("aiagent")
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) { }

  @Post()
  async handleMessage(@Body() body: AiAgentDto) {
    return await this.aiAgentService.processMessage(body);
  }
}
