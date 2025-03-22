export interface Loan {
  id: string;
  type: string;
  attributes: {
    past_key_dates: Partial<Record<string, string>>;
    key_dates: Partial<Record<string, string>>;
  };
  lender_reference: string;
  purpose: string;
  amount: number;
  user_reference: number;
  client_account: {
    id: string;
    primary_applicant_info: {
      mobile: string;
      email: string;
    };
    name: string;
  };
}

export type KeyDateType =
  | 'Fixed Rate Expiry'
  | 'Auction Date'
  | 'Pre-Approval Expiry'
  | 'Finance Due'
  | 'Est. Settlement Date'
  | 'All';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}
