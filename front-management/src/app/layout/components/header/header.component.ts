import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import {
  AuthService,
  TranslatePipe,
  TranslationService,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
} from '@vhandelivery/shared-ui';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import { NavItem } from '../../../shared/types/nav-item.type';

type NavItemWithState = NavItem & {
  active: boolean;
  children?: readonly (NavItem & { active: boolean })[];
};

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements AfterViewInit {
  private readonly translationService = inject(TranslationService);
  protected readonly auth = inject(AuthService);
  private readonly modalService = inject(GlobalModalService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  readonly navItems = input<readonly NavItem[]>([]);

  constructor() {
    effect(() => {
      // Trigger on activeNavItems change
      const items = this.activeNavItems();
      if (items.length > 0) {
        setTimeout(() => this.scrollToActiveNavItem(), 100);
      }
    });
  }

  ngAfterViewInit(): void {
    // Initial scroll to active item on page load
    setTimeout(() => this.scrollToActiveNavItem(), 200);
  }

  protected readonly languageOptions: ReadonlyArray<{
    value: SupportedLanguage;
    label: string;
    flag: string;
  }> = [
    {
      value: SUPPORTED_LANGUAGES[0],
      label: 'Tiếng Việt',
      flag: 'assets/icons/flags/vi.svg',
    },
    {
      value: SUPPORTED_LANGUAGES[1],
      label: 'English',
      flag: 'assets/icons/flags/en.svg',
    },
    {
      value: SUPPORTED_LANGUAGES[2],
      label: '한국어',
      flag: 'assets/icons/flags/ko.svg',
    },
  ];

  protected readonly currentLanguage = signal<SupportedLanguage>(
    this.translationService.getLanguage()
  );
  protected readonly isLanguageDropdownOpen = signal(false);
  protected readonly isUserDropdownOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly openNavDropdownIndex = signal<number | null>(null);
  protected readonly isMobileMenuOpen = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    )
  );

  private hasNavPermission(item: NavItem): boolean {
    const userRoles = this.auth.currentUser()?.roles ?? [];

    if (
      item.hiddenForRoles &&
      item.hiddenForRoles.some((role) => userRoles.includes(role))
    ) {
      return false;
    }

    if (item.anyPermissions && item.anyPermissions.length > 0) {
      const permissionKeys = item.anyPermissions.map(
        (p) => `${p.resource}:${p.action}`
      );
      return this.auth.hasAnyPermission(...permissionKeys);
    }

    if (item.permission) {
      const permissionKey = `${item.permission.resource}:${item.permission.action}`;
      return this.auth.hasPermission(permissionKey);
    }

    return true;
  }

  protected readonly activeNavItems = computed((): NavItemWithState[] => {
    const url = this.currentUrl()?.urlAfterRedirects || this.router.url;
    return (
      this.navItems()
        .filter((item) => this.hasNavPermission(item))
        .map((item) => {
          const children = item.children
            ?.filter((child) => this.hasNavPermission(child))
            .map((child) => ({
              ...child,
              active: child.link ? url.startsWith(child.link) : false,
            }));

          const hasActiveChild = children?.some((c) => c.active) ?? false;
          const isDirectActive = item.link ? url.startsWith(item.link) : false;

          return {
            ...item,
            active: hasActiveChild || isDirectActive,
            children,
          };
        })
        // Hide parent if it has children config but all children are filtered out
        .filter((item) => {
          // If item originally has children, ensure at least one child remains visible
          const originalItem = this.navItems().find(
            (n) => n.labelKey === item.labelKey
          );
          if (originalItem?.children && originalItem.children.length > 0) {
            return item.children && item.children.length > 0;
          }
          return true;
        })
    );
  });

  private scrollToActiveNavItem(): void {
    const navElement = this.elementRef.nativeElement.querySelector('nav');
    const activeItems = this.activeNavItems();
    const activeIndex = activeItems.findIndex((item) => item.active);

    if (activeIndex === -1 || !navElement) return;

    const listItems = navElement.querySelectorAll('ul > li');
    const activeListItem = listItems[activeIndex] as HTMLElement;

    if (activeListItem) {
      // Calculate scroll position to center the active item
      const scrollLeft =
        activeListItem.offsetLeft -
        navElement.offsetWidth / 2 +
        activeListItem.offsetWidth / 2;

      navElement.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth',
      });
    }
  }

  protected get currentLanguageOption() {
    return this.languageOptions.find(
      (lang) => lang.value === this.currentLanguage()
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isLanguageDropdownOpen.set(false);
      this.isUserDropdownOpen.set(false);
      this.openNavDropdownIndex.set(null);
    }
  }

  protected toggleLanguageDropdown(): void {
    this.isLanguageDropdownOpen.update((prev) => !prev);
    this.isUserDropdownOpen.set(false);
    this.openNavDropdownIndex.set(null);
  }

  protected toggleUserDropdown(): void {
    this.isUserDropdownOpen.update((prev) => !prev);
    this.isLanguageDropdownOpen.set(false);
    this.openNavDropdownIndex.set(null);
  }

  protected toggleNavDropdown(index: number): void {
    this.openNavDropdownIndex.update((prev) => (prev === index ? null : index));
    this.isLanguageDropdownOpen.set(false);
    this.isUserDropdownOpen.set(false);
  }

  protected getDropdownPosition(index: number): {
    top: number;
    left: number;
    right: number | null;
  } {
    const items = this.elementRef.nativeElement.querySelectorAll('nav ul li');
    if (items[index]) {
      const button = items[index].querySelector('button');
      if (button) {
        const rect = button.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const dropdownWidth = 200;
        const padding = 8;

        // If dropdown would overflow right edge, align to right edge of button
        if (rect.left + dropdownWidth > viewportWidth - padding) {
          return {
            top: rect.bottom,
            left: 0,
            right: Math.max(padding, viewportWidth - rect.right),
          };
        }

        // If dropdown would overflow left edge, ensure minimum left position
        const leftPosition = Math.max(padding, rect.left);

        return {
          top: rect.bottom,
          left: leftPosition,
          right: null,
        };
      }
    }
    return { top: 0, left: 0, right: null };
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((prev) => !prev);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    this.openNavDropdownIndex.set(null);
  }

  protected selectLanguage(langValue: SupportedLanguage): void {
    this.translationService.setLanguage(langValue);
    this.currentLanguage.set(langValue);
    this.isLanguageDropdownOpen.set(false);
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected onSearchSubmit(): void {
    const query = this.searchQuery();
    if (query.trim()) {
      // TODO: Implement global search
      console.log('Search query:', query);
    }
  }

  protected logout(): void {
    this.modalService.showConfirmation(
      this.translationService.translate('modal.logoutConfirmTitle'),
      this.translationService.translate('modal.logoutConfirmMessage'),
      () => {
        this.auth.logout();
        this.router.navigateByUrl('/login');
      }
    );
  }

  protected navigateToItem(item: NavItem): void {
    if (item.link) {
      this.router.navigateByUrl(item.link);
      this.closeMobileMenu();
      this.openNavDropdownIndex.set(null);
    }
  }
}
