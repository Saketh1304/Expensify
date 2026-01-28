import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { fetchBudgets, createBudget, updateBudget, deleteBudget } from '../store/slices/budgetSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import { RootState, AppDispatch } from '../store';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { CircularProgress } from '@mui/material';
const Budgets = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { budgets, loading } = useSelector((state: RootState) => state.budgets);
  const { categories } = useSelector((state: RootState) => state.categories);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: '',
    period: 'monthly',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    categoryId: '',
  });

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBudgets({ active: true }));
  }, [dispatch]);

  if (loading) {
  return (
    <Box
      sx={{
        height: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

  const handleOpenDialog = (budget?: any) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        amount: budget.amount.toString(),
        period: budget.period,
        startDate: format(new Date(budget.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(budget.endDate), 'yyyy-MM-dd'),
        categoryId: budget.categoryId,
      });
    } else {
      setEditingBudget(null);
      setFormData({
        amount: '',
        period: 'monthly',
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        categoryId: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBudget(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
  try {
    const payload = {
      amount: Number(formData.amount),
      period: formData.period,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      categoryId: formData.categoryId,
    };

    if (editingBudget) {
      await dispatch(
        updateBudget({
          id: editingBudget.id,
          data: payload,
        })
      ).unwrap();
    } else {
      await dispatch(createBudget(payload)).unwrap();
    }

    handleCloseDialog();
    dispatch(fetchBudgets({ active: true }));
  } catch (error) {
    console.error('Failed to save budget:', error);
  }
};



  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      await dispatch(deleteBudget(id));
      dispatch(fetchBudgets({ active: true }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
}).format(amount);

  };

  const getStatusColor = (percentUsed: number) => {
    if (percentUsed >= 100) return 'error';
    if (percentUsed >= 90) return 'error';
    if (percentUsed >= 75) return 'warning';
    return 'success';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Budgets</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Budget
        </Button>
      </Box>

      <Grid container spacing={3}>
        {budgets.map((budget) => (
          <Grid item xs={12} md={6} key={budget.id}>
            <Card
              sx={{
                borderLeft: `6px solid ${budget.category.color}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{budget.category.name}</Typography>
                    <Chip label={budget.period} size="small" sx={{ mt: 0.5 }} />
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(budget)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(budget.id)}>
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Spent
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {formatCurrency(budget.spent || 0)} / {formatCurrency(budget.amount)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(budget.percentUsed || 0, 100)}
                    color={getStatusColor(budget.percentUsed || 0)}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      {(budget.percentUsed || 0).toFixed(1)}% used
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatCurrency(budget.remaining || 0)} remaining
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="textSecondary">
                    {format(new Date(budget.startDate), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {format(new Date(budget.endDate), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBudget ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
        <DialogContent>
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
            label="Period"
            name="period"
            select
            fullWidth
            value={formData.period}
            onChange={handleChange}
            required
          >
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="quarterly">Quarterly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </TextField>
          <TextField
            margin="normal"
            label="Start Date"
            name="startDate"
            type="date"
            fullWidth
            value={formData.startDate}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="normal"
            label="End Date"
            name="endDate"
            type="date"
            fullWidth
            value={formData.endDate}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingBudget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Budgets;