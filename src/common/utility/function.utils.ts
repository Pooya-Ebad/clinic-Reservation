import { BadRequestException, ConflictException, InternalServerErrorException } from "@nestjs/common"
import { appendFile, appendFileSync, existsSync, readFileSync, writeFileSync } from "fs"

export function isBoolean(value : any){
    return [true , "true", "True", false , "false", "False"].includes(value)
}
export function toBoolean(value : any){
    return [true , "true", "True"].includes(value) ? true :
        [false , "false", "False", ""].includes(value) ? false :
        value
}
export function toMG(value : number){
    return (value * 1024 * 1024)
}
export function categoryJson(slug : string, title : string){
    try {
        appendFileSync('./src/common/json/category.txt',`${slug.toUpperCase()} = "${title}",\n`,'utf-8')
        const categoryItems = readFileSync('./src/common/json/category.txt', 'utf-8')
        writeFileSync('./src/common/enums/category.enum.ts',`export enum categoryEnum {\n${categoryItems}\n}`)
    } catch (error) {
        return {message : error}
    }
    
}
export function checkTime(VisitList : string[], newTime : string, value : number){
    if(!toBoolean(newTime)) return false
    const [hour, min] = newTime.split(':').map(time=> +time)
    const setVisitTime = new Date().setUTCHours(hour,min,0,0)
    for(let time of VisitList){
        let [scheduleHour, scheduleMin] = time.split(':').map(time=> +time)
        const setScheduleTime = new Date().setUTCHours(scheduleHour,scheduleMin,0,0)
        if(scheduleHour === hour || scheduleHour === hour + 1){
            let subtract = setVisitTime -setScheduleTime
            if(Math.abs(subtract) < value * 60 * 1000){
                throw new BadRequestException(`هر ویزیت نمیتواند کمتر از ${value} دقیقه باشد.`)
            }
        }
    }
}