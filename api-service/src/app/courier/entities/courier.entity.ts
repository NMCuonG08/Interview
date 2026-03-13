import { BaseEntity } from '../../common/entities/base.entity';
import { Courier } from '@prisma/client';
import { Exclude } from 'class-transformer';

/**
 * Courier entity for API responses.
 * Hides internal numeric IDs, exposes externalId and business fields.
 */
export class CourierEntity extends BaseEntity {
  externalId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  approvalStatus: string;
  rejectionReason: string | null;
  status: string | null; // availability status
  vehicleType: string | null;
  currentLocation: unknown | null;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;

  @Exclude()
  userId: number;

  constructor(partial: Partial<Courier>) {
    super(partial);
    Object.assign(this, partial);
  }
}

