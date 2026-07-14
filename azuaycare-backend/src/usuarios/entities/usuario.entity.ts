import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

@Entity({ name: 'usuarios' })
export class Usuario {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ name: 'email_institucional', unique: true, nullable: false })
  email_institucional: string;

  @Column({ name: 'primer_nombre', nullable: false })
  primer_nombre: string;

  @Column({ name: 'primer_apellido', nullable: false })
  primer_apellido: string;

  @Column({ name: 'segundo_nombre', nullable: true })
  segundo_nombre?: string;

  @Column({ name: 'segundo_apellido', nullable: true })
  segundo_apellido?: string;

  @Column({ unique: true, nullable: true })
  cedula?: string;

  @ManyToOne(() => Role, (role) => role.usuarios, { eager: true })
  @JoinColumn({ name: 'rol_id' })
  rol: Role;
}
