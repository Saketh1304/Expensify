import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  TablePagination,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from '../store/slices/expenseSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import { RootState, AppDispatch } from '../store';
import { format } from 'date-fns';

const Expenses = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { expenses, loading, pagination } = useSelector((state: RootState) => state.expenses);
  const { categories } = useSelector((state: RootState) => state.categories);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    categoryId: '',
  });
  const [page, setPage] = useState(0);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchExpenses({ page: page + 1 }));
  }, [dispatch, page]);

  const handleOpenDialog = (expense?: any) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        amount: expense.amount.toString(),
        description: expense.description,
        date: format(new Date(expense.date), 'yyyy-MM-dd'),
        categoryId: expense.categoryId,
      });
    } else {
      setEditingExpense(null);
      setFormData({
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        categoryId: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingExpense(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (editingExpense) {
      await dispatch(updateExpense({ id: editingExpense.id, data: formData }));
    } else {
      await dispatch(createExpense(formData));
    }
    handleCloseDialog();
    dispatch(fetchExpenses({ page: page + 1 }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await dispatch(deleteExpense(id));
      dispatch(fetchExpenses({ page: page + 1 }));
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Expenses</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Expense
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>
                  <Chip
                    label={expense.category.name}
                    size="small"
                    sx={{
                      bgcolor: expense.category.color,
                      color: 'white',
                    }}
                  />
                </TableCell>
                <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleOpenDialog(expense)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(expense.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pagination.limit}
          rowsPerPageOptions={[pagination.limit]}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            label="Amount"
            name="amount"
            type="number"
            fullWidth
            value={formData.amount}
            onChange={handleChange}
            required
          />
          <TextField
            margin="normal"
            label="Description"
            name="description"
            fullWidth
            value={formData.description}
            onChange={handleChange}
            required
          />
          <TextField
            margin="normal"
            label="Date"
            name="date"
            type="date"
            fullWidth
            value={formData.date}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="normal"
            label="Category"
            name="categoryId"
            select
            fullWidth
            value={formData.categoryId}
            onChange={handleChange}
            required
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingExpense ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Expenses;
