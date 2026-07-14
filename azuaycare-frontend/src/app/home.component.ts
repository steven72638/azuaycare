import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './azuaycare.html',
})
export class HomeComponent {
  auth = inject(AuthService);
  router = inject(Router);

  logout() {
    this.auth.logout();
    void this.router.navigate(['']);
  }
}
