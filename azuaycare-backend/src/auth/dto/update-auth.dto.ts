import { PartialType } from '@nestjs/mapped-types';
import { LoginGoogleDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(LoginGoogleDto) {}
