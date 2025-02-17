import { BadRequestException } from "@nestjs/common"
import { appendFileSync, readFileSync, writeFileSync } from "fs"
import { PaginationDto } from "../dto/pagination.dto"

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
export function updateJson(slug : string, new_slug : string = undefined, new_title : string = undefined){
    new_title = `"${new_title.trim()}"`
    const categoryItems = readFileSync('./src/common/json/category.txt', 'utf-8')
    .split(',')
    .map(value => {
        let list = value.split("=").map(word => word.replace('\n',''))
        if(list[0].trim().toLowerCase() === slug){
            list[0] = new_slug.toUpperCase() || slug.toUpperCase()
            new_title.length > 2 ? list[1] = new_title : list[1] = list[1] 
        }
        return list
    }) 
    categoryItems.length -= 1
    writeFileSync('./src/common/json/category.txt','')
    for (const element of categoryItems) {
        appendFileSync('./src/common/json/category.txt',`${element[0]}=${element[1]},\n`,'utf-8')
    }
    const newCategoryItems = readFileSync('./src/common/json/category.txt', 'utf-8')
    writeFileSync('./src/common/enums/category.enum.ts',`export enum categoryEnum {\n${newCategoryItems}\n}`)
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
export function pagination(paginationDto : PaginationDto){
    let { limit, page } = paginationDto
    if(!limit || limit < 10 ) limit = 10
    else if(limit > 100) limit = 100
    if(!page || page <= 1 ) page = 0
    else if(page > 1) page -= 1
    return {
        page,
        limit,
        skip : page * limit
    }
}
export function PaginationGenerator(
    page : number,
    limit : number,
    count : number,
){
    return {
        total_count : count,
        page,
        limit,
        skip : page * limit,
    }
}