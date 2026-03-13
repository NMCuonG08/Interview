import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Merchant, Agency, Brand, User, Tag } from '@prisma/client';

/**
 * Tag info for merchant display
 */
export interface MerchantTagInfo {
  code: string;
  name: unknown; // Json type from Prisma
  icon: string | null;
  color: string | null;
}

/**
 * Agency info for merchant display (grouped)
 */
export interface MerchantAgencyInfo {
  externalId: string;
  name: string;
  phone: string | null;
}

/**
 * Brand info for merchant display (grouped)
 */
export interface MerchantBrandInfo {
  externalId: string;
  name: string;
  slug: string | null;
}

/**
 * Owner info for merchant display (grouped)
 */
export interface MerchantOwnerInfo {
  name: string;
  email: string | null;
  phone: string | null;
}

/**
 * Related data types for merchant entity construction
 */
export interface MerchantRelations {
  agency?: Partial<Agency> | null;
  brand?: Partial<Brand> | null;
  owner?: Partial<User> | null;
  tags?: Array<{ tag: Tag }>;
  _count?: {
    products?: number;
    orders?: number;
  };
}

/**
 * Merchant entity for API responses.
 * Excludes internal IDs and sensitive metadata.
 * Groups related entity info for cleaner structure.
 */
export class MerchantEntity extends BaseEntity {
  externalId: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  contactName: string | null;
  businessType: string | null;
  businessCategory: string | null;

  // Status
  approvalStatus: string;
  approvedAt: Date | null;
  approvedBy: number | null;
  rejectedAt: Date | null;
  rejectedBy: number | null;
  rejectionReason: string | null;
  operationalStatus: string;

  // Rating stats
  averageRating: number;
  totalReviews: number;

  // Timestamps
  createdAt: Date;

  // Related entities (grouped)
  agency: MerchantAgencyInfo | null;
  brand: MerchantBrandInfo | null;
  owner: MerchantOwnerInfo | null;
  tags: MerchantTagInfo[];

  // Counts
  productCount: number;
  orderCount: number;

  // Excluded fields - approval details
  @Exclude()
  referralSource: string | null;

  @Exclude()
  hasBusinessLicense: boolean | null;

  @Exclude()
  statusChangedAt: Date | null;

  @Exclude()
  statusReason: string | null;

  @Exclude()
  ratingBreakdown: Record<string, number> | null;

  @Exclude()
  updatedAt: Date | null;

  @Exclude()
  brandId: number | null;

  @Exclude()
  agencyId: number | null;

  @Exclude()
  ownerId: number | null;

  @Exclude()
  statusChangedBy: number | null;

  @Exclude()
  latitude: number | null;

  @Exclude()
  longitude: number | null;

  @Exclude()
  isAcceptingOrders: boolean;

  @Exclude()
  metadata: unknown;

  constructor(partial: Partial<Merchant>, relations?: MerchantRelations) {
    super(partial);
    Object.assign(this, partial);

    // Map agency info (grouped)
    this.agency = relations?.agency?.externalId
      ? {
          externalId: relations.agency.externalId,
          name: relations.agency.name ?? '',
          phone: relations.agency.phone ?? null,
        }
      : null;

    // Map brand info (grouped)
    this.brand = relations?.brand?.externalId
      ? {
          externalId: relations.brand.externalId,
          name: relations.brand.name ?? '',
          slug: relations.brand.slug ?? null,
        }
      : null;

    // Map owner info (grouped)
    this.owner = relations?.owner?.username
      ? {
          name: relations.owner.username,
          email: relations.owner.email ?? null,
          phone: relations.owner.phone ?? null,
        }
      : null;

    // Map tags
    this.tags = (relations?.tags ?? []).map((mt) => ({
      code: mt.tag.code,
      name: mt.tag.name,
      icon: mt.tag.icon,
      color: mt.tag.color,
    }));

    // Map counts
    this.productCount = relations?._count?.products ?? 0;
    this.orderCount = relations?._count?.orders ?? 0;
  }
}
