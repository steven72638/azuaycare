import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Role]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'dev-secret',
        signOptions: { expiresIn: '1d' as const },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: getRepositoryToken(Usuario),
      useFactory: (dataSource: DataSource) => dataSource.getRepository(Usuario),
      inject: [DataSource],
    },
    {
      provide: getRepositoryToken(Role),
      useFactory: (dataSource: DataSource) => dataSource.getRepository(Role),
      inject: [DataSource],
    },
  ],
})
export class AuthModule {}
