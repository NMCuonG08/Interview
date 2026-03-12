import { TableConfig, TableHeaderConfig } from '../../../shared/interfaces/table.interface';

export const PENDING_COURIERS_TABLE_CONFIG: TableConfig<Record<string, unknown>> = {
  id: 'pending-couriers-table',
  rowIdKey: 'externalId',
  hoverable: true,
  columns: [
    {
      key: 'name',
      labelKey: 'common.name',
      type: 'text',
      width: '220px',
    },
    {
      key: 'phone',
      labelKey: 'admin.partners.table.phone',
      type: 'text',
      width: '160px',
    },
    {
      key: 'email',
      labelKey: 'admin.partners.table.email',
      type: 'text',
      width: '220px',
    },
    {
      key: 'createdAt',
      labelKey: 'admin.partners.table.createdAt',
      type: 'date',
      dateFormat: 'short',
      width: '140px',
    },
    {
      key: 'approvalStatus',
      labelKey: 'common.status',
      type: 'status',
      statusConfig: {
        PENDING: { labelKey: 'common.status.pending', variant: 'warning' },
        APPROVED: { labelKey: 'common.status.approved', variant: 'success' },
        REJECTED: { labelKey: 'common.status.rejected', variant: 'error' },
      },
      width: '140px',
    },
    {
      key: 'actions',
      labelKey: 'common.actions',
      type: 'custom',
      templateRef: 'rowActions',
      width: '200px',
    },
  ],
};

export const PENDING_COURIERS_TABLE_HEADER_CONFIG: TableHeaderConfig = {
  show: true,
  title: {
    labelKey: 'admin.users.couriers.pendingTitle',
    showCount: true,
  },
  search: {
    enabled: true,
    placeholderKey: 'admin.users.couriers.searchPlaceholder',
    minWidth: '23.75rem',
  },
  actions: [
    {
      id: 'column',
      labelKey: 'admin.partners.column',
      icon: 'assets/icons/icon-column.svg',
      variant: 'outline',
      showOnMobile: true,
      showOnDesktop: true,
    },
  ],
};

