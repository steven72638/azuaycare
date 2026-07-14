import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { LoginGoogleDto } from './dto/login-google.dto';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly jwtService: JwtService,
  ) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new InternalServerErrorException(
        'Falta la configuración GOOGLE_CLIENT_ID en las variables de entorno.',
      );
    }

    this.googleClient = new OAuth2Client(googleClientId);
  }

  async loginWithGoogle(loginGoogleDto: LoginGoogleDto) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: loginGoogleDto.token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload?.email || !payload.sub) {
        throw new UnauthorizedException('Token de Google inválido o expirado.');
      }

      const email = payload.email.toLowerCase();
      if (!email.endsWith('@tecazuay.edu.ec')) {
        throw new UnauthorizedException(
          'Acceso denegado. Solo se permiten correos institucionales @tecazuay.edu.ec',
        );
      }

      let usuario = await this.usuariosRepository.findOne({
        where: { email_institucional: email },
        relations: { rol: true },
      });

      if (!usuario) {
        usuario = await this.usuariosRepository.findOne({
          where: { id: payload.sub },
          relations: { rol: true },
        });
      }

      if (!usuario) {
        const rolEstudiante = await this.rolesRepository.findOne({
          where: { id: 3 },
        });
        if (!rolEstudiante) {
          throw new InternalServerErrorException(
            'El rol ESTUDIANTE (ID 3) no está inicializado en la base de datos.',
          );
        }

        usuario = this.usuariosRepository.create({
          id: payload.sub,
          email_institucional: email,
          primer_nombre: payload.given_name ?? 'Estudiante',
          primer_apellido: payload.family_name ?? 'Azuay',
          rol: rolEstudiante,
        });

        await this.usuariosRepository.save(usuario);
      }

      const accessToken = this.jwtService.sign({
        sub: usuario.id,
        email: usuario.email_institucional,
        rol: usuario.rol?.nombre ?? 'ESTUDIANTE',
      });

      return {
        message: 'Autenticación exitosa',
        accessToken,
        usuario: {
          id: usuario.id,
          email: usuario.email_institucional,
          nombre: `${usuario.primer_nombre} ${usuario.primer_apellido}`,
          rol: usuario.rol?.nombre ?? 'ESTUDIANTE',
        },
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new UnauthorizedException(
        `Error durante la verificación con Google: ${message}`,
      );
    }
  }
}
