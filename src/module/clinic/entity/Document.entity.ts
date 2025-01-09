import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {ClinicEntity} from "./clinic.entity";

@Entity("clinic_document")
export class ClinicDocumentEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;
  @Column()
  license: string;
  @Column({type: "enum", enum: {"Rental": "rental", "Owner" : "owner"}})
  location_type: string;
  @Column()
  tel_1: string;
  @Column()
  tel_2: string;
  @Column()
  clinicId: number;
  @Column({nullable: true})
  rent_agreement: string;
  @Column()
  clinic_images: string;
  @OneToOne(() => ClinicEntity, (clinic) => clinic.documents, {
    onDelete: "CASCADE",
  })
  clinic: ClinicEntity;
}