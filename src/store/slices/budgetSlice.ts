import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { budgetAPI } from '../../services/api';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Budget {
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

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
}

const initialState: BudgetState = {
  budgets: [],
  loading: false,
  error: null,
};

export const fetchBudgets = createAsyncThunk(
  'budgets/fetchBudgets',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await budgetAPI.getBudgets(params);
      return response.data.budgets;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch budgets');
    }
  }
);

export const createBudget = createAsyncThunk(
  'budgets/createBudget',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await budgetAPI.createBudget(data);
      return response.data.budget;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create budget');
    }
  }
);

export const updateBudget = createAsyncThunk(
  'budgets/updateBudget',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await budgetAPI.updateBudget(id, data);
      return response.data.budget;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update budget');
    }
  }
);

export const deleteBudget = createAsyncThunk(
  'budgets/deleteBudget',
  async (id: string, { rejectWithValue }) => {
    try {
      await budgetAPI.deleteBudget(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete budget');
    }
  }
);

const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action: PayloadAction<Budget[]>) => {
        state.loading = false;
        state.budgets = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createBudget.fulfilled, (state, action: PayloadAction<Budget>) => {
        state.budgets.push(action.payload);
      })
      .addCase(updateBudget.fulfilled, (state, action: PayloadAction<Budget>) => {
        const index = state.budgets.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.budgets[index] = action.payload;
        }
      })
      .addCase(deleteBudget.fulfilled, (state, action: PayloadAction<string>) => {
        state.budgets = state.budgets.filter((b) => b.id !== action.payload);
      });
  },
});

export const { clearError } = budgetSlice.actions;
export default budgetSlice.reducer;
