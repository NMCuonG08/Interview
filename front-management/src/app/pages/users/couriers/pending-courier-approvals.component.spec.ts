import { TestBed } from '@angular/core/testing';
import { PendingCourierApprovalsComponent } from './pending-courier-approvals.component';
import { CourierService, TranslationService } from '@vhandelivery/shared-ui';
import { of, throwError } from 'rxjs';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import { vi } from 'vitest';

describe('PendingCourierApprovalsComponent', () => {
  const courierServiceMock = {
    findAll: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  };

  const modalServiceMock = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showConfirmation: vi.fn((_t: string, _m: string, onConfirm: () => void) => onConfirm()),
  };

  const translationServiceMock = {
    translate: (key: string) => key,
    getLocalizedValue: (value: any) => value,
    getLanguage: () => 'vi',
    setLanguage: () => {},
  };

  beforeEach(async () => {
    courierServiceMock.findAll.mockReturnValue(
      of({
        data: [
          {
            externalId: 'c1',
            name: 'A',
            phone: '0123',
            email: 'a@test.com',
            approvalStatus: 'PENDING',
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      })
    );
    courierServiceMock.approve.mockReturnValue(
      of({
        externalId: 'c1',
        approvalStatus: 'APPROVED',
        createdAt: new Date(),
      })
    );
    courierServiceMock.reject.mockReturnValue(
      of({
        externalId: 'c1',
        approvalStatus: 'REJECTED',
        rejectionReason: 'bad',
        createdAt: new Date(),
      })
    );

    await TestBed.configureTestingModule({
      imports: [PendingCourierApprovalsComponent],
      providers: [
        { provide: CourierService, useValue: courierServiceMock },
        { provide: GlobalModalService, useValue: modalServiceMock },
        { provide: TranslationService, useValue: translationServiceMock },
      ],
    }).compileComponents();
  });

  it('should load couriers on init', () => {
    const fixture = TestBed.createComponent(PendingCourierApprovalsComponent);
    fixture.detectChanges();
    expect(courierServiceMock.findAll).toHaveBeenCalled();
  });

  it('should call approve and show success', () => {
    const fixture = TestBed.createComponent(PendingCourierApprovalsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.approve({
      externalId: 'c1',
      approvalStatus: 'PENDING',
      createdAt: new Date(),
    } as any);

    expect(courierServiceMock.approve).toHaveBeenCalledWith('c1');
    expect(modalServiceMock.showSuccess).toHaveBeenCalled();
  });

  it('should open reject modal, validate reason, then reject', () => {
    const fixture = TestBed.createComponent(PendingCourierApprovalsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.openReject({
      externalId: 'c1',
      approvalStatus: 'PENDING',
      createdAt: new Date(),
    } as any);
    expect(comp.isRejectModalOpen()).toBe(true);

    comp.confirmReject();
    expect(modalServiceMock.showWarning).toHaveBeenCalled();

    comp.rejectReason.set('bad docs');
    comp.confirmReject();
    expect(courierServiceMock.reject).toHaveBeenCalledWith('c1', 'bad docs');
    expect(modalServiceMock.showSuccess).toHaveBeenCalled();
  });

  it('should show error modal when list load fails', async () => {
    courierServiceMock.findAll.mockReturnValueOnce(throwError(() => ({ error: { message: 'boom' } })));
    const fixture = TestBed.createComponent(PendingCourierApprovalsComponent);
    fixture.detectChanges();
    expect(modalServiceMock.showError).toHaveBeenCalled();
  });
});

