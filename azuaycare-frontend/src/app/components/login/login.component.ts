import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

const GOOGLE_CLIENT_ID = '474214477775-havio993ai951vg8511jfrtovtb66cjc.apps.googleusercontent.com';
const BACKEND_LOGIN_URL = 'http://localhost:3000/auth/login-google';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  vistaActual = signal<string>('principal');
  isLoading = signal<boolean>(false);
  error = signal<string>('');

  correoLogin = signal<string>('');
  contrasenaLogin = signal<string>('');

  correoPersonal = signal<string>('');
  codigoIngresado = signal<string>('');

  correoInstitucionalGenerado = signal<string>('');
  contrasenaGenerada = signal<string>('');

  ngOnInit() {
    this.loadGoogleScript();
  }

  private loadGoogleScript() {
    if ((window as any).google?.accounts?.id) {
      this.initGsi();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initGsi();
    script.onerror = () => this.error.set('No se pudo cargar Google Identity Services');
    document.head.appendChild(script);
  }

  private initGsi() {
    try {
      const google = (window as any).google;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => this.handleCredentialResponse(response),
        cancel_on_tap_outside: true,
      });
    } catch {
      this.error.set('Error inicializando Google Identity Services');
    }
  }

  loginConGoogle() {
    this.error.set('');
    this.isLoading.set(true);
    this.signInWithGoogle();
  }

  private signInWithGoogle() {
    try {
      const google = (window as any).google;
      if (!google?.accounts?.id) {
        throw new Error('Google Identity Services no está listo');
      }

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          this.error.set('No se pudo iniciar el flujo de Google. Inténtalo de nuevo.');
          this.isLoading.set(false);
        }
      });
    } catch (err: any) {
      this.error.set(err?.message ?? String(err));
      this.isLoading.set(false);
    }
  }

  private async handleCredentialResponse(response: any) {
    const credential: string | undefined = response?.credential;
    if (!credential) {
      this.error.set('No se recibió token de Google');
      this.isLoading.set(false);
      return;
    }

    try {
      const data = await this.auth.loginWithBackend(credential, BACKEND_LOGIN_URL);
      await this.router.navigate(['/home']);
    } catch (err: any) {
      this.error.set(err?.message ?? String(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  iniciarSesionTradicional() {
    const correo = this.correoLogin().trim();
    const contrasena = this.contrasenaLogin().trim();

    if (!correo || !contrasena) {
      this.error.set('Por favor, llena todos los campos.');
      return;
    }

    const dominioValido = correo.endsWith('@tecazuay.edu.ec');
    if (!dominioValido) {
      this.error.set('Usa un correo institucional @tecazuay.edu.ec');
      return;
    }

    const passwordValida = this.validarContrasena(contrasena);
    if (!passwordValida) {
      this.error.set('La contraseña debe tener exactamente 8 caracteres, incluida una mayúscula, una minúscula, un número y un carácter especial.');
      return;
    }

    this.error.set('El inicio de sesión tradicional aún no está habilitado. Usa Google.');
  }

  enviarCodigoVerificacion() {
    const correo = this.correoPersonal().trim();
    if (!correo || !correo.endsWith('@gmail.com')) {
      alert('Por favor, ingresa un correo personal válido de Gmail.');
      return;
    }

    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.vistaActual.set('paso2');
    }, 1200);
  }

  verificarCodigo() {
    if (this.codigoIngresado().trim() !== '123456') {
      this.error.set('Código incorrecto. Usa "123456" para las pruebas.');
      return;
    }

    const nombreUsuario = this.correoPersonal().split('@')[0].toLowerCase();
    this.correoInstitucionalGenerado.set(`${nombreUsuario}@tecazuay.edu.ec`);
    this.contrasenaGenerada.set(this.generarContrasenaSegura());
    this.error.set('');
    this.vistaActual.set('paso3');
  }

  generarContrasenaSegura(): string {
    const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const minusculas = 'abcdefghijkmnopqrstuvwxyz';
    const numeros = '23456789';
    const especiales = '!@#$%&*?_';

    let password = '';
    password += mayusculas.charAt(Math.floor(Math.random() * mayusculas.length));
    password += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
    password += numeros.charAt(Math.floor(Math.random() * numeros.length));
    password += especiales.charAt(Math.floor(Math.random() * especiales.length));

    const combinacionTotal = mayusculas + minusculas + numeros + especiales;
    for (let i = 0; i < 4; i++) {
      password += combinacionTotal.charAt(Math.floor(Math.random() * combinacionTotal.length));
    }

    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  validarContrasena(contrasena: string): boolean {
    return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%&*?_])[A-Za-z\d!@#$%&*_?]{8}$/.test(contrasena);
  }

  volverAlLogin() {
    this.vistaActual.set('principal');
    this.correoPersonal.set('');
    this.codigoIngresado.set('');
    this.error.set('');
  }
}
