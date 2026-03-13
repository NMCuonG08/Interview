import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { CartService } from '../../shared/services/cart.service';
import { StorefrontProductStateService } from '../../shared/services/storefront-product-state.service';
import { ProductResponse } from '@vhandelivery/shared-ui';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  private readonly state = inject(StorefrontProductStateService);
  private readonly cartService = inject(CartService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly isLoading = this.state.listLoading;
  readonly products = this.state.products;
  readonly page = this.state.page;
  readonly limit = this.state.limit;
  readonly total = this.state.total;
  readonly lastPage = this.state.lastPage;

  addToCart(product: ProductResponse): void {
    this.cartService.addItem(product, 1);
  }

  ngOnInit(): void {
    this.setSeoTags();
    this.state.loadPublic(this.page(), this.limit());
  }

  onNextPage(): void {
    if (this.page() < this.lastPage()) {
      this.page.set(this.page() + 1);
      this.state.loadPublic(this.page(), this.limit());
    }
  }

  onPrevPage(): void {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.state.loadPublic(this.page(), this.limit());
    }
  }

  resolveName(product: { name: unknown }): string {
    if (!product.name) return '';
    if (typeof product.name === 'string') return product.name;

    try {
      const anyName = product.name as Record<string, string | undefined>;
      return anyName['vi'] || anyName['en'] || anyName['ko'] || '';
    } catch {
      return '';
    }
  }

  resolvePrice(product: {
    price?: number | string | null;
    currency?: string | null;
  }): string {
    const priceNumber =
      typeof product.price === 'string'
        ? Number(product.price)
        : (product.price as number | undefined);

    if (!priceNumber && priceNumber !== 0) return '';

    return `${priceNumber.toLocaleString('vi-VN')} ${
      product.currency ?? 'VND'
    }`;
  }

  resolveDescription(product: { description?: unknown }): string {
    if (!product.description) return 'Freshly listed and ready to order.';
    if (typeof product.description === 'string') return product.description;

    try {
      const localized = product.description as Record<
        string,
        string | undefined
      >;
      return (
        localized['vi'] ||
        localized['en'] ||
        localized['ko'] ||
        'Freshly listed and ready to order.'
      );
    } catch {
      return 'Freshly listed and ready to order.';
    }
  }

  private setSeoTags(): void {
    const pageTitle = 'Store | SharkBee';
    const description =
      'Browse products and place orders from the B2C storefront.';
    const url = typeof window !== 'undefined' ? window.location.href : '/store';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
  }
}
