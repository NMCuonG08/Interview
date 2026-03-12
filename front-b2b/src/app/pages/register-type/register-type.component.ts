import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  AuthService,
  TranslatePipe,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../shared/components/global-modal/global-modal.service';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { RegisterCard } from '../../shared/interfaces/register-type.interface';

@Component({
  standalone: true,
  selector: 'app-register-type',
  templateUrl: './register-type.component.html',
  imports: [CommonModule, TranslatePipe, BackButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterTypeComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);

  readonly cards: RegisterCard[] = [
    { key: 'agency', route: '/partner-signup' },
    { key: 'merchant', route: '/merchant-signup' },
    { key: 'courier', route: '/courier-signup' },
  ];

  readonly selected = signal<RegisterCard['key'] | null>(null);

  readonly selectedRoute = computed<string | null>(() => {
    const key = this.selected();
    return this.cards.find((card) => card.key === key)?.route ?? null;
  });

  onSelect(key: RegisterCard['key']): void {
    this.selected.set(key);

    if (!this.authService.currentUser()) {
      this.modalService.show(
        'warning',
        this.translationService.translate('auth.loginRequired.title'),
        this.translationService.translate('auth.loginRequired.message'),
        () => this.router.navigate(['/login'])
      );
      return;
    }

    const card = this.cards.find((c) => c.key === key);
    if (card) {
      this.router.navigate([card.route]);
    }
  }
}
