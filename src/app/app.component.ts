import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { UpcomingKeyDatesComponent } from './components/upcoming-key-dates/upcoming-key-dates.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, UpcomingKeyDatesComponent],
  template: `
    <div class="container">
      <app-upcoming-key-dates></app-upcoming-key-dates>
    </div>
  `,
  styles: [],
})
export class AppComponent {
  title = 'upcoming-key-dates-widget';
}
