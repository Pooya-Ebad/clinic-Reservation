import { categoryEnum } from "src/common/enums/category.enum";
import { EntityName } from "src/common/enums/entities.enum";
import { role } from "src/common/enums/role.enum";
import { statusEnum } from "src/common/enums/status.enum";
import { ClinicEntity } from "src/module/clinic/entity/clinic.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity(EntityName.Doc)
export class DoctorEntity {
    @PrimaryGeneratedColumn("increment")
    id : number
    @Column()
    first_name : string
    @Column()
    last_name : string
    @Column({unique : true})
    mobile : string
    @Column({default : false})
    mobile_verify : boolean
    @Column({nullable : true})
    category : string
    @Column({unique : true,nullable : true})
    Medical_License_number : string
    @Column({unique : true,nullable : true})
    national_code : string
    @Column({nullable : true})
    description : string
    @Column({type : "enum", enum : statusEnum ,default : statusEnum.PENDING})
    status : string
    @Column({default : role.USER})
    role : string
    @CreateDateColumn()
    created_at : Date
    @UpdateDateColumn()
    updated_at : Date
    @Column({nullable : true})
    otp : string
    @Column({nullable : true})
    expires_in : Date
    @Column({nullable : true})
    image : string
    @Column({nullable : true})
    clinicId : number
    @ManyToOne(()=> ClinicEntity, (clinic)=>{clinic.doctors},{onDelete : "SET NULL"})
    clinic : ClinicEntity
}