import { Router } from 'express';
import { body } from 'express-validator';
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../controllers/budget.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getBudgets);
router.get('/:id', getBudgetById);

router.post(
  '/',
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('period').trim().notEmpty().withMessage('Period is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('categoryId').notEmpty().withMessage('Category is required'),
  ],
  createBudget
);

router.put(
  '/:id',
  [
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('period').optional().trim().notEmpty().withMessage('Period cannot be empty'),
    body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    body('categoryId').optional().notEmpty().withMessage('Category cannot be empty'),
  ],
  updateBudget
);

router.delete('/:id', deleteBudget);

export default router;