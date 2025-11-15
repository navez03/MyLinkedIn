import { Module } from "@nestjs/common";
import { AiAgentController } from "./aiagent.controller";

@Module({
  controllers: [AiAgentController],
})
export class AiAgentModule {}
