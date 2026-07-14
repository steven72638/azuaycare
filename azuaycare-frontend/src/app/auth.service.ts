import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'azuaycare_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  token = signal<string | null>(null);
  user = signal<any | null>(null);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const t = localStorage.getItem(STORAGE_KEY);
    if (t) {
      this.setToken(t);
    }
  }

  setToken(token: string | null) {
    this.token.set(token);
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
      this.decodeAndSetUser(token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      this.user.set(null);
    }
  }

  isLoggedIn() {
    return !!this.token();
  }

  logout() {
    this.setToken(null);
  }

  private decodeAndSetUser(token: string) {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return this.user.set(null);
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const obj = JSON.parse(json);
      this.user.set(obj);
    } catch {
      this.user.set(null);
    }
  }

  async loginWithCredentials(username: string, password: string, career?: string) {
    const normalized = username.trim().toLowerCase();
    const accounts = [
      { name: 'Bienestar Estudiantil', email: 'admin', password: 'admin', role: 'admin' },
      { name: 'Coordinador de Carrera', email: 'coordinador', password: 'coordinador', role: 'coordinator' },
      { name: 'Estudiante Institucional', email: 'estudiante', password: 'cualquiera', role: 'student' },
    ];

    const account = accounts.find(
      (acct) =>
        acct.email === normalized ||
        `${acct.email}@tecnologicoazuay.edu.ec` === normalized ||
        `${acct.email}@tecnologicoazuay.edu` === normalized,
    );

    if (!account) {
      throw new Error('Usuario o contraseña inválidos. Use admin/admin, coordinador/coordinador o estudiante/cualquiera.');
    }

    if (account.password !== 'cualquiera' && password !== account.password) {
      throw new Error('Usuario o contraseña inválidos. Use admin/admin, coordinador/coordinador o estudiante/cualquiera.');
    }

    const payload = btoa(JSON.stringify({ nombre: account.name, email: account.email, role: account.role, career: career || 'No asignada' }));
    const token = `demo.${payload}.signature`;
    this.setToken(token);
    return { accessToken: token };
  }

  async loginWithBackend(googleIdToken: string, backendUrl = 'http://localhost:3000/auth/login-google') {
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: googleIdToken }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || 'Error autenticando con backend');
    }

    const data = await res.json();
    if (data?.accessToken) {
      this.setToken(data.accessToken);
    }
    return data;
  }
}
