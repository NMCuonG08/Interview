import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CartService } from './shared/services/cart.service';
import { AuthService } from '@vhandelivery/shared-ui';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly cartService = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly itemCount = this.cartService.itemCount;
  readonly cartLabel = computed(() =>
    this.itemCount() > 99 ? '99+' : `${this.itemCount()}`
  );
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly currentUser = this.auth.currentUser;

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/store']));
  }
}
