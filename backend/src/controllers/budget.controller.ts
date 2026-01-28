import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

/**
 * GET /api/budgets
 * Optionally filter active budgets
 */
export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { active } = req.query;

    const where: any = { userId };

    if (active === 'true') {
      const now = new Date();
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    const budgets = await prisma.budget.findMany({
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
      orderBy: { startDate: 'desc' },
    });

    const budgetsWithProgress = await Promise.all(
      budgets.map(async (budget) => {
        const spentAgg = await prisma.expense.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            date: {
              gte: budget.startDate,
              lte: budget.endDate,
            },
          },
          _sum: { amount: true },
        });

        const spent = spentAgg._sum.amount || 0;

        return {
          ...budget,
          spent,
          remaining: budget.amount - spent,
          percentUsed: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
        };
      })
    );

    res.json({ budgets: budgetsWithProgress });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

/**
 * GET /api/budgets/:id
 */
export const getBudgetById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    const spentAgg = await prisma.expense.aggregate({
      where: {
        userId,
        categoryId: budget.categoryId,
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      _sum: { amount: true },
    });

    const spent = spentAgg._sum.amount || 0;

    res.json({
      budget: {
        ...budget,
        spent,
        remaining: budget.amount - spent,
        percentUsed: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
};

/**
 * POST /api/budgets
 */
export const createBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.user!.userId;
    const { amount, period, startDate, endDate, categoryId } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      res.status(400).json({ error: 'End date must be after start date' });
      return;
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // 🔒 Prevent overlapping budgets for same category
    const overlapping = await prisma.budget.findFirst({
      where: {
        userId,
        categoryId,
        NOT: {
          OR: [
            { endDate: { lt: start } },
            { startDate: { gt: end } },
          ],
        },
      },
    });

    if (overlapping) {
      res.status(400).json({
        error: 'An overlapping budget already exists for this category',
      });
      return;
    }

    const budget = await prisma.budget.create({
      data: {
        amount: parseFloat(amount),
        period,
        startDate: start,
        endDate: end,
        categoryId,
        userId,
      },
      include: { category: true },
    });

    res.status(201).json({ message: 'Budget created successfully', budget });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
};

/**
 * PUT /api/budgets/:id
 */
export const updateBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.user!.userId;
    const { id } = req.params;
    const { amount, period, startDate, endDate, categoryId } = req.body;

    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    const start = startDate ? new Date(startDate) : existing.startDate;
    const end = endDate ? new Date(endDate) : existing.endDate;
    const finalCategoryId = categoryId || existing.categoryId;

    if (start >= end) {
      res.status(400).json({ error: 'End date must be after start date' });
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

    // 🔒 Prevent overlapping budgets (excluding current)
    const overlapping = await prisma.budget.findFirst({
      where: {
        userId,
        categoryId: finalCategoryId,
        id: { not: id },
        NOT: {
          OR: [
            { endDate: { lt: start } },
            { startDate: { gt: end } },
          ],
        },
      },
    });

    if (overlapping) {
      res.status(400).json({
        error: 'An overlapping budget already exists for this category',
      });
      return;
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        period,
        startDate,
        endDate,
        categoryId,
      },
      include: { category: true },
    });

    res.json({ message: 'Budget updated successfully', budget });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

/**
 * DELETE /api/budgets/:id
 */
export const deleteBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    await prisma.budget.deleteMany({
      where: { id, userId },
    });

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};