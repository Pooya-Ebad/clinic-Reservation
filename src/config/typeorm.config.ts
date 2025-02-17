import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm"
export class TypeOrmConfig implements TypeOrmOptionsFactory{
    createTypeOrmOptions(connectionName?: string): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    const { DB_HOST,DB_NAME,DB_PASSWORD,DB_PORT,DB_USERNAME } = process.env
    return {
        type: "mysql",
        host : DB_HOST,
        port : DB_PORT,
        database : DB_NAME,
        username : DB_USERNAME,
        password : DB_PASSWORD,
        synchronize : false,
        // dropSchema : true,
        entities: [ 
            "dist/**/**/**/*.entity.{ts,js}",
            "dist/**/**/*.entity.{ts,js}",
          ],
        
        }  
    }   
}    