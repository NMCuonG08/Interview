import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, TranslationService } from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize } from 'rxjs';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    username: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    remember: [false],
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);

  readonly isDisabled = computed(
    () => this.loading() === true || this.form.invalid
  );

  togglePasswordVisibility(): void {
    this.passwordVisible.update((value) => !value);
  }

  submit() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    const { email, password, username, phone } = this.form.getRawValue();
    const payload = {
      email: email.trim(),
      password,
      username: username.trim(),
      phone: phone.trim(),
    };

    if (!payload.username || !payload.phone) {
      this.form.markAllAsTouched();
      this.loading.set(false);
      return;
    }

    this.auth
      .register(payload)
      .pipe(
        catchError((err) => {
          const message =
            err?.error?.message || err?.message || 'auth.error.registerFailed';
          this.error.set(message);
          this.modalService.showError(
            this.translationService.translate('auth.register.errorTitle'),
            this.translationService.translate(message)
          );
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.modalService.showSuccess(
          this.translationService.translate('auth.register.successTitle'),
          this.translationService.translate('auth.register.successMessage')
        );
        this.router.navigateByUrl('/landing');
      });
  }
}
