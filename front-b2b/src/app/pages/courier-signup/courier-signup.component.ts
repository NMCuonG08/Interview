import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  CourierService,
  CreateCourierRequest,
  VerifyOtpResponse,
  isValidEmail,
  formatPhoneVN,
  cleanPhoneNumber,
  TranslatePipe,
} from '@vhandelivery/shared-ui';
import { GlobalModalComponent } from '../../shared/components/global-modal/global-modal.component';
import { OtpModalComponent } from '../../shared/components/otp-modal/otp-modal.component';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { ModalType } from '../../shared/types/modal-type.type';
import { RegistrationStateService } from '../../shared/services/registration-state.service';

@Component({
  selector: 'app-courier-signup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    GlobalModalComponent,
    OtpModalComponent,
    BackButtonComponent,
  ],
  templateUrl: './courier-signup.component.html',
  styleUrls: ['./courier-signup.component.scss'],
})
export class CourierSignupComponent {
  showOtpModal = false;

  modalConfig = {
    isOpen: false,
    type: 'info' as ModalType,
    title: '',
    message: '',
  };

  otpVerified = false;
  verificationToken: string | null = null;

  formData = {
    fullName: '',
    phoneNumber: '',
    email: '',
    vehicleType: '',
  };

  touched = {
    fullName: false,
    phoneNumber: false,
    email: false,
    vehicleType: false,
  };

  @ViewChild(OtpModalComponent) otpModal!: OtpModalComponent;

  private readonly courierService = inject(CourierService);
  private readonly router = inject(Router);
  private readonly registrationState = inject(RegistrationStateService);

  hasError(fieldName: keyof typeof this.formData): boolean {
    const field = fieldName as keyof typeof this.touched;
    if (!this.touched[field]) return false;

    if (fieldName === 'email') {
      return !!this.formData.email && !isValidEmail(this.formData.email);
    }

    const value = this.formData[fieldName];
    return !value || (typeof value === 'string' && value.trim() === '');
  }

  onBlur(fieldName: keyof typeof this.touched): void {
    this.touched[fieldName] = true;
  }

  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formData.phoneNumber = formatPhoneVN(input.value);
  }

  validateForm(): boolean {
    Object.keys(this.touched).forEach((key) => {
      this.touched[key as keyof typeof this.touched] = true;
    });

    const requiredFields: (keyof typeof this.formData)[] = [
      'fullName',
      'phoneNumber',
      'vehicleType',
    ];

    const isValid = requiredFields.every((field) => {
      const value = this.formData[field];
      return value && (typeof value === 'string' ? value.trim() !== '' : true);
    });

    if (this.formData.email && !isValidEmail(this.formData.email)) {
      return false;
    }

    return isValid;
  }

  showModal(type: ModalType, title: string, message: string) {
    this.modalConfig = {
      isOpen: true,
      type,
      title,
      message,
    };
  }

  closeModal() {
    this.modalConfig.isOpen = false;
  }

  requestOtp() {
    const phone = cleanPhoneNumber(this.formData.phoneNumber);

    this.courierService.requestOtp(phone).subscribe({
      next: () => {
        this.showOtpModal = true;
        setTimeout(() => this.otpModal?.startCountdown(), 0);
      },
      error: () => {
        this.showModal('error', 'modal.error', 'modal.registrationFailedDesc');
      },
    });
  }

  onOtpVerify(code: string) {
    const phone = cleanPhoneNumber(this.formData.phoneNumber);

    this.courierService.verifyOtp(phone, code).subscribe({
      next: (res: VerifyOtpResponse) => {
        this.otpVerified = true;
        this.verificationToken = res.verificationToken;
        this.showOtpModal = false;
        this.otpModal?.resetVerifying();
        this.submitRegistration();
      },
      error: () => {
        this.otpModal?.resetVerifying();
        this.showModal('error', 'modal.error', 'modal.otpInvalid');
      },
    });
  }

  onOtpResend() {
    this.requestOtp();
  }

  submitRegistration() {
    const payload: CreateCourierRequest = {
      name: this.formData.fullName,
      phone: cleanPhoneNumber(this.formData.phoneNumber),
      verificationToken: this.verificationToken ?? '',
      email: this.formData.email || undefined,
      vehicleType: this.formData.vehicleType || undefined,
    };

    this.courierService.register(payload).subscribe({
      next: () => {
        this.registrationState.markAsCompleted('courier');
        this.router.navigate(['/registration-success']);
      },
      error: (err: unknown) => {
        console.error('Courier register failed..', err);
        this.showModal(
          'error',
          'modal.registrationFailed',
          'modal.registrationFailedDesc'
        );
      },
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.validateForm()) {
      const firstError = document.querySelector('.form-hint.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!this.otpVerified) {
      this.requestOtp();
      return;
    }

    this.submitRegistration();
  }
}

