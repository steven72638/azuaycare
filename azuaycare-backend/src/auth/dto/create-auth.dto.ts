import { IsNotEmpty, IsString } from 'class-validator';

export class LoginGoogleDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class CreateAuthDto extends LoginGoogleDto {}
