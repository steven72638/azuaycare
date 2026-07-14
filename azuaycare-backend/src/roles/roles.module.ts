import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Role } from './entities/role.entity';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Usuario])],
  controllers: [RolesController],
  providers: [
    RolesService,
    {
      provide: getRepositoryToken(Role),
      useFactory: (dataSource: DataSource) => dataSource.getRepository(Role),
      inject: [DataSource],
    },
    {
      provide: getRepositoryToken(Usuario),
      useFactory: (dataSource: DataSource) => dataSource.getRepository(Usuario),
      inject: [DataSource],
    },
  ],
  exports: [TypeOrmModule, RolesService],
})
export class RolesModule {}