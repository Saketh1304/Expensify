import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import expenseRoutes from './routes/expense.routes';
import categoryRoutes from './routes/category.routes';
import budgetRoutes from './routes/budget.routes';
import dashboardRoutes from './routes/dashboard.routes';

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


export default app;