import '@angular/compiler';
import '@analogjs/vitest-angular/setup-zone';

import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { getTestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

registerLocaleData(localeVi, 'vi-VN');

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting()
);
