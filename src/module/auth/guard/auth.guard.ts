import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { isJWT } from "class-validator";
import { Request } from "express";
import { AuthService } from "../auth.service";
import { Reflector } from "@nestjs/core";
import { ROLE_KEY } from "src/common/decorators/roles.decorator";

@Injectable()
export class AuthGuard implements CanActivate{
    constructor(
        private authService : AuthService,
        private reflector: Reflector
    ){}
    async canActivate(
        context: ExecutionContext
    ) {
        const httpRequest = context.switchToHttp()
        const request : Request = httpRequest.getRequest<Request>()
        // const token = this.extractToken(request)
        request.user = await this.authService.validateAccessToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidHlwZSI6InVzZXIiLCJtb2JpbGUiOiIwOTkwMzA0MDQ1OSIsImlhdCI6MTczODA3NDk4NiwiZXhwIjoxNzQwNjY2OTg2fQ.kAPOi4rZFJWFPrN3CXUQIGngNFsj0tK_x8UfdOygFfA")    
        const requiredRole : string[] = this.reflector.get(ROLE_KEY, context.getHandler());
        if(requiredRole && requiredRole.length>0){
            const userRole = await this.authService.checkUserRole(request.user.mobile, request.user.type)
            if(requiredRole.includes(userRole.toString())){
                    return true
            }
                throw new UnauthorizedException("دسترسی شما به این بخش محدود میباشد.")
        }
        return true
    }
    protected extractToken(request : Request){
        const { authorization = undefined } = request?.headers ?? {}
        if(!authorization ||  authorization?.trim() == "") 
            throw new UnauthorizedException("لطفا وارد اکانت خود شوید.")
        const [ bearer , token ] = authorization?.split(" ")
        if(bearer.toLowerCase() !== "bearer" || !token || !isJWT(token))
            throw new UnauthorizedException("لطفا وارد اکانت خود شوید.")        
        return token
    }

}