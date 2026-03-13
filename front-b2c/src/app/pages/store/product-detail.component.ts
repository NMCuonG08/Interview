import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { CartService } from '../../shared/services/cart.service';
import { StorefrontProductStateService } from '../../shared/services/storefront-product-state.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly state = inject(StorefrontProductStateService);
  private readonly cartService = inject(CartService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly isLoading = this.state.detailLoading;
  readonly product = this.state.detail;
  readonly quantity = signal(1);
  readonly addedToCart = signal(false);

  readonly displayName = computed(() => {
    const p = this.product();
    if (!p) return '';
    if (typeof p.name === 'string') return p.name;

    try {
      const anyName = p.name as Record<string, string | undefined>;
      return anyName['vi'] || anyName['en'] || anyName['ko'] || '';
    } catch {
      return '';
    }
  });

  readonly priceText = computed(() => {
    const p = this.product();
    if (!p) return '';
    const priceNumber =
      typeof p.price === 'string'
        ? Number(p.price)
        : (p.price as number | undefined);

    if (!priceNumber && priceNumber !== 0) return '';

    return `${priceNumber.toLocaleString('vi-VN')} ${p.currency ?? 'VND'}`;
  });

  constructor() {
    effect(() => {
      const product = this.product();
      if (!product) return;

      const name = this.displayName() || 'Product detail';
      const pageTitle = `${name} | SharkBee`;
      const description = `View details and place ${name} into your cart.`;
      const url =
        typeof window !== 'undefined'
          ? window.location.href
          : `/store/${product.externalId}`;

      this.title.setTitle(pageTitle);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: pageTitle });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ property: 'og:url', content: url });
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.state.loadDetail(id);
    }
  }

  ngOnDestroy(): void {
    this.state.clearDetail();
  }

  increment(): void {
    this.quantity.update((q) => q + 1);
  }

  decrement(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  addToCart(): void {
    const product = this.product();
    if (!product) return;

    this.cartService.addItem(product, this.quantity());
    this.addedToCart.set(true);

    window.setTimeout(() => {
      this.addedToCart.set(false);
    }, 1800);
  }

  resolveDescription(description: unknown): string {
    if (!description)
      return 'Curated for fast ordering and clean checkout flow.';
    if (typeof description === 'string') return description;

    try {
      const localized = description as Record<string, string | undefined>;
      return (
        localized['vi'] ||
        localized['en'] ||
        localized['ko'] ||
        'Curated for fast ordering and clean checkout flow.'
      );
    } catch {
      return 'Curated for fast ordering and clean checkout flow.';
    }
  }
}
