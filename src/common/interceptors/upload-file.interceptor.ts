import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

export function UploadFileS3(fieldName : string, max : number = 1){
    return class UploadUtility extends FilesInterceptor(fieldName, max,{
        storage : memoryStorage(),
    }){}
}