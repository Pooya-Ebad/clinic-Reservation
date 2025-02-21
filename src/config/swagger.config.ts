import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { SecuritySchemeObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";

export function SwaggerConfig(app : INestApplication) : void{
    const document = new DocumentBuilder()
    .setVersion('1.0.0')
    .setTitle("Clinic reservation")
    .setExternalDoc("Git-Hub", "https://github.com/Pooya-Ebad/clinic-Reservation")
    .setContact("Pooya", "", "pooya7009@gmail.com")
    .setDescription("Online clinic reservation for patients. To access most sections, change your status to admin after logging in throw the Auth section."
        )
    .addTag("Search")
    .addTag("Auth")
    .addTag("Users")
    .addTag("Doctors")
    .addTag("Clinic")
    .addBearerAuth(swaggerAuthConfig(), "Authorization")
    .build()
    const swaggerDocument = SwaggerModule.createDocument(app , document)
    SwaggerModule.setup("/swagger" , app , swaggerDocument)

}
function swaggerAuthConfig() : SecuritySchemeObject {
    return{
        type : "http",
        bearerFormat : "JWT",
        in : "header",
        scheme : "bearer",
        
    }
}