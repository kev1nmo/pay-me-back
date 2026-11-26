export type Member = { id: string; name: string };

export type Expense = {
  id: string;
  description: string;
  /** Amount in the currency it was paid in. */
  amount: number;
  currency: string;
  /** Units of the group's base currency per 1 unit of `currency`, frozen when the expense was added. */
  rate: number;
  paidBy: string;
  /** Members who share this expense equally. */
  participants: string[];
  date: string; // YYYY-MM-DD
  /** 'payment' = a repayment between two people, recorded via "Mark paid". */
  kind?: 'expense' | 'payment';
};

export type Group = {
  id: string;
  name: string;
  baseCurrency: string;
  members: Member[];
  expenses: Expense[];
  createdAt: string;
};

export type AppState = {
  version: 1;
  groups: Group[];
  activeGroupId: string | null;
};
