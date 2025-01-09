import { ConflictException, Injectable, NotFoundException, Request, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomInt} from "crypto";
import { CheckOtpDto, CreateOtpDto, RefreshTokenDto, RoleDto, SendOtpDto } from "./dto/auth.dto";
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "../users/entities/user.entity";
import { TokenPayload } from "src/common/types/payload";
import { DoctorEntity } from "../doctors/entities/doctor.entity";
import { mobileValidation } from "src/common/utility/mobile.utils";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity) private userRepository : Repository<UserEntity>,
        @InjectRepository(DoctorEntity) private docRepository : Repository<DoctorEntity>,
        private jwtService : JwtService
    ){}
    private createOtp(){
        let code = randomInt(10000 , 99999).toString()
        let expiration = new Date(new Date().getTime() + (1000*60 *10) )
        return {code , expiration}
    }
    async signup(OtpDto : CreateOtpDto, type : string){
        const {mobile, first_name, last_name} = OtpDto
        const { phoneNumber} = mobileValidation(mobile)
        const {code, expiration} = this.createOtp()
        if(type === "doctor"){
            let doc = await this.docRepository.findOneBy({mobile : phoneNumber})
            if(!doc){
                doc = this.docRepository.create({
                    first_name,
                    last_name,    
                    mobile : phoneNumber,
                    otp : code,
                    expires_in : expiration
                })
            }else if(doc?.expires_in > new Date(new Date().getTime())){
                throw new NotFoundException("otp code not expired")
            }else if(!doc?.mobile_verify){
                doc.otp = code
                doc.expires_in = expiration
            }else{
                throw new ConflictException("user already exist")
            }
            await this.docRepository.save(doc)
        }else if(type === "user"){
            let user = await this.userRepository.findOneBy({mobile : phoneNumber})
            if(!user || !user.mobile_verify){
                user = this.userRepository.create({
                    first_name,
                    last_name,    
                    mobile : phoneNumber,
                    otp : code,
                    expires_in : expiration
                })
                await this.userRepository.save(user)
            }else{
                throw new ConflictException("user already exist")
            }
        }
        return {
            message : "code sent"
        }
    }
    async sendOtp(OtpDto : SendOtpDto, ){
        const {mobile} = OtpDto
        const { phoneNumber} = mobileValidation(mobile)
        const {code, expiration} = this.createOtp()
        let user = await this.userRepository.findOneBy({mobile : phoneNumber})
        if(user){
            if(user?.expires_in > new Date(new Date().getTime())){
                throw new NotFoundException("otp code not expired")
            }
            user.otp = code;
            user.expires_in = expiration
            await this.userRepository.save(user)
        }
        let doc = await this.docRepository.findOneBy({mobile : phoneNumber})
        if(doc){
            if(doc?.expires_in > new Date(new Date().getTime())){
                throw new NotFoundException("otp code not expired")
            }
            doc.otp = code;
            doc.expires_in = expiration
            await this.docRepository.save(doc)
        }
        if(!user && !doc){
            throw new UnauthorizedException("user not found")
        }
        return {
            message : "code sent"
        }
    }
    async checkOtp(otpDto : CheckOtpDto, type : string){
        const { mobile , code } = otpDto
        const { phoneNumber } = mobileValidation(mobile)
        let profile : object;
        if(type === "doctor"){
            profile = await this.docRepository.findOneBy({mobile : phoneNumber})
        }else{
            profile = await this.userRepository.findOneBy({mobile : phoneNumber})
        }
        const now = new Date()
        //@ts-ignore
        if(profile?.expires_in < now ){
            throw new UnauthorizedException("code is expired")
        }
        //@ts-ignore
        if(!profile || !profile?.otp){
            throw new UnauthorizedException("user Not Found")
        }
        //@ts-ignore
        if(profile?.otp !== code){
            throw new UnauthorizedException("code is not correct")
        }
        //@ts-ignore
        if(!profile?.mobile_verify){
            if(type === "doctor"){
                //@ts-ignore
                await this.userRepository.update({id : profile.id}, {
                    mobile_verify : true
                })
            }
        }
        const { accessToken , refreshToken } = this.TokenGenerator({
            //@ts-ignore
            id : profile?.id , type , mobile : profile?.mobile
        })
        return {
            accessToken,
            refreshToken,
            message : "you logged in successfully"
        }
    }
    TokenGenerator(payload : TokenPayload){
        const accessToken = this.jwtService.sign(payload,{
            secret : process.env.ACCESS_TOKEN_SECRET,
            expiresIn : "30d"
        })
        const refreshToken = this.jwtService.sign(payload,{
            secret : process.env.REFRESH_TOKEN_SECRET,
            expiresIn : "1y"
        })
        return {
            accessToken,
            refreshToken
        }
    }
    async validateAccessToken(token : string){
        try {
            const payload = this.jwtService.verify<TokenPayload>(token,{secret : process.env.ACCESS_TOKEN_SECRET}) 
            let user : UserEntity;
            let doctor : DoctorEntity;
            if(typeof payload == "object" && payload?.id){
                if(payload.type === "doctor"){
                    doctor = await this.docRepository.findOneBy({mobile : payload.mobile})
                }else{
                    user = await this.userRepository.findOneBy({id : payload.id})
                }
                if(!user && !doctor){
                    throw new UnauthorizedException("login to your account")
                }
                return payload
            }
            throw new UnauthorizedException("login to your account")
        } catch (error) {
            throw new UnauthorizedException(error)
        }
        
    }
    async checkUserRole(mobile : string){
        const user = await this.userRepository.findOneBy({mobile})
        if(!user) return new UnauthorizedException("user not found")
        return user.role
    }
    // async setAdmin(roleData : RoleDto){
    //     const { role, mobile } = roleData
    //     const user = await this.userRepository.findOneBy({mobile})
    //     const doc = await this.docRepository.findOneBy({mobile})
    //     if(user){
    //         user.role.push(role) 
    //         await this.userRepository.save(user)
    //         return {
    //             message : `user ${user.first_name} ${user.last_name} with mobile : ${user.mobile} is now ${role}`
    //         }
    //     }
    //     if(doc){
    //         user.role.push(role) 
    //         await this.docRepository.save(doc)
    //         return {
    //             message : `user ${doc.first_name} ${doc.last_name} with mobile : ${doc.mobile} is now ${role}`
    //         }
    //     }
    // }
    verifyRefreshToken(refreshToken : RefreshTokenDto){
        const { RefreshToken } = refreshToken
        try {
            const verify = this.jwtService.verify<TokenPayload>(RefreshToken , {secret : process.env.REFRESH_TOKEN_SECRET})
            if(verify.mobile) {
                const { type, id, mobile } = verify
                return this.TokenGenerator({type, id, mobile})
            }
            throw new UnauthorizedException("please login your account")
        } catch (error) {
            throw new UnauthorizedException("please login your account")
        }
        
    }

}