import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards, Query, Req, UsePipes, ValidationPipe, Global, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { AppointmentDto, ChargeDto, FindUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { SwaggerEnums } from 'src/common/enums/swagger.enum';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Request } from 'express';

@Controller('users')
@ApiBearerAuth("Authorization")
@ApiTags("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  
  @Get()
  @Roles(["admin"])
  @UseGuards(AuthGuard)
  findAll() {
    return this.usersService.findAll();
  }

  
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  @Roles(["admin"])
  @UseGuards(AuthGuard)
  @Get("find-one/:mobile")
  async findOne(@Param("mobile") mobile: string) {
    return await this.usersService.checkExistUser(mobile);
  }

  @Get('getAppointment:id')
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  // @Roles(["admin"])
  getAppointment(@Param('id') id : string) {
    return this.usersService.getAppointment(+id);
  }
  
  @Patch('update-user:mobile')
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  update(@Param('mobile') mobile: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(mobile, updateUserDto);
  }

  @Put('setAppointment')
  @UseGuards(AuthGuard)
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  setAppointment(
    @Body() appointmentDto : AppointmentDto,
    @Req() request : Request
  ){
    return this.usersService.setAppointment(request.user.id, appointmentDto)
  }
  
  @Put('chargeWallet')
  @UseGuards(AuthGuard)
  @ApiConsumes(SwaggerEnums.UrlEncoded)
  chargeWallet(
    @Body() chargeDto : ChargeDto,
    @Req() request : Request
  ){
    return this.usersService.chargeWallet(request.user.id, chargeDto)
  }

  @Put('payment:id')
  payment(@Param('id') id : string){
    return this.usersService.payment(+id)
  }
  
  @Delete(':mobile')
  @Roles(["admin"])
  @UseGuards(AuthGuard)
  remove(@Param('mobile') mobile: string) {
    return this.usersService.remove(mobile);
  }

}
 