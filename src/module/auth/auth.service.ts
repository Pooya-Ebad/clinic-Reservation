import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomInt} from "crypto";
import { ChargeDto, CheckOtpDto, CreateOtpDto, RefreshTokenDto, SendOtpDto } from "./dto/auth.dto";
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "../users/entities/user.entity";
import { TokenPayload } from "src/common/types/payload";
import { DoctorEntity } from "../doctors/entities/doctor.entity";
import { mobileValidation } from "src/common/utility/mobile.utils";
import { statusEnum } from "src/common/enums/status.enum";
import { role } from "src/common/enums/role.enum";
import { Request } from "express";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(DoctorEntity)
    private docRepository: Repository<DoctorEntity>,
    private jwtService: JwtService
  ) {}
  private createOtp() {
    let code = randomInt(10000, 99999).toString();
    let expiration = new Date(new Date().getTime() + 1000 * 60 * 1);
    return { code, expiration };
  }
  async signup(OtpDto: CreateOtpDto, type: string) {
    const { mobile, first_name, last_name } = OtpDto;
    const { phoneNumber } = mobileValidation(mobile);
    const { code, expiration } = this.createOtp();
    const date = new Date().getTime();
    if (type === "doctor") {
      let doc = await this.docRepository.findOneBy({ mobile: phoneNumber });
      if (!doc) {
        doc = this.docRepository.create({
          first_name,
          last_name,
          mobile: phoneNumber,
          otp: code,
          expires_in: expiration,
        });
      } else if (doc?.expires_in > new Date(date)) {
        const remain = new Date(doc.expires_in.getTime() - date);
        let [remainMin, remainSec] = [
          remain.getUTCMinutes(),
          remain.getUTCSeconds(),
        ];
        const remainTime = `0${remainMin}:${remainSec < 10 ? `0${remainSec}` : remainSec}`;
        throw new ConflictException({
          message: ".کد تایید منقضی نشده است",
          remain_time: remainTime,
        });
      } else if (!doc?.mobile_verify) {
        doc.otp = code;
        doc.expires_in = expiration;
      } else {
        throw new ConflictException(".با این شماره تلفن قبلا ثبت نام کرده اید");
      } 
      doc.first_name = first_name
      doc.last_name = last_name
      await this.docRepository.save(doc);
    } else if (type === "user") {
      let user = await this.userRepository.findOneBy({ mobile: phoneNumber });
      if (!user) {
        user = this.userRepository.create({
          first_name,
          last_name,
          mobile: phoneNumber,
          otp: code,
          expires_in: expiration,
        });
      } else if (user?.expires_in > new Date(date)) {
        const remain = new Date(user.expires_in.getTime() - date);
        let [remainMin, remainSec] = [
          remain.getUTCMinutes(),
          remain.getUTCSeconds(),
        ];
        const remainTime = `0${remainMin}:${remainSec < 10 ? `0${remainSec}` : remainSec}`;
        throw new ConflictException({
          message: ".کد تایید منقضی نشده است",
          remain_time: remainTime,
        });
      } else if (!user?.mobile_verify) {
        user.otp = code;
        user.expires_in = expiration;
      } else {
        throw new ConflictException(".با این شماره تلفن قبلا ثبت نام کرده اید");
      }
      user.first_name = first_name
      user.last_name = last_name
      await this.userRepository.save(user);
    }
    return {
      message: "کد تایید ارسال شد.",
    };
  }

  async sendOtp(OtpDto: SendOtpDto, type: string) {
    const { mobile } = OtpDto;
    const { phoneNumber } = mobileValidation(mobile);
    const { code, expiration } = this.createOtp();
    const date = new Date().getTime();
    let exist = false;
    if (type === role.USER) {
      let user = await this.userRepository.findOneBy({ mobile: phoneNumber });
      if(user){
        exist = true;
        if (user?.expires_in > new Date(date)) {
          const remain = new Date(user.expires_in.getTime() - date);
          let [remainMin, remainSec] = [
            remain.getUTCMinutes(),
            remain.getUTCSeconds(),
          ];
          const remainTime = `0${remainMin}:${remainSec < 10 ? `0${remainSec}` : remainSec}`;
          throw new ConflictException({
            message: "کد تایید منقضی نشده است.",
            remain_time: remainTime,
          });
        }
        user.otp = code;
        user.expires_in = expiration;
        await this.userRepository.save(user);
      }
    }
    else if(type === role.DOCTOR) {
      let doc = await this.docRepository.findOneBy({ mobile: phoneNumber });
      if(doc){
        exist = true;
        if(!doc.Medical_License_number || !doc.image || !doc.national_code)
          throw new UnauthorizedException("شما ثبت نام خود را تکمیل نکرده اید")
        if (doc?.expires_in > new Date(date)) {
          const remain = new Date(doc.expires_in.getTime() - date);
          let [remainMin, remainSec] = [
            remain.getUTCMinutes(),
            remain.getUTCSeconds(),
          ];
          const remainTime = `0${remainMin}:${remainSec < 10 ? `0${remainSec}` : remainSec}`;
          throw new ConflictException({
            message: "کد تایید منقضی نشده است.",
            remain_time: remainTime,
          });
        }
        doc.otp = code;
        doc.expires_in = expiration;
        await this.docRepository.save(doc);
      }
    }
    if (!exist) {
      throw new NotFoundException("کاربر یافت نشد");
    }
    return {
      message: "کد تایید ارسال شد.",
    };
  }

  async checkOtp(otpDto: CheckOtpDto, type: string) {
    const { mobile, code } = otpDto;
    const { phoneNumber } = mobileValidation(mobile);
    let profile: object;
    if (type === "doctor") {
      profile = await this.docRepository.findOneBy({ mobile: phoneNumber });
    } else {
      profile = await this.userRepository.findOneBy({ mobile: phoneNumber });
    }
    const now = new Date();
    //@ts-ignore
    if (profile?.expires_in < now) {
      throw new UnauthorizedException("کد تایید نامعتبر میباشد.");
    }
    //@ts-ignore
    if (!profile || !profile?.otp) {
      throw new NotFoundException("کاربر یافت نشد.");
    }
    //@ts-ignore
    if (profile?.otp !== code) {
      throw new UnauthorizedException("کد تایید نامعتبر میباشد.");
    }
    //@ts-ignore
    if (!profile?.mobile_verify) {
      if (type === "doctor") {
          await this.docRepository.update(
            //@ts-ignore
          { id: profile.id },
          {
            mobile_verify: true,
          }
        );
      }else{
        await this.userRepository.update(
            //@ts-ignore
            { id: profile.id },
            {
                mobile_verify : true
            }
        )
      }
    }
    const { accessToken, refreshToken } = this.TokenGenerator({
      //@ts-ignore
      id: profile?.id, type, mobile: profile?.mobile,
    });
    return {
      accessToken,
      refreshToken,
      message: "با موفقیت وارد اکانت خود شدید.",
    };
  }

  TokenGenerator(payload: TokenPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: "30d",
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: "1y",
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  async validateAccessToken(token: string) {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
      let user: UserEntity;
      let doctor: DoctorEntity;
      if (typeof payload == "object" && payload?.id) {
        if (payload.type === "doctor") {
          doctor = await this.docRepository.findOneBy({
            mobile: payload.mobile,
          });
        } else {
          user = await this.userRepository.findOneBy({ id: payload.id });
        }
        if (!user && !doctor) {
          throw new UnauthorizedException("لطفا وارد اکانت خود شوید.");
        }
        return payload;
      }
      throw new UnauthorizedException("لطفا وارد اکانت خود شوید.");
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  async checkUserRole(request : Request) {
    const { type, mobile } = request.user
    let Role: string;
    if (type === "doctor") {
      const doc = await this.docRepository.findOneBy({ mobile });
      if(request.url === "/auth/change-role" || doc.role === role.ADMIN) Role = doc.role;
      else if(doc.status == statusEnum.PENDING || doc.status == statusEnum.REJECTED)
        throw new UnauthorizedException("حساب شما اجازه دسترسی به این بخش را ندارد (رد صلاحیت/تایید نشده)");
      else Role = doc.role;
    } else {
      const user = await this.userRepository.findOneBy({ mobile });
      Role = user.role;
    }
    if (!Role) return new UnauthorizedException("کاربر یافت نشد");
    return Role;
  }

  async setAdmin(payload : TokenPayload, value : string){
    const role = value["Role"]
    const { id, type } = payload
    if(type === role.USER){
      const user = await this.userRepository.findOneBy({id})
      user.role = role
      await this.userRepository.save(user)
    }else{
      const doc = await this.docRepository.findOneBy({id})
      doc.role = role
      await this.docRepository.save(doc)
    }
    return {message : `تغیر کرد ${role} وضعیت شما به `}
  }

  verifyRefreshToken(refreshToken: RefreshTokenDto) {
    const { RefreshToken } = refreshToken;
    try {
      const verify = this.jwtService.verify<TokenPayload>(RefreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });
      if (verify.mobile) {
        const { type, id, mobile } = verify;
        return this.TokenGenerator({ type, id, mobile });
      }
      throw new UnauthorizedException("رفرش توکن معبر وارد کنید");
    } catch (error) {
      throw new UnauthorizedException("رفرش توکن معبر وارد کنید");
    }
  }

  async profile(id: number, type: string) {
    let user: UserEntity;
    let doc: DoctorEntity;
    if (type === "user") {
      user = await this.userRepository.findOne({
        where: {
          id,
        },
        relations: { appointments: true },
      });
      return user;
    } else if (type === "doctor") {
      doc = await this.docRepository.findOne({
        where: {
          id,
        },
        relations: { appointments: true },
      });
      return doc;
    }
    throw new NotFoundException("پروفایل یافت نشد.");
  }
  
  async chargeWallet(id: number, type: string, chargeDto: ChargeDto) {
    if (type === "doctor")
      throw new UnauthorizedException("این بخش مختص کابران عادی میباشد.");
    const { amount } = chargeDto;
    if (+amount <= 5000)
      throw new ForbiddenException(
        "امکان شاژ کمتر از ۵۰۰۰ تومان ممکن نمیباشد."
      );
    const user = await this.userRepository.findOneBy({ id });
    user.wallet += +amount;
    await this.userRepository.save(user);
    return { message: "حساب شما با موفقیت شارژ شد." };
  }
}