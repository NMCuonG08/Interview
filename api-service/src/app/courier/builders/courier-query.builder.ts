import { Prisma } from '@prisma/client';
import { QueryBuilder } from '../../common/builders/query.builder';
import { ApprovalStatus } from '@prisma/client';

/**
 * Query Builder cho Courier
 * Hỗ trợ filter theo approvalStatus, search, date range, soft delete.
 */
export class CourierQueryBuilder extends QueryBuilder<Prisma.CourierWhereInput> {
  /**
   * Chỉ lấy courier chưa bị xoá mềm
   */
  withNotDeleted(): this {
    this.where.deletedAt = null;
    return this;
  }

  /**
   * Filter theo approvalStatus (PENDING/APPROVED/REJECTED)
   */
  withApprovalStatus(status?: string): this {
    if (status) {
      this.where.approvalStatus = status as ApprovalStatus;
    }
    return this;
  }

  /**
   * Search theo name / email / phone
   */
  withSearch(search?: string): this {
    if (search) {
      this.where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    return this;
  }

  /**
   * Filter theo khoảng thời gian tạo (createdAt)
   */
  withDateRange(startDate?: Date | string, endDate?: Date | string): this {
    if (startDate || endDate) {
      this.where.createdAt = {};
      if (startDate) {
        this.where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        this.where.createdAt.lte = new Date(endDate);
      }
    }
    return this;
  }
}

