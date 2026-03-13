import {
  TableConfig,
  TableHeaderConfig,
} from '../../../shared/interfaces/table.interface';
import { Merchant } from '../../../shared/interfaces/merchant.interface';
import { StatisticCardConfig } from '../../../shared/interfaces/statistic-card-config.interface';

/**
 * Statistics data interface for merchants
 */
export interface MerchantStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

/**
 * Generate statistic cards configuration from API data
 */
export function createMerchantStatisticCards(
  stats: MerchantStatistics,
  formatNumber: (value: number) => string
): StatisticCardConfig[] {
  return [
    {
      value: formatNumber(stats.totalApproved),
      labelKey: 'admin.partners.merchants.stats.totalStores',
      icon: 'assets/icons/icon-stat-store.svg',
      variant: 'primary',
      trend: {
        value: '+12.5%',
        direction: 'up',
        labelKey: 'admin.partners.stats.comparedToLastMonth',
      },
    },
    {
      value: formatNumber(stats.totalPending),
      labelKey: 'admin.partners.merchants.stats.pendingApproval',
      icon: 'assets/icons/icon-stat-bell.svg',
      variant: 'error',
      subtitleKey: 'admin.partners.stats.needsProcessing',
    },
    {
      value: formatNumber(stats.totalActive),
      labelKey: 'admin.partners.merchants.stats.activeStores',
      icon: 'assets/icons/icon-stat-check.svg',
      variant: 'success',
      progress:
        stats.totalApproved > 0
          ? { current: stats.totalActive, total: stats.totalApproved }
          : undefined,
    },
    {
      value: '0 ₫',
      labelKey: 'admin.partners.merchants.stats.revenueFromStores',
      icon: 'assets/icons/icon-stat-coin.svg',
      variant: 'warning',
      subtitleKey: 'admin.partners.stats.currentMonthEstimate',
    },
  ];
}

/**
 * Table configuration for merchants list
 */
export const MERCHANTS_TABLE_CONFIG: TableConfig<Merchant> = {
  id: 'merchants-table',
  columns: [
    {
      key: 'name',
      labelKey: 'admin.partners.merchants.table.storeName',
      type: 'custom',
      templateRef: 'storeInfo',
      width: '280px',
    },
    {
      key: 'address',
      labelKey: 'admin.partners.merchants.table.address',
      type: 'text',
    },
    {
      key: 'phone',
      labelKey: 'admin.partners.merchants.table.phone',
      type: 'text',
      nowrap: true,
    },
    {
      key: 'agencyName',
      labelKey: 'admin.partners.merchants.table.agency',
      type: 'text',
    },
    {
      key: 'brandName',
      labelKey: 'admin.partners.merchants.table.brand',
      type: 'custom',
      templateRef: 'brandInfo',
    },
    {
      key: 'ownerName',
      labelKey: 'admin.partners.merchants.table.owner',
      type: 'custom',
      templateRef: 'ownerInfo',
    },
    {
      key: 'businessCategory',
      labelKey: 'admin.partners.merchants.table.businessType',
      type: 'text',
    },
    {
      key: 'productCount',
      labelKey: 'admin.partners.merchants.table.products',
      type: 'number',
      width: '100px',
      nowrap: true,
    },
    {
      key: 'orderCount',
      labelKey: 'admin.partners.merchants.table.orders',
      type: 'number',
      width: '100px',
      nowrap: true,
    },
    {
      key: 'operationalStatus',
      labelKey: 'admin.partners.merchants.table.status',
      type: 'status',
      statusConfig: {
        ACTIVE: { labelKey: 'common.status.active', variant: 'success' },
        INACTIVE: { labelKey: 'common.status.inactive', variant: 'default' },
        SUSPENDED: { labelKey: 'common.status.suspended', variant: 'warning' },
        LOCKED: { labelKey: 'common.status.locked', variant: 'error' },
      },
    },
    {
      key: 'averageRating',
      labelKey: 'admin.partners.merchants.table.rating',
      type: 'custom',
      templateRef: 'rating',
      width: '100px',
    },
  ],
  actions: [
    {
      id: 'menu',
      labelKey: 'common.actions',
      icon: 'more',
      variant: 'default',
    },
  ],
  hoverable: true,
  rowIdKey: 'id',
};

/**
 * Table header configuration for merchants list
 */
export const MERCHANTS_TABLE_HEADER_CONFIG: TableHeaderConfig = {
  show: true,
  title: {
    labelKey: 'admin.partners.merchants.title',
    showCount: true,
  },
  search: {
    enabled: true,
    placeholderKey: 'admin.partners.merchants.searchPlaceholder',
    minWidth: '23.75rem',
  },
  filters: [
    {
      id: 'location',
      labelKey: 'admin.partners.filter.location',
      type: 'button',
    },
    {
      id: 'status',
      labelKey: 'admin.partners.filter.status',
      type: 'button',
    },
    {
      id: 'agency',
      labelKey: 'admin.partners.filter.agency',
      type: 'button',
    },
  ],
  actions: [
    {
      id: 'column',
      labelKey: 'admin.partners.column',
      icon: 'assets/icons/icon-column.svg',
      variant: 'outline',
      showOnMobile: true,
      showOnDesktop: true,
    },
    {
      id: 'add',
      labelKey: 'admin.partners.merchants.addNew',
      icon: 'assets/icons/icon-plus.svg',
      variant: 'primary',
      showOnMobile: true,
      showOnDesktop: true,
      mobileFlexGrow: true,
    },
  ],
};
