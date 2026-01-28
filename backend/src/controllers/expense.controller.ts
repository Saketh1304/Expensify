import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

/**
 * GET /api/expenses
 * Filters: startDate, endDate, categoryId
 * Pagination: page, limit
 */
export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate, categoryId, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        const start = new Date(startDate as string);
        start.setUTCHours(0, 0, 0, 0);
        where.date.gte = start;
      }

      if (endDate) {
        const end = new Date(endDate as string);
        end.setUTCHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      expenses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

/**
 * GET /api/expenses/:id
 */
export const getExpenseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const expense = await prisma.expense.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

/**
 * POST /api/expenses
 */
export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.user!.userId;
    const { amount, description, date, categoryId } = req.body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Invalid date' });
      return;
    }

    // ✅ FIX: normalize date to safe UTC midday
    parsedDate.setUTCHours(12, 0, 0, 0);

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parsedAmount,
        description,
        date: parsedDate,
        categoryId,
        userId,
      },
      include: { category: true },
    });

    res.status(201).json({ message: 'Expense created successfully', expense });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

/**
 * PUT /api/expenses/:id
 */
export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.user!.userId;
    const { id } = req.params;
    const { amount, description, date, categoryId } = req.body;

    const existing = await prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId },
      });

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
    }

    const data: any = {};

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Invalid amount' });
        return;
      }
      data.amount = parsedAmount;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'Invalid date' });
        return;
      }

      // ✅ FIX: normalize updated date too
      parsedDate.setUTCHours(12, 0, 0, 0);
      data.date = parsedDate;
    }

    if (description !== undefined) data.description = description;
    if (categoryId !== undefined) data.categoryId = categoryId;

    await prisma.expense.updateMany({
      where: { id, userId },
      data,
    });

    const updated = await prisma.expense.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    res.json({ message: 'Expense updated successfully', expense: updated });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

/**
 * DELETE /api/expenses/:id
 */
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const expense = await prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    await prisma.expense.deleteMany({
      where: { id, userId },
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};
