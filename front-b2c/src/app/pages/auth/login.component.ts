import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@vhandelivery/shared-ui';
import { catchError, EMPTY, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly mode = signal<'login' | 'register'>('login');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly registerForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    username: ['', [Validators.required]],
    phone: ['', [Validators.required]],
  });

  readonly isLogin = computed(() => this.mode() === 'login');
  private readonly loginInvalid = toSignal(
    this.loginForm.statusChanges.pipe(
      startWith(this.loginForm.status),
      map((s) => s !== 'VALID')
    ),
    { initialValue: true }
  );
  private readonly registerInvalid = toSignal(
    this.registerForm.statusChanges.pipe(
      startWith(this.registerForm.status),
      map((s) => s !== 'VALID')
    ),
    { initialValue: true }
  );
  readonly isDisabled = computed(
    () =>
      this.loading() ||
      (this.isLogin() ? this.loginInvalid() : this.registerInvalid())
  );

  switchMode(mode: 'login' | 'register'): void {
    this.mode.set(mode);
    this.error.set(null);
  }

  submit(): void {
    if (this.isDisabled()) return;
    this.error.set(null);
    this.loading.set(true);

    const obs$ = this.isLogin()
      ? this.auth.login(this.loginForm.getRawValue())
      : this.auth.register(this.registerForm.getRawValue());

    obs$
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.message ??
            (this.isLogin() ? 'Login failed.' : 'Registration failed.');
          this.error.set(Array.isArray(msg) ? msg.join(' ') : msg);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe(() => {
        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl') || '/store';
        this.router.navigateByUrl(returnUrl);
      });
  }
}
