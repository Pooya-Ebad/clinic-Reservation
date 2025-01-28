import {
  AppointmentStatusEnum
} from "src/common/enums/status.enum";
import { DoctorEntity } from "src/module/doctors/entities/doctor.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";

@Entity("appointment")
export class AppointmentEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;
  @Column()
  doctorId: number;
  @Column()
  userId: number;
  @Column()
  Visit_Date: string;
  @Column()
  price: string;
  @Column({
    type: "enum",
    enum: AppointmentStatusEnum,
    default: AppointmentStatusEnum.pending,
  })
  status: string;
  @CreateDateColumn()
  created_at: Date;
  @Column({ default: false })
  payment: boolean;
  @Column({ nullable: true })
  payment_date: Date;
  @ManyToOne(() => DoctorEntity, (doctor) => doctor.appointments, {
    onDelete: "CASCADE",
  })
  doctor: DoctorEntity;
  @ManyToOne(() => UserEntity, (user) => user.appointments, {
    onDelete: "CASCADE",
  })
  user: UserEntity;
}
