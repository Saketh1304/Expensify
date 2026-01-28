export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    expenses: number;
  };
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  amount: number;
  period: string;
  startDate: string;
  endDate: string;
  categoryId: string;
  category: Category;
  spent?: number;
  remaining?: number;
  percentUsed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  summary: {
    totalExpenses: number;
    expenseCount: number;
    averageExpense: number;
    percentageChange: number;
  };
  expensesByCategory: Array<{
    category: Category;
    total: number;
    count: number;
  }>;
  recentExpenses: Expense[];
  activeBudgets: Budget[];
}
