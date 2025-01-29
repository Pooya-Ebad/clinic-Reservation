import { EntityName } from "src/common/enums/entities.enum";
import { role } from "src/common/enums/role.enum";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, } from "typeorm";
import { AppointmentEntity } from "./appointment.entity";

@Entity(EntityName.User)
export class UserEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;
  @Column()
  first_name: string;
  @Column()
  last_name: string;
  @Column({ unique: true })
  mobile: string;
  @Column({ default: 0 })
  wallet: number;
  @Column({ default: false })
  mobile_verify: boolean;
  @Column({ default: role.USER })
  role: string;
  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
  @Column({ nullable: true })
  otp: string;
  @Column({ nullable: true })
  expires_in: Date;
  @OneToMany(() => AppointmentEntity, (appointment) => appointment.user)
  appointments: AppointmentEntity[];
}
