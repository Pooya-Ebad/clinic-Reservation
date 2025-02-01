import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { categoryEnum } from "src/common/enums/category.enum";
import { statusEnum } from "src/common/enums/status.enum";
import { DoctorEntity } from "src/module/doctors/entities/doctor.entity";
import { ClinicDocumentEntity } from "./Document.entity";
import { CategoryEntity } from "src/module/category/entities/category.entity";

@Entity("clinic")
export class ClinicEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;
  @Column()
  name: string;
  @Column()
  categoryId: Number;
  @Column({unique: true})
  slug: string;
  @Column({type: "enum", enum: statusEnum, default: statusEnum.PENDING})
  status: string;
  @Column()
  manager_name: string;
  @Column()
  manager_mobile: string;
  @Column({nullable: true})
  reason: string;
  @Column({nullable: true})
  statusCheck_at: Date;
  @Column({nullable: true})
  disQualified_at: Date;
  @Column()
  province: string;
  @Column()
  city: string;
  @Column()
  address: string;
  @Column({default : 0})
  doctorsCount: number;
  @Column({nullable: true, unique: true})
  documentsId: number;
  @OneToMany(() => DoctorEntity, (doctor) => doctor.clinic)
  doctors: DoctorEntity[];
  @OneToOne(() => ClinicDocumentEntity, (doc) => doc.clinic)
  @JoinColumn()
  documents: ClinicDocumentEntity;
  @OneToOne(() => CategoryEntity, (category) => category.Clinics)
  @JoinColumn()
  category : CategoryEntity;
  @CreateDateColumn()
  created_at: Date;
}