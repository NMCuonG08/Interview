import { Route } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'store',
  },
  {
    path: 'store',
    loadComponent: () =>
      import('./pages/store/product-list.component').then(
        (m) => m.ProductListComponent
      ),
  },
  {
    path: 'store/:id',
    loadComponent: () =>
      import('./pages/store/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '**',
    redirectTo: 'store',
  },
];
