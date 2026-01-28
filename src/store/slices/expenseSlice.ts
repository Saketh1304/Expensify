import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { expenseAPI } from '../../services/api';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseState {
  expenses: Expense[];
  currentExpense: Expense | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: ExpenseState = {
  expenses: [],
  currentExpense: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  },
};

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await expenseAPI.getExpenses(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch expenses');
    }
  }
);

export const fetchExpenseById = createAsyncThunk(
  'expenses/fetchExpenseById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await expenseAPI.getExpenseById(id);
      return response.data.expense;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch expense');
    }
  }
);

export const createExpense = createAsyncThunk(
  'expenses/createExpense',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await expenseAPI.createExpense(data);
      return response.data.expense;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create expense');
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await expenseAPI.updateExpense(id, data);
      return response.data.expense;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update expense');
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (id: string, { rejectWithValue }) => {
    try {
      await expenseAPI.deleteExpense(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete expense');
    }
  }
);

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.expenses = action.payload.expenses;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchExpenseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseById.fulfilled, (state, action: PayloadAction<Expense>) => {
        state.loading = false;
        state.currentExpense = action.payload;
      })
      .addCase(fetchExpenseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
        state.loading = false;
        state.expenses.unshift(action.payload);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })
      .addCase(deleteExpense.fulfilled, (state, action: PayloadAction<string>) => {
        state.expenses = state.expenses.filter((e) => e.id !== action.payload);
      });
  },
});

export const { clearError } = expenseSlice.actions;
export default expenseSlice.reducer;
