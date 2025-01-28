import { Body, Controller, Get, Global, Patch, Post, Put, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ChargeDto, CheckOtpDto, CreateOtpDto, RefreshTokenDto, RoleDto, SendOtpDto } from "./dto/auth.dto";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { SwaggerEnums } from "src/common/enums/swagger.enum";
import { AuthGuard } from "./guard/auth.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { Request } from "express";
import { role } from "src/common/enums/role.enum";

@Controller('auth')
@UsePipes(ValidationPipe)
@ApiBearerAuth("Authorization")
@ApiTags("Auth")
export class AuthController {
    constructor(private readonly authService : AuthService) {}
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    @Post("signup")
    signup(@Body() otpDto : CreateOtpDto) {
        return this.authService.signup(otpDto, "user")
    }
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    @Post("login")
    login(@Body() otpDto : SendOtpDto) {
        return this.authService.sendOtp(otpDto)
    }
    @Post("check-otp")
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    checkOtp(@Body() otpDto : CheckOtpDto) {
        return this.authService.checkOtp(otpDto,"user")
    }
    @Post("refreshToken")
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    refreshToken(@Body() refreshTokenDto : RefreshTokenDto) {
        return this.authService.verifyRefreshToken(refreshTokenDto)
    }
    @Get('profile')
    @UseGuards(AuthGuard)
    @Roles([role.USER])
    profile(
        @Req() request : Request
    ){
        return this.authService.profile(request.user.id)
    }
    @Put('charge-wallet')
    @UseGuards(AuthGuard)
    @ApiConsumes(SwaggerEnums.UrlEncoded)
    chargeWallet(
    @Body() chargeDto : ChargeDto,
    @Req() request : Request
    ){
    return this.authService.chargeWallet(request.user.id, chargeDto)
    }
    // @Roles(["admin"])
    // @UseGuards(AuthGuard)
    // @Patch("set-admin")
    // @ApiConsumes(SwaggerEnums.UrlEncoded)
    // setAdmin(@Body() role : RoleDto){
    //     return this.authService.setAdmin(role)
    // }
} 