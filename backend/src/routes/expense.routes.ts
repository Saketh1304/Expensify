import { Router } from 'express';
import { body } from 'express-validator';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expense.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getExpenses);
router.get('/:id', getExpenseById);

router.post(
  '/',
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('categoryId').notEmpty().withMessage('Category is required'),
  ],
  createExpense
);

router.put(
  '/:id',
  [
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('date').optional().isISO8601().withMessage('Valid date is required'),
    body('categoryId').optional().notEmpty().withMessage('Category cannot be empty'),
  ],
  updateExpense
);

router.delete('/:id', deleteExpense);

export default router;
