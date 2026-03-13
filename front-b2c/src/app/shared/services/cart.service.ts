import { Injectable, computed, signal } from '@angular/core';
import { ProductResponse } from '@vhandelivery/shared-ui';

export interface CartItem {
  product: ProductResponse;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storageKey = 'vhandelivery-b2c-cart';
  private readonly itemsSignal = signal<CartItem[]>([]);

  readonly items = computed(() => this.itemsSignal());
  readonly itemCount = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly totalAmount = computed(() =>
    this.itemsSignal().reduce((sum, item) => {
      const priceNumber =
        typeof item.product.price === 'string'
          ? Number(item.product.price)
          : (item.product.price as number | undefined);
      if (!priceNumber && priceNumber !== 0) return sum;
      return sum + priceNumber * item.quantity;
    }, 0)
  );

  readonly merchantExternalIds = computed(() => {
    const ids = this.itemsSignal()
      .map((item) => this.extractMerchantExternalId(item.product))
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    return Array.from(new Set(ids));
  });

  constructor() {
    this.restore();
  }

  addItem(product: ProductResponse, quantity = 1): void {
    const merchantExternalId = this.extractMerchantExternalId(product);
    const normalizedProduct: ProductResponse = {
      ...product,
      merchantExternalId: merchantExternalId ?? undefined,
    };

    this.itemsSignal.update((items) => {
      const existingIndex = items.findIndex(
        (i) => i.product.externalId === normalizedProduct.externalId
      );
      if (existingIndex !== -1) {
        const updated = [...items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...items, { product: normalizedProduct, quantity }];
    });

    this.persist();
  }

  updateQuantity(productExternalId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productExternalId);
      return;
    }

    this.itemsSignal.update((items) =>
      items.map((item) =>
        item.product.externalId === productExternalId
          ? { ...item, quantity }
          : item
      )
    );

    this.persist();
  }

  removeItem(productExternalId: string): void {
    this.itemsSignal.update((items) =>
      items.filter((item) => item.product.externalId !== productExternalId)
    );

    this.persist();
  }

  clear(): void {
    this.itemsSignal.set([]);
    this.persist();
  }

  getSingleMerchantExternalId(): string | null {
    const ids = this.merchantExternalIds();
    if (ids.length !== 1) {
      return null;
    }

    return ids[0];
  }

  resolveDisplayName(product: ProductResponse): string {
    if (!product.name) return product.externalId;
    if (typeof product.name === 'string') return product.name;

    try {
      const localizedName = product.name as Record<string, string | undefined>;
      return (
        localizedName['vi'] ||
        localizedName['en'] ||
        localizedName['ko'] ||
        product.externalId
      );
    } catch {
      return product.externalId;
    }
  }

  resolvePrice(product: ProductResponse): number {
    const priceNumber =
      typeof product.price === 'string'
        ? Number(product.price)
        : (product.price as number | undefined);

    if (Number.isNaN(priceNumber) || priceNumber == null) {
      return 0;
    }

    return priceNumber;
  }

  private persist(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.itemsSignal())
    );
  }

  private extractMerchantExternalId(product: ProductResponse): string | null {
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

  private restore(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(this.storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        const restoredItems = parsed
          .filter(
            (item) =>
              !!item?.product?.externalId &&
              typeof item.quantity === 'number' &&
              item.quantity > 0
          )
          .map((item) => {
            const merchantExternalId = this.extractMerchantExternalId(
              item.product
            );

            return {
              ...item,
              product: {
                ...item.product,
                merchantExternalId: merchantExternalId ?? undefined,
              },
            };
          });

        this.itemsSignal.set(restoredItems);
      }
    } catch {
      window.localStorage.removeItem(this.storageKey);
    }
  }
}
