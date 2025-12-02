import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  private authService = inject(AuthService);

  get currentYear(): number {
    return new Date().getFullYear();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}
