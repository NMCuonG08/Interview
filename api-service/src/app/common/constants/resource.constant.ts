export const RESOURCE_TARGETS = {
  MERCHANT: 'MERCHANT',
  AGENCY: 'AGENCY',
  COURIER: 'COURIER',
} as const;

export type ResourceTarget = keyof typeof RESOURCE_TARGETS;

export const RESOURCE_IDENTIFIER_KEYS = {
  [RESOURCE_TARGETS.MERCHANT]: ['merchantId', 'id', 'externalId'],
  [RESOURCE_TARGETS.AGENCY]: ['agencyId', 'id', 'externalId'],
  [RESOURCE_TARGETS.COURIER]: ['courierId', 'id', 'externalId'],
};
