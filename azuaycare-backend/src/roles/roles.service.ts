import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  // Este método se ejecuta automáticamente cuando arranca el servidor de NestJS
  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.seedAdmin();
  }

  private async seedRoles() {
    const rolesPredefinidos = [
      { id: 1, nombre: 'COORDINADOR_BIENESTAR' },
      { id: 2, nombre: 'COORDINADOR_CARRERA' },
      { id: 3, nombre: 'ESTUDIANTE' },
    ];

    for (const rol of rolesPredefinidos) {
      const existe = await this.rolesRepository.findOne({
        where: { id: rol.id },
      });
      if (!existe) {
        const nuevoRol = this.rolesRepository.create(rol);
        await this.rolesRepository.save(nuevoRol);
        console.log(`[Seed] Rol creado: ${rol.nombre}`);
      }
    }
  }

  private async seedAdmin() {
    // Definimos el correo y el ID manual para el administrador supremo
    const adminEmail = 'admin.bienestar@tecazuay.edu.ec';
    const adminId = 'admin-supremo-uuid-fijo'; // Puedes usar un UUID o string único para su cuenta

    const existeAdmin = await this.usuariosRepository.findOne({
      where: { email_institucional: adminEmail },
    });

    if (!existeAdmin) {
      const rolAdmin = await this.rolesRepository.findOne({ where: { id: 1 } }); // COORDINADOR_BIENESTAR

      if (rolAdmin) {
        const nuevoAdmin = this.usuariosRepository.create({
          id: adminId,
          email_institucional: adminEmail,
          primer_nombre: 'Administrador',
          primer_apellido: 'General',
          segundo_nombre: 'Bienestar',
          segundo_apellido: 'AzuayCare',
          cedula: '0101010101', // Cédula de prueba o real del administrador
          rol: rolAdmin,
        });

        await this.usuariosRepository.save(nuevoAdmin);
        console.log(
          `[Seed] Administrador supremo creado con éxito: ${adminEmail}`,
        );
      }
    }
  }

  // Métodos estándar de Nest para que no den error si se llaman en el futuro
  findAll() {
    return this.rolesRepository.find();
  }

  findOne(id: number) {
    return this.rolesRepository.findOne({ where: { id } });
  }

  create(createRoleDto: unknown) {
    void createRoleDto;
    return 'This action adds a new role';
  }

  update(id: number, updateRoleDto: unknown) {
    void updateRoleDto;
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    void id;
    return `This action removes a #${id} role`;
  }
}
