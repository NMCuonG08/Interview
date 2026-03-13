import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CourierService } from './courier.service';

describe('CourierService approval flow', () => {
  let service: CourierService;

  const prismaMock = {
    courier: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    courierApprovalAudit: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const jwtMock = {
    verify: vi.fn(),
  };

  const otpMock = {
    requestOtp: vi.fn(),
    verifyOtp: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = new CourierService(prismaMock as any, jwtMock as any, otpMock as any);
  });

  it('approve: should approve a PENDING courier and write audit', async () => {
    prismaMock.courier.findFirst.mockResolvedValue({
      id: 1,
      externalId: 'c1',
      deletedAt: null,
      approvalStatus: 'PENDING',
      rejectionReason: 'x',
    });

    prismaMock.courier.update.mockResolvedValue({
      id: 1,
      externalId: 'c1',
      deletedAt: null,
      approvalStatus: 'APPROVED',
      rejectionReason: null,
    });

    const res = await service.approve('c1', 999);

    expect(prismaMock.courier.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.courierApprovalAudit.create).toHaveBeenCalledTimes(1);
    expect(res.approvalStatus).toBe('APPROVED');
  });

  it('approve: should be idempotent when already APPROVED (no update, no audit)', async () => {
    prismaMock.courier.findFirst.mockResolvedValue({
      id: 1,
      externalId: 'c1',
      deletedAt: null,
      approvalStatus: 'APPROVED',
      rejectionReason: null,
    });

    const res = await service.approve('c1', 999);

    expect(prismaMock.courier.update).not.toHaveBeenCalled();
    expect(prismaMock.courierApprovalAudit.create).not.toHaveBeenCalled();
    expect(res.approvalStatus).toBe('APPROVED');
  });

  it('reject: should reject a PENDING courier with reason and write audit', async () => {
    prismaMock.courier.findFirst.mockResolvedValue({
      id: 2,
      externalId: 'c2',
      deletedAt: null,
      approvalStatus: 'PENDING',
      rejectionReason: null,
    });

    prismaMock.courier.update.mockResolvedValue({
      id: 2,
      externalId: 'c2',
      deletedAt: null,
      approvalStatus: 'REJECTED',
      rejectionReason: 'bad docs',
    });

    const res = await service.reject('c2', { rejectionReason: 'bad docs' }, 1000);

    expect(prismaMock.courier.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.courierApprovalAudit.create).toHaveBeenCalledTimes(1);
    expect(res.approvalStatus).toBe('REJECTED');
    expect(res.rejectionReason).toBe('bad docs');
  });

  it('reject: should be idempotent when already REJECTED (no update, no audit)', async () => {
    prismaMock.courier.findFirst.mockResolvedValue({
      id: 2,
      externalId: 'c2',
      deletedAt: null,
      approvalStatus: 'REJECTED',
      rejectionReason: 'bad docs',
    });

    const res = await service.reject('c2', { rejectionReason: 'anything' }, 1000);

    expect(prismaMock.courier.update).not.toHaveBeenCalled();
    expect(prismaMock.courierApprovalAudit.create).not.toHaveBeenCalled();
    expect(res.approvalStatus).toBe('REJECTED');
  });
});

