import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const GetToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) return null;

    // Split by space and take the second part (the token)
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    
    // Fallback for cases where Bearer might be missing
    return authHeader;
  },
);

export const GetUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.userId;
  },
);
