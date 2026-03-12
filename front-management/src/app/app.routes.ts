import { Route } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { withPermissions } from './shared/guards/permission.guard';

// Helper to load under development component
const loadUnderDevelopment = () =>
  import('./pages/under-development/under-development.component').then(
    (m) => m.UnderDevelopmentComponent
  );

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },

      // User Management
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users-layout/users-layout.component').then(
            (m) => m.UsersLayoutComponent
          ),
        // canActivate: [withPermissions('user:read')],
        children: [
          {
            path: 'list',
            loadComponent: loadUnderDevelopment,
            // canActivate: [withPermissions('user:read')],
          },
          {
            path: 'staff',
            loadComponent: loadUnderDevelopment,
            // canActivate: [withPermissions('staff:read')],
          },
          {
            path: 'couriers',
            loadComponent: () =>
              import(
                './pages/users/couriers/pending-courier-approvals.component'
              ).then((m) => m.PendingCourierApprovalsComponent),
            canActivate: [withPermissions('courier:read')],
          },
          {
            path: 'roles',
            loadComponent: loadUnderDevelopment,
            // canActivate: [withPermissions('role:read')],
          },
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full',
          },
        ],
      },

      // Partners
      {
        path: 'partners',
        loadComponent: () =>
          import(
            './pages/partners/partners-layout/partners-layout.component'
          ).then((m) => m.PartnersLayoutComponent),
        canActivate: [withPermissions('agency:read', 'merchant:read')],
        children: [
          {
            path: 'agencies',
            loadComponent: () =>
              import('./pages/partners/agencies/agencies.component').then(
                (m) => m.AgenciesComponent
              ),
            canActivate: [withPermissions('agency:read')],
          },
          {
            path: 'brands',
            loadComponent: loadUnderDevelopment,
            canActivate: [withPermissions('agency:read')],
          },
          {
            path: 'merchants',
            loadComponent: () =>
              import('./pages/partners/merchants/merchants.component').then(
                (m) => m.MerchantsComponent
              ),
            canActivate: [withPermissions('merchant:read')],
          },
          {
            path: 'tags',
            loadComponent: loadUnderDevelopment,
            canActivate: [withPermissions('merchant:read')],
          },
          {
            path: '',
            redirectTo: 'agencies',
            pathMatch: 'full',
          },
        ],
      },

      // Products & Categories
      {
        path: 'products',
        loadComponent: () =>
          import(
            './pages/products/products-layout/products-layout.component'
          ).then((m) => m.ProductsLayoutComponent),
        canActivate: [withPermissions('category:read', 'product:read')],
        children: [
          {
            path: 'categories',
            loadComponent: () =>
              import('./pages/categories/categories.component').then(
                (m) => m.CategoriesComponent
              ),
            canActivate: [withPermissions('category:read')],
          },
          {
            path: 'list',
            loadComponent: loadUnderDevelopment,
            canActivate: [withPermissions('product:read')],
          },
          {
            path: 'menu',
            loadComponent: loadUnderDevelopment,
            canActivate: [withPermissions('product:read')],
          },
          {
            path: '',
            redirectTo: 'categories',
            pathMatch: 'full',
          },
        ],
      },

      // Orders
      {
        path: 'orders',
        loadComponent: loadUnderDevelopment,

        canActivate: [withPermissions('order:read')],
      },

      // Marketing & Finance
      {
        path: 'marketing',
        loadComponent: () =>
          import(
            './pages/marketing/marketing-layout/marketing-layout.component'
          ).then((m) => m.MarketingLayoutComponent),
        canActivate: [withPermissions('system:view_reports')],
        children: [
          {
            path: 'promotions',
            loadComponent: loadUnderDevelopment,
            canActivate: [withPermissions('system:view_reports')],
          },
          {
            path: 'shipping-fees',
            loadComponent: loadUnderDevelopment,
            canActivate: [withPermissions('system:view_reports')],
          },
          {
            path: 'payments',
            loadComponent: loadUnderDevelopment,
            canActivate: [withPermissions('system:view_reports')],
          },
          {
            path: '',
            redirectTo: 'promotions',
            pathMatch: 'full',
          },
        ],
      },

      // Reviews
      {
        path: 'reviews',
        loadComponent: loadUnderDevelopment,
        canActivate: [withPermissions('system:view_reports')],
      },

      // Reports
      {
        path: 'reports',
        loadComponent: loadUnderDevelopment,

        canActivate: [withPermissions('system:view_reports')],
      },
      {
        path: 'reports/export',
        loadComponent: loadUnderDevelopment,
        canActivate: [withPermissions('system:view_reports')],
      },

      // Notifications
      {
        path: 'notifications',
        loadComponent: loadUnderDevelopment,
        canActivate: [withPermissions('system:view_reports')],
      },

      // Settings
      {
        path: 'settings',
        loadComponent: () =>
          import(
            './pages/settings/settings-layout/settings-layout.component'
          ).then((m) => m.SettingsLayoutComponent),
        canActivate: [withPermissions('system:view_reports')],
        children: [
          {
            path: 'general',
            loadComponent: loadUnderDevelopment,
            canActivate: [withPermissions('system:view_reports')],
          },
          {
            path: 'audit-logs',
            loadComponent: () =>
              import('./pages/audit-logs/audit-logs.component').then(
                (m) => m.AuditLogsComponent
              ),
            canActivate: [withPermissions('system:view_reports')],
          },
          {
            path: '',
            redirectTo: 'general',
            pathMatch: 'full',
          },
        ],
      },

      // Default redirect
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
