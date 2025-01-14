import { WeekDays } from "src/common/enums/week.days.enum";
import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { DoctorEntity } from "./doctor.entity";

@Entity('schedule')
export class ScheduleEntity{
    @PrimaryGeneratedColumn('increment')
    id : number
    @Column({type : 'enum',enum : WeekDays})
    day : string
    @Column()
    visitTime : string
    @Column()
    doctorId : number
    @ManyToOne(()=> DoctorEntity, doc=>{doc.schedules}, {onDelete : 'CASCADE'})
    doctor : DoctorEntity
}