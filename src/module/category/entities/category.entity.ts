import { EntityName } from "src/common/enums/entities.enum";
import { ClinicEntity } from "src/module/clinic/entity/clinic.entity";
import { DoctorEntity } from "src/module/doctors/entities/doctor.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity(EntityName.Categories)
export class CategoryEntity {
    @PrimaryGeneratedColumn("increment")
    id : number
    @Column()
    title : string
    @Column({unique : true})
    slug : string
    @Column({nullable : true})
    image : string
    @Column({nullable : true})
    description : string
    @Column({default : true})
    show : boolean
    @Column({nullable : true})
    parentId : number
    @ManyToOne(()=> CategoryEntity , category => category.children)
    parent : CategoryEntity
    @OneToMany(()=> CategoryEntity , category => category.parent)
    children : CategoryEntity[]
    @OneToMany(()=> DoctorEntity , doc => doc.category)
    doctors : DoctorEntity[]
    @OneToMany(()=> ClinicEntity , clinic => clinic.category)
    Clinics : ClinicEntity[]
}
