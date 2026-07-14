import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    {
      provide: getRepositoryToken(Usuario),
      useFactory: (dataSource: DataSource) => dataSource.getRepository(Usuario),
      inject: [DataSource],
    },
  ],
  exports: [TypeOrmModule, UsuariosService],
})
export class UsuariosModule {}