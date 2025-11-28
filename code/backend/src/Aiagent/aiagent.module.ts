import { Module } from "@nestjs/common";
import { AiAgentController } from "./aiagentController";

@Module({
  controllers: [AiAgentController],
  providers: [require('./aiagentService').AiAgentService],
})
export class AiAgentModule { }
