import { InternalServerErrorException } from "@nestjs/common"
import { appendFile, appendFileSync, existsSync, readFileSync, writeFileSync } from "fs"

export function isBoolean(value : any){
    return [true , "true", "True", false , "false", "False"].includes(value)
}
export function toBoolean(value : any){
    return [true , "true", "True"].includes(value) ? true :
        [false , "false", "False"].includes(value) ? false :
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