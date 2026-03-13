export type NavPermission = {
  readonly resource: string;
  readonly action: string;
};

export type NavItem = {
  readonly labelKey: string;
  readonly link?: string;
  readonly icon?: string;
  readonly active?: boolean;
  readonly children?: readonly NavItem[];
  readonly permission?: NavPermission;
  readonly anyPermissions?: readonly NavPermission[];
  readonly hiddenForRoles?: readonly string[];
};
