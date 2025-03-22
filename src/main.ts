import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { UpcomingKeyDatesComponent } from './app/components/upcoming-key-dates/upcoming-key-dates.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  MAT_RIPPLE_GLOBAL_OPTIONS,
  RippleGlobalOptions,
} from '@angular/material/core';

// Global ripple configuration
const globalRippleConfig: RippleGlobalOptions = {
  disabled: true, // Disable ripples globally
};

// Merge with existing app config
const configWithRipple = {
  providers: [
    ...(appConfig.providers || []),
    { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: globalRippleConfig },
  ],
};

bootstrapApplication(UpcomingKeyDatesComponent, configWithRipple).catch((err) =>
  console.error(err)
);
