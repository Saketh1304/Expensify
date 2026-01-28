import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
} from '@mui/material';
import { TrendingUp, TrendingDown, Receipt, Category } from '@mui/icons-material';
import { dashboardAPI } from '../services/api';
import { getCurrentUser } from '../store/slices/authSlice';
import { AppDispatch } from '../store';
import { format } from 'date-fns';

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(getCurrentUser());
    loadDashboardStats();
  }, [dispatch]);

  const loadDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Expenses
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats?.summary?.totalExpenses || 0)}
                  </Typography>
                </Box>
                <Receipt color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Expense Count
                  </Typography>
                  <Typography variant="h5">{stats?.summary?.expenseCount || 0}</Typography>
                </Box>
                <Category color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Average Expense
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats?.summary?.averageExpense || 0)}
                  </Typography>
                </Box>
                <Receipt color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    vs Last Month
                  </Typography>
                  <Typography variant="h5">
                    {stats?.summary?.percentageChange?.toFixed(1) || 0}%
                  </Typography>
                </Box>
                {(stats?.summary?.percentageChange || 0) >= 0 ? (
                  <TrendingUp color="error" sx={{ fontSize: 40 }} />
                ) : (
                  <TrendingDown color="success" sx={{ fontSize: 40 }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Expenses
            </Typography>
            <List>
              {stats?.recentExpenses?.length > 0 ? (
                stats.recentExpenses.map((expense: any) => (
                  <ListItem
                    key={expense.id}
                    sx={{
                      borderLeft: `4px solid ${expense.category.color}`,
                      mb: 1,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <ListItemText
                      primary={expense.description}
                      secondary={
                        <>
                          {expense.category.name} • {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </>
                      }
                    />
                    <Typography variant="h6" color="primary">
                      {formatCurrency(expense.amount)}
                    </Typography>
                  </ListItem>
                ))
              ) : (
                <Typography color="textSecondary">No recent expenses</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Active Budgets
            </Typography>
            <Box>
              {stats?.activeBudgets?.length > 0 ? (
                stats.activeBudgets.map((budget: any) => (
                  <Box key={budget.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">{budget.category.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(budget.percentUsed, 100)}
                      color={budget.percentUsed > 90 ? 'error' : budget.percentUsed > 75 ? 'warning' : 'primary'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {budget.percentUsed.toFixed(1)}% used
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="textSecondary">No active budgets</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Expenses by Category
            </Typography>
            <Grid container spacing={2}>
              {stats?.expensesByCategory?.map((item: any) => (
                <Grid item xs={12} sm={6} md={4} key={item.category.id}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      borderLeft: `4px solid ${item.category.color}`,
                    }}
                  >
                    <Typography variant="subtitle1">{item.category.name}</Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(item.total)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {item.count} transactions
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
