import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { startOfMonth, endOfDay } from 'date-fns';
const prisma = new PrismaClient();

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { startDate, endDate } = req.query;

    const start = startDate
  ? new Date(startDate as string)
  : startOfMonth(new Date());

const end = endDate
  ? new Date(endDate as string)
  : endOfDay(new Date());

    const totalExpenses = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const categoriesData = await Promise.all(
      expensesByCategory.map(async (item) => {
        const category = await prisma.category.findUnique({
          where: { id: item.categoryId },
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        });

        return {
          category,
          total: item._sum.amount || 0,
          count: item._count,
        };
      })
    );

    const recentExpenses = await prisma.expense.findMany({
      where: { userId },
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
      take: 5,
    });

    const activeBudgets = await prisma.budget.findMany({
      where: {
        userId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
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
    });

    const budgetsWithProgress = await Promise.all(
      activeBudgets.map(async (budget) => {
        const spent = await prisma.expense.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            date: {
              gte: budget.startDate,
              lte: budget.endDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        return {
          ...budget,
          spent: spent._sum.amount || 0,
          remaining: budget.amount - (spent._sum.amount || 0),
          percentUsed: ((spent._sum.amount || 0) / budget.amount) * 100,
        };
      })
    );

    const previousPeriodStart = new Date(start);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    const previousPeriodEnd = new Date(end);
    previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);

    const previousPeriodTotal = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const currentTotal = totalExpenses._sum.amount || 0;
    const previousTotal = previousPeriodTotal._sum.amount || 0;
    const percentageChange = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

    res.json({
      summary: {
        totalExpenses: currentTotal,
        expenseCount: totalExpenses._count,
        averageExpense: totalExpenses._count > 0 ? currentTotal / totalExpenses._count : 0,
        percentageChange,
      },
      expensesByCategory: categoriesData,
      recentExpenses,
      activeBudgets: budgetsWithProgress,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};
