import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  MAT_DATE_FORMATS,
  DateAdapter,
  MAT_DATE_LOCALE,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormControl } from '@angular/forms';
import { LoanService } from '../../core/services/loan.service';
import { Loan } from '../../models/loan.model';
import {
  format,
  parse,
  isBefore,
  isSameDay,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from 'date-fns';
import { ViewportScroller } from '@angular/common';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthLabel: 'MMMM YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
    monthYearText: 'MMMM YYYY',
  },
};

type KeyDateType =
  | 'All'
  | 'Fixed Rate Expiry'
  | 'Auction Date'
  | 'Pre-Approval Expiry'
  | 'Finance Due'
  | 'Est. Settlement Date';

interface DateRange {
  label: string;
  start: Date;
  end: Date;
}

@Component({
  selector: 'upcoming-key-dates-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: NativeDateAdapter,
    },
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'en-AU',
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: MY_DATE_FORMATS,
    },
  ],
  templateUrl: './upcoming-key-dates.component.html',
  styleUrls: ['./upcoming-key-dates.component.scss'],
})
export class UpcomingKeyDatesComponent implements OnInit {
  displayedColumns: string[] = [
    'client',
    'lenderReference',
    'keyDate',
    'type',
    'contact',
  ];
  dataSource: MatTableDataSource<Loan> = new MatTableDataSource<Loan>([]);
  loading = true;
  loadingMore = false;
  error: string | null = null;
  selectedDateType: KeyDateType = 'All';
  dateTypes: KeyDateType[] = [
    'All',
    'Fixed Rate Expiry',
    'Auction Date',
    'Pre-Approval Expiry',
    'Finance Due',
    'Est. Settlement Date',
  ];
  currentPage = 1;
  hasMore = true;

  dateRange = new FormGroup({
    start: new FormControl<Date | null>(new Date()),
    end: new FormControl<Date | null>(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ),
  });

  @ViewChild(MatSort) sort!: MatSort;

  private readonly PREDEFINED_DATE_RANGES: DateRange[] = [
    {
      label: 'All records',
      start: new Date(Date.now() - 7300 * 24 * 60 * 60 * 1000), // ~20 years ago
      end: new Date(Date.now() + 7300 * 24 * 60 * 60 * 1000), // ~20 years ahead
    },
    {
      label: 'Today',
      start: new Date(),
      end: new Date(),
    },
    {
      label: 'Past 90 days',
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    {
      label: 'Past 60 days',
      start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    {
      label: 'Past 30 days',
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    {
      label: 'Next 30 days',
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      label: 'Next 60 days',
      start: new Date(),
      end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      label: 'Next 90 days',
      start: new Date(),
      end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      label: 'Custom range',
      start: new Date(),
      end: new Date(),
    },
  ];

  predefinedDateRanges: DateRange[] = this.PREDEFINED_DATE_RANGES;

  selectedDateRange: DateRange = {
    label: 'All records',
    start: new Date(Date.now() - 7300 * 24 * 60 * 60 * 1000),
    end: new Date(Date.now() + 7300 * 24 * 60 * 60 * 1000),
  };

  constructor(
    private loanService: LoanService,
    private viewportScroller: ViewportScroller
  ) {
    // Initialize with All records as default
    const defaultRange = this.predefinedDateRanges.find(
      (range) => range.label === 'All records'
    );
    if (defaultRange) {
      this.selectedDateRange = defaultRange;
      this.dateRange.setValue({
        start: defaultRange.start,
        end: defaultRange.end,
      });
    }
  }

  ngOnInit(): void {
    this.loadLoans();
  }

  ngAfterViewInit() {
    // Use setTimeout to handle Angular change detection cycles
    setTimeout(() => {
      // Set the sort property after view initialization is complete
      if (this.dataSource && this.sort) {
        this.dataSource.sort = this.sort;

        // Configure sorting accessors for each column exactly as required
        this.dataSource.sortingDataAccessor = (
          item: Loan,
          property: string
        ): string | number => {
          switch (property) {
            case 'client':
              return item.client_account.name.toLowerCase();
            case 'lenderReference':
              return item.lender_reference.toLowerCase();
            case 'keyDate':
              const keyDateEntries = this.getKeyDateEntries(item);
              return keyDateEntries.length > 0
                ? parse(
                    keyDateEntries[0].date,
                    'dd/MM/yyyy, HH:mm:ss',
                    new Date()
                  ).getTime()
                : 0;
            case 'type':
              const typeEntries = this.getKeyDateEntries(item);
              return typeEntries.length > 0
                ? typeEntries[0].type.toLowerCase()
                : '';
            default:
              return '';
          }
        };
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (
      this.isNearBottom() &&
      !this.loading &&
      !this.loadingMore &&
      this.hasMore
    ) {
      this.loadMore();
    }
  }

  private isNearBottom(): boolean {
    const threshold = 300;
    const position = this.viewportScroller.getScrollPosition()[1];
    const height = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    return position + windowHeight + threshold >= height;
  }

  loadLoans(): void {
    this.loading = true;
    this.error = null;
    this.currentPage = 1;
    this.hasMore = true;

    this.loanService.getLoans(this.currentPage).subscribe({
      next: (response) => {
        const filteredLoans = this.filterLoans(response.loans);

        // Store current sort state before creating new dataSource
        const sortActive = this.sort?.active;
        const sortDirection = this.sort?.direction;

        // Create new dataSource
        this.dataSource = new MatTableDataSource(filteredLoans);

        // Apply sorting configuration
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }

        // Configure sorting accessors
        this.dataSource.sortingDataAccessor = (
          item: Loan,
          property: string
        ): string | number => {
          switch (property) {
            case 'client':
              return item.client_account.name.toLowerCase();
            case 'lenderReference':
              return item.lender_reference.toLowerCase();
            case 'keyDate':
              const keyDateEntries = this.getKeyDateEntries(item);
              return keyDateEntries.length > 0
                ? parse(
                    keyDateEntries[0].date,
                    'dd/MM/yyyy, HH:mm:ss',
                    new Date()
                  ).getTime()
                : 0;
            case 'type':
              const typeEntries = this.getKeyDateEntries(item);
              return typeEntries.length > 0
                ? typeEntries[0].type.toLowerCase()
                : '';
            default:
              return '';
          }
        };

        // Re-apply sort if it was active
        if (this.sort && sortActive && sortDirection) {
          this.sort.active = sortActive;
          this.sort.direction = sortDirection;
          this.sort.sortChange.emit({
            active: sortActive,
            direction: sortDirection,
          });
        }

        this.hasMore = response.hasMore;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load loans. Please try again later.';
        this.loading = false;
        console.error('Error loading loans:', error);
      },
    });
  }

  loadMore(): void {
    if (this.loadingMore) return;

    this.loadingMore = true;
    this.currentPage++;

    this.loanService.getLoans(this.currentPage).subscribe({
      next: (response) => {
        const filteredLoans = this.filterLoans(response.loans);
        const currentData = this.dataSource.data;
        this.dataSource.data = [...currentData, ...filteredLoans];

        // Ensure sort is maintained
        this.dataSource.sort = this.sort;

        this.hasMore = response.hasMore;
        this.loadingMore = false;
      },
      error: (error) => {
        console.error('Error loading more loans:', error);
        this.loadingMore = false;
      },
    });
  }

  filterLoans(loans: Loan[]): Loan[] {
    let filteredLoans = loans;

    // First filter by date range
    if (this.dateRange.value.start && this.dateRange.value.end) {
      const startDate = startOfDay(this.dateRange.value.start);
      const endDate = endOfDay(this.dateRange.value.end);

      filteredLoans = loans.filter((loan) => {
        const keyDates = loan.attributes.key_dates || {};
        return Object.values(keyDates).some((date) => {
          if (typeof date === 'string') {
            const keyDate = parse(date, 'dd/MM/yyyy, HH:mm:ss', new Date());
            return isWithinInterval(keyDate, {
              start: startDate,
              end: endDate,
            });
          }
          return false;
        });
      });
    }

    // Then filter by date type if not 'All'
    if (this.selectedDateType !== 'All') {
      filteredLoans = filteredLoans.filter((loan) => {
        const keyDates = loan.attributes.key_dates || {};
        return Object.entries(keyDates).some(
          ([type]) => type === this.selectedDateType
        );
      });
    }

    return filteredLoans;
  }

  onDateTypeChange(type: KeyDateType): void {
    this.selectedDateType = type;
    if (this.dataSource) {
      this.loadLoans();
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  }

  formatDate(dateString: string): string {
    try {
      return format(
        parse(dateString, 'dd/MM/yyyy, HH:mm:ss', new Date()),
        'dd/MM/yyyy'
      );
    } catch {
      return 'Invalid Date';
    }
  }

  getKeyDateEntries(loan: Loan): Array<{ type: string; date: string }> {
    const entries = Object.entries(loan.attributes.key_dates || {});
    return entries
      .filter(([_, date]) => typeof date === 'string')
      .map(([type, date]) => ({ type, date: date as string }));
  }

  getDateClass(dateString: string): string {
    try {
      const date = parse(dateString, 'dd/MM/yyyy, HH:mm:ss', new Date());
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const threeDaysFromNow = new Date(
        today.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      // If date is today, tomorrow, or in the past
      if (isSameDay(date, tomorrow) || isBefore(date, tomorrow)) {
        return 'critical-date';
      }
      // If within 3 days from now
      else if (isBefore(date, threeDaysFromNow)) {
        return 'upcoming-date';
      }
      return '';
    } catch {
      return 'invalid-date';
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  compareDateRanges(range1: DateRange, range2: DateRange): boolean {
    return range1?.label === range2?.label;
  }

  onDateRangeChange(): void {
    const start = this.dateRange.get('start')?.value;
    const end = this.dateRange.get('end')?.value;

    // Only proceed if both dates are selected
    if (!start || !end) {
      return;
    }

    // Check if the selected dates match any predefined range
    const matchingRange = this.predefinedDateRanges.find((range) => {
      if (range.label === 'Custom range') return false;
      const rangeStart = startOfDay(range.start);
      const rangeEnd = startOfDay(range.end);
      const selectedStart = startOfDay(start);
      const selectedEnd = startOfDay(end);
      return (
        rangeStart.getTime() === selectedStart.getTime() &&
        rangeEnd.getTime() === selectedEnd.getTime()
      );
    });

    if (matchingRange) {
      // If dates match a predefined range, select it
      this.selectedDateRange = { ...matchingRange };
    } else {
      // If no match found, set to Custom range with the selected dates
      const customRange = this.predefinedDateRanges.find(
        (range) => range.label === 'Custom range'
      );
      if (customRange) {
        this.selectedDateRange = {
          ...customRange,
          start,
          end,
        };
      }
    }

    // Only reload data if both dates are valid
    this.loadLoans();
  }

  setDateRange(range: DateRange): void {
    this.selectedDateRange = range;
    this.dateRange.setValue({
      start: range.start,
      end: range.end,
    });
    // Since both dates are set here, we can safely reload
    this.loadLoans();
  }

  handleCustomSort(column: string): void {
    // Manual sorting implementation
    if (!this.dataSource.data || this.dataSource.data.length === 0) {
      console.log('No data to sort');
      return;
    }

    let direction = this.sort.direction;
    if (!direction) {
      return;
    }

    // Sort the data manually for asc/desc
    const sortedData = [...this.dataSource.data].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (column) {
        case 'client':
          valueA = a.client_account.name.toLowerCase();
          valueB = b.client_account.name.toLowerCase();
          break;
        case 'lenderReference':
          valueA = a.lender_reference.toLowerCase();
          valueB = b.lender_reference.toLowerCase();
          break;
        case 'keyDate':
          const keyDateEntriesA = this.getKeyDateEntries(a);
          const keyDateEntriesB = this.getKeyDateEntries(b);
          valueA =
            keyDateEntriesA.length > 0
              ? parse(
                  keyDateEntriesA[0].date,
                  'dd/MM/yyyy, HH:mm:ss',
                  new Date()
                ).getTime()
              : 0;
          valueB =
            keyDateEntriesB.length > 0
              ? parse(
                  keyDateEntriesB[0].date,
                  'dd/MM/yyyy, HH:mm:ss',
                  new Date()
                ).getTime()
              : 0;
          break;
        case 'type':
          const typeEntriesA = this.getKeyDateEntries(a);
          const typeEntriesB = this.getKeyDateEntries(b);
          valueA =
            typeEntriesA.length > 0 ? typeEntriesA[0].type.toLowerCase() : '';
          valueB =
            typeEntriesB.length > 0 ? typeEntriesB[0].type.toLowerCase() : '';
          break;
        default:
          return 0;
      }

      // Compare the values
      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;

      // Apply sort direction
      return direction === 'asc' ? comparison : -comparison;
    });

    // Update the data source with sorted data
    this.dataSource.data = sortedData;
  }
}
