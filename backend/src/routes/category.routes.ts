import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getCategories);
router.get('/:id', getCategoryById);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('color').optional().isString().withMessage('Color must be a string'),
    body('icon').optional().isString().withMessage('Icon must be a string'),
  ],
  createCategory
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
    body('color').optional().isString().withMessage('Color must be a string'),
    body('icon').optional().isString().withMessage('Icon must be a string'),
  ],
  updateCategory
);

router.delete('/:id', deleteCategory);

export default router;
