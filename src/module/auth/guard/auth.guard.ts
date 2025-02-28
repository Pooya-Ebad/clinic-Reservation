import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { isJWT } from "class-validator";
import { Request } from "express";
import { AuthService } from "../auth.service";
import { Reflector } from "@nestjs/core";
import { ROLE_KEY } from "src/common/decorators/roles.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector
  ) {}
  async canActivate(context: ExecutionContext) {
    const requiredRole: string[] = this.reflector.get(
      ROLE_KEY,
      context.getHandler()
    );
    if (requiredRole && requiredRole.length > 0) {
      const httpRequest = context.switchToHttp();
      const request: Request = httpRequest.getRequest<Request>();
      const token = this.extractToken(request);
      request.user = await this.authService.validateAccessToken(token);
      const userRole = await this.authService.checkUserRole(request);
      if (requiredRole.includes(userRole.toString())) {
        return true;
      }
      throw new UnauthorizedException("دسترسی شما به این بخش محدود میباشد.");
    }
    return true;
  }
  protected extractToken(request: Request) {
    const { authorization = undefined } = request?.headers ?? {};
    if (!authorization || authorization?.trim() == "")
      throw new UnauthorizedException("لطفا وارد اکانت خود شوید.");
    const [bearer, token] = authorization?.split(" ");
    if (bearer.toLowerCase() !== "bearer" || !token || !isJWT(token))
      throw new UnauthorizedException("لطفا وارد اکانت خود شوید.");
    return token;
  }
}
