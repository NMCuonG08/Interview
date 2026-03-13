import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { OrderService, ProductResponse } from '@vhandelivery/shared-ui';
import { CartService } from '../../shared/services/cart.service';
import { concatMap, from, toArray } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly isSubmitting = signal(false);
  readonly checkoutError = signal<string | null>(null);
  readonly items = this.cartService.items;
  readonly itemCount = this.cartService.itemCount;
  readonly totalAmount = this.cartService.totalAmount;
  readonly canCheckout = computed(() => this.itemCount() > 0);
  readonly merchantCount = computed(() => {
    const ids = this.items()
      .map((item) => this.getMerchantExternalId(item.product))
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    return new Set(ids).size;
  });

  readonly checkoutForm = this.fb.group({
    deliveryAddressNote: ['', [Validators.required, Validators.minLength(4)]],
  });

  constructor() {
    this.setSeoTags();
  }

  submitOrder(): void {
    this.checkoutError.set(null);

    if (!this.canCheckout()) {
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const groupedOrders = this.buildGroupedOrders();
    if (groupedOrders.length === 0) {
      this.checkoutError.set(
        'Unable to determine merchant for this cart. Please re-add the item and try again.'
      );
      return;
    }

    this.isSubmitting.set(true);

    from(groupedOrders)
      .pipe(
        concatMap((group) =>
          this.orderService.create({
            merchantExternalId: group.merchantExternalId,
            items: group.items,
            deliveryAddressNote:
              this.checkoutForm.value.deliveryAddressNote ?? '',
          })
        ),
        toArray()
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.cartService.clear();
          this.router.navigate(['/store']);
        },
        error: (error) => {
          console.error('Failed to create order:', error);
          this.checkoutError.set(
            error?.error?.message ||
              'Checkout failed. Please verify your cart and try again.'
          );
          this.isSubmitting.set(false);
        },
      });
  }

  resolveItemName(item: { product: ProductResponse }): string {
    return this.cartService.resolveDisplayName(item.product);
  }

  resolveItemTotal(item: {
    product: ProductResponse;
    quantity: number;
  }): number {
    return this.cartService.resolvePrice(item.product) * item.quantity;
  }

  private buildGroupedOrders(): Array<{
    merchantExternalId: string;
    items: Array<{ productExternalId: string; quantity: number }>;
  }> {
    const map = new Map<
      string,
      Array<{ productExternalId: string; quantity: number }>
    >();

    for (const item of this.items()) {
      const merchantExternalId = this.getMerchantExternalId(item.product);
      if (!merchantExternalId) {
        continue;
      }

      const current = map.get(merchantExternalId) ?? [];
      current.push({
        productExternalId: item.product.externalId,
        quantity: item.quantity,
      });
      map.set(merchantExternalId, current);
    }

    return Array.from(map.entries()).map(([merchantExternalId, items]) => ({
      merchantExternalId,
      items,
    }));
  }

  private getMerchantExternalId(product: ProductResponse): string | null {
    if (
      typeof product.merchantExternalId === 'string' &&
      product.merchantExternalId.length > 0
    ) {
      return product.merchantExternalId;
    }

    const nestedMerchantExternalId = (
      product as ProductResponse & {
        merchant?: { externalId?: unknown };
      }
    ).merchant?.externalId;

    if (
      typeof nestedMerchantExternalId === 'string' &&
      nestedMerchantExternalId.length > 0
    ) {
      return nestedMerchantExternalId;
    }

    return null;
  }

  private setSeoTags(): void {
    const pageTitle = 'Checkout | SharkBee';
    const description =
      'Confirm your cart items and place your order with SharkBee.';
    const url =
      typeof window !== 'undefined' ? window.location.href : '/checkout';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
  }
}
