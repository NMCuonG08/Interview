import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly items = this.cartService.items;
  readonly itemCount = this.cartService.itemCount;
  readonly totalAmount = this.cartService.totalAmount;
  readonly checkoutNotice = signal<string | null>(null);
  readonly hasMultipleMerchants = computed(
    () => this.cartService.merchantExternalIds().length > 1
  );

  constructor() {
    this.setSeoTags();
  }

  remove(externalId: string): void {
    this.cartService.removeItem(externalId);
  }

  changeQuantity(externalId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (Number.isNaN(value)) return;
    this.cartService.updateQuantity(externalId, value);
  }

  resolveItemName(externalId: string): string {
    const item = this.items().find((x) => x.product.externalId === externalId);
    if (!item) return externalId;
    return this.cartService.resolveDisplayName(item.product);
  }

  resolveItemTotal(externalId: string, quantity: number): number {
    const item = this.items().find((x) => x.product.externalId === externalId);
    if (!item) return 0;
    return this.cartService.resolvePrice(item.product) * quantity;
  }

  checkout(): void {
    this.checkoutNotice.set(null);

    if (this.items().length === 0) {
      this.checkoutNotice.set(
        'Your cart is empty. Please add a product first.'
      );
      return;
    }

    this.router.navigate(['/checkout']);
  }

  increase(externalId: string, quantity: number): void {
    this.cartService.updateQuantity(externalId, quantity + 1);
  }

  decrease(externalId: string, quantity: number): void {
    this.cartService.updateQuantity(externalId, quantity - 1);
  }

  private setSeoTags(): void {
    const pageTitle = 'Cart | SharkBee';
    const description =
      'Review selected products in your cart before checkout.';
    const url = typeof window !== 'undefined' ? window.location.href : '/cart';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
  }
}
