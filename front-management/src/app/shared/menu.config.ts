import { NavItem } from './types/nav-item.type';

/**
 * Navigation items for admin management header
 * Uses dropdown menus for parent items with children
 *
 * Permissions are matched against backend Permission model format: resource:action
 * Available resources: product, category, order, merchant, agency, user, staff, courier, role, system
 * Available actions: create, read, update, delete, update_status, manage_users, view_reports
 */
export const ADMIN_NAV_CONFIG: readonly NavItem[] = [
  {
    labelKey: 'admin.nav.dashboard',
    link: '/dashboard',
    icon: 'dashboard',
  },
  {
    labelKey: 'admin.nav.users',
    icon: 'users',
    // permission: { resource: 'system', action: 'manage_users' },
    children: [
      {
        labelKey: 'admin.nav.userList',
        link: '/users/list',
        // permission: { resource: 'user', action: 'read' },
      },
      {
        labelKey: 'admin.nav.staff',
        link: '/users/staff',
        // permission: { resource: 'staff', action: 'read' },
      },
      {
        labelKey: 'admin.nav.couriers',
        link: '/users/couriers',
        // permission: { resource: 'courier', action: 'read' },
      },
      {
        labelKey: 'admin.nav.roles',
        link: '/users/roles',
        // permission: { resource: 'role', action: 'read' },
      },
    ],
  },
  {
    labelKey: 'admin.nav.partners',
    icon: 'building',
    hiddenForRoles: ['MERCHANT_OWNER'],
    anyPermissions: [
      { resource: 'agency', action: 'read' },
      { resource: 'merchant', action: 'read' },
    ],
    children: [
      {
        labelKey: 'admin.nav.agencies',
        link: '/partners/agencies',
        permission: { resource: 'agency', action: 'read' },
      },
      {
        labelKey: 'admin.nav.brands',
        link: '/partners/brands',
        permission: { resource: 'agency', action: 'read' },
      },
      {
        labelKey: 'admin.nav.merchants',
        link: '/partners/merchants',
        permission: { resource: 'merchant', action: 'read' },
      },
      {
        labelKey: 'admin.nav.tags',
        link: '/partners/tags',
        permission: { resource: 'merchant', action: 'read' },
      },
    ],
  },
  {
    labelKey: 'admin.nav.products',
    icon: 'package',
    anyPermissions: [
      { resource: 'product', action: 'read' },
      { resource: 'category', action: 'read' },
    ],
    children: [
      {
        labelKey: 'admin.nav.categories',
        link: '/products/categories',
        permission: { resource: 'category', action: 'read' },
      },
      {
        labelKey: 'admin.nav.productList',
        link: '/products/list',
        permission: { resource: 'product', action: 'read' },
      },
      {
        labelKey: 'admin.nav.menu',
        link: '/products/menu',
        permission: { resource: 'product', action: 'read' },
      },
    ],
  },
  {
    labelKey: 'admin.nav.orders',
    link: '/orders',
    icon: 'shopping-cart',
    permission: { resource: 'order', action: 'read' },
  },
  {
    labelKey: 'admin.nav.marketing',
    icon: 'trending-up',
    permission: { resource: 'system', action: 'view_reports' },
    children: [
      {
        labelKey: 'admin.nav.promotions',
        link: '/marketing/promotions',
        permission: { resource: 'system', action: 'view_reports' },
      },
      {
        labelKey: 'admin.nav.shippingFees',
        link: '/marketing/shipping-fees',
        permission: { resource: 'system', action: 'view_reports' },
      },
      {
        labelKey: 'admin.nav.payments',
        link: '/marketing/payments',
        permission: { resource: 'system', action: 'view_reports' },
      },
    ],
  },
  {
    labelKey: 'admin.nav.reviews',
    link: '/reviews',
    icon: 'star',
    permission: { resource: 'system', action: 'view_reports' },
  },
  {
    labelKey: 'admin.nav.reports',
    icon: 'bar-chart',
    permission: { resource: 'system', action: 'view_reports' },
    children: [
      {
        labelKey: 'admin.nav.statistics',
        link: '/reports',
        permission: { resource: 'system', action: 'view_reports' },
      },
      {
        labelKey: 'admin.nav.export',
        link: '/reports/export',
        permission: { resource: 'system', action: 'view_reports' },
      },
    ],
  },
  {
    labelKey: 'admin.nav.notifications',
    link: '/notifications',
    icon: 'bell',
    permission: { resource: 'system', action: 'view_reports' },
  },
  {
    labelKey: 'admin.nav.settings',
    icon: 'settings',
    permission: { resource: 'system', action: 'view_reports' },
    children: [
      {
        labelKey: 'admin.nav.systemSettings',
        link: '/settings/general',
        permission: { resource: 'system', action: 'view_reports' },
      },
      {
        labelKey: 'admin.nav.auditLogs',
        link: '/settings/audit-logs',
        permission: { resource: 'system', action: 'view_reports' },
      },
    ],
  },
] as const;

/**
 * Sub-navigation for Partners page tabs
 */
export const PARTNERS_TAB_CONFIG: readonly NavItem[] = [
  {
    labelKey: 'admin.partners.tabs.agencies',
    link: '/partners/agencies',
    permission: { resource: 'agency', action: 'read' },
  },
  {
    labelKey: 'admin.partners.tabs.merchants',
    link: '/partners/merchants',
    permission: { resource: 'merchant', action: 'read' },
  },
] as const;
