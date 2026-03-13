import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthService,
  CategoryResponse,
  CategoryService,
  ProductService as SharedProductService,
  ProductResponse,
  TranslatePipe,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(SharedProductService);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);

  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly productId = signal<string | null>(null);
  readonly categories = signal<CategoryResponse[]>([]);

  private images: File[] = [];

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    price: [null, [Validators.required, Validators.min(0)]],
    categoryId: ['', [Validators.required]],
    sku: [''],
    stock: [null, [Validators.min(0)]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.productId.set(id);
      this.loadProduct(id);
    }
  }

  private loadCategories(): void {
    this.categoryService
      .findAll({ includeChildren: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(this.flattenCategories(categories));
        },
        error: (error) => {
          console.error('Failed to load categories:', error);
          this.categories.set([]);
        },
      });
  }

  private flattenCategories(
    categories: CategoryResponse[]
  ): CategoryResponse[] {
    const flat: CategoryResponse[] = [];

    const walk = (items: CategoryResponse[]) => {
      for (const item of items) {
        flat.push(item);
        if (item.children && item.children.length > 0) {
          walk(item.children);
        }
      }
    };

    walk(categories);

    return flat;
  }

  private loadProduct(externalId: string): void {
    this.productService
      .findByExternalId(externalId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => this.patchForm(product),
        error: (error) => {
          console.error('Failed to load product:', error);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate('admin.products.loadError')
          );
        },
      });
  }

  private patchForm(product: ProductResponse): void {
    let name = '';
    let description = '';
    try {
      const anyName = product.name as any;
      name = anyName?.vi || anyName?.en || anyName?.ko || '';
      const anyDesc = product.description as any;
      description = anyDesc?.vi || anyDesc?.en || anyDesc?.ko || '';
    } catch {
      // ignore
    }

    const categoryId =
      product.metadata &&
      typeof product.metadata === 'object' &&
      !Array.isArray(product.metadata)
        ? ((product.metadata as Record<string, unknown>)['categoryId'] as
            | string
            | undefined)
        : undefined;

    this.form.patchValue({
      name,
      description,
      price:
        typeof product.price === 'string'
          ? Number(product.price)
          : (product.price as number | null),
      categoryId: categoryId ?? '',
      sku: product.sku ?? '',
      stock: product.stock ?? null,
      isActive: product.isActive ?? true,
    });
  }

  resolveCategoryName(category: CategoryResponse): string {
    return category.name?.vi || category.name?.en || category.name?.ko || '';
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.images = Array.from(input.files);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.modalService.showError(
        this.translationService.translate('common.status.warning'),
        this.translationService.translate('admin.products.formInvalid')
      );
      return;
    }

    this.isSubmitting.set(true);

    const value = this.form.value;
    const externalId = this.productId();

    if (this.isEditMode() && externalId) {
      const payload: any = {
        price: value.price,
        categoryId: value.categoryId,
        sku: value.sku || undefined,
        stock: value.stock ?? undefined,
        isActive: value.isActive,
        name: { vi: value.name },
        description: value.description ? { vi: value.description } : undefined,
      };

      this.productService
        .update(externalId, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.modalService.showSuccess(
              this.translationService.translate('common.status.success'),
              this.translationService.translate('admin.products.updateSuccess')
            );
            this.router.navigate(['/products/list']);
          },
          error: (error) => {
            console.error('Failed to update product:', error);
            this.isSubmitting.set(false);
            this.modalService.showError(
              this.translationService.translate('common.status.error'),
              this.translationService.translate('admin.products.updateError')
            );
          },
        });
      return;
    }

    const isSystemManager = this.authService.hasPermission(
      'system:manage_users'
    );
    const merchantId = this.route.snapshot.queryParamMap.get('merchantId');

    if (isSystemManager && !merchantId) {
      this.isSubmitting.set(false);
      this.modalService.showError(
        this.translationService.translate('common.status.error'),
        this.translationService.translate('admin.products.merchantRequired')
      );
      return;
    }

    const formData = new FormData();
    formData.append('name', JSON.stringify({ vi: value.name }));
    if (value.description) {
      formData.append('description', JSON.stringify({ vi: value.description }));
    }
    if (value.price != null) {
      formData.append('price', String(value.price));
    }
    if (value.categoryId) {
      formData.append('categoryId', value.categoryId);
    }
    if (value.sku) {
      formData.append('sku', value.sku);
    }
    if (value.stock != null) {
      formData.append('stock', String(value.stock));
    }
    formData.append('isActive', String(value.isActive));

    for (const file of this.images) {
      formData.append('images', file);
    }

    this.productService
      .create(formData, isSystemManager ? merchantId ?? undefined : undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.modalService.showSuccess(
            this.translationService.translate('common.status.success'),
            this.translationService.translate('admin.products.createSuccess')
          );
          this.router.navigate(['/products/list'], {
            queryParams:
              isSystemManager && merchantId ? { merchantId } : undefined,
          });
        },
        error: (error) => {
          console.error('Failed to create product:', error);
          this.isSubmitting.set(false);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate('admin.products.createError')
          );
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/products/list']);
  }
}
