import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { Loan, KeyDateType, DateRange } from '../../models/loan.model';
import { isWithinInterval, parseISO } from 'date-fns';
import loansData from '../../../assets/data/data.json';

@Injectable({
  providedIn: 'root',
})
export class LoanService {
  private readonly loans = loansData;
  private readonly pageSize = 50;

  getLoans(page: number = 1): Observable<{ loans: Loan[]; hasMore: boolean }> {
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const paginatedLoans = this.loans.slice(startIndex, endIndex);
    const hasMore = endIndex < this.loans.length;

    return of({ loans: paginatedLoans, hasMore }).pipe(
      delay(200 + Math.random() * 150) // Simulate network delay
    );
  }

  getLoanById(id: string): Observable<Loan | undefined> {
    return of(this.loans.find((loan) => loan.id === id));
  }

  getLoansByLender(
    lenderReference: string,
    page: number = 1
  ): Observable<{ loans: Loan[]; hasMore: boolean }> {
    const filteredLoans = this.loans.filter(
      (loan) => loan.lender_reference === lenderReference
    );
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const paginatedLoans = filteredLoans.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredLoans.length;

    return of({ loans: paginatedLoans, hasMore }).pipe(
      delay(200 + Math.random() * 150)
    );
  }

  getUniqueLenders(): Observable<string[]> {
    return of([...new Set(this.loans.map((loan) => loan.lender_reference))]);
  }

  // Key Date related methods
  getKeyDatesByType(loans: Loan[], type: KeyDateType): Loan[] {
    return loans.filter((loan) => {
      const keyDates = loan.attributes.key_dates;
      return Object.keys(keyDates).some((date) => date === type);
    });
  }

  getKeyDatesByDateRange(
    loans: Loan[],
    dateRange: DateRange,
    type: KeyDateType
  ): Loan[] {
    const { start, end } = dateRange;
    return loans.filter((loan) => {
      const keyDates = loan.attributes.key_dates;
      const date = keyDates[type];
      if (!date) return false;

      const parsedDate = parseISO(date);
      return isWithinInterval(parsedDate, { start, end });
    });
  }

  getPastKeyDates(loans: Loan[]): Loan[] {
    return loans.filter((loan) => {
      const pastDates = loan.attributes.past_key_dates;
      return Object.keys(pastDates).length > 0;
    });
  }

  getUpcomingKeyDates(loans: Loan[]): Loan[] {
    return loans.filter((loan) => {
      const keyDates = loan.attributes.key_dates;
      return Object.keys(keyDates).length > 0;
    });
  }

  getInvalidKeyDates(loans: Loan[]): Loan[] {
    return loans.filter((loan) => {
      const keyDates = loan.attributes.key_dates;
      return Object.values(keyDates).some((date) => date === 'Invalid Date');
    });
  }
}
