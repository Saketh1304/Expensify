import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate } = req.query;

    // ✅ Normalize date range to UTC
    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          1,
          0, 0, 0, 0
        ));

    const end = endDate
      ? new Date(endDate as string)
      : new Date(Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth() + 1,
          0,
          23, 59, 59, 999
        ));

    // -------------------- SUMMARY --------------------
    const totalExpenses = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    const currentTotal = totalExpenses._sum.amount || 0;
    const expenseCount = totalExpenses._count;

    // -------------------- EXPENSES BY CATEGORY --------------------
    const grouped = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    const expensesByCategory = await Promise.all(
      grouped.map(async (item) => {
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

    // -------------------- RECENT EXPENSES --------------------
    const recentExpenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
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

    // -------------------- ACTIVE BUDGETS --------------------
    const now = new Date();

    const activeBudgets = await prisma.budget.findMany({
      where: {
        userId,
        startDate: { lte: now },
        endDate: { gte: now },
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

    // -------------------- PREVIOUS PERIOD COMPARISON --------------------
    const prevStart = new Date(start);
    prevStart.setUTCMonth(prevStart.getUTCMonth() - 1);

    const prevEnd = new Date(end);
    prevEnd.setUTCMonth(prevEnd.getUTCMonth() - 1);

    const prevTotalAgg = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: prevStart,
          lte: prevEnd,
        },
      },
      _sum: { amount: true },
    });

    const previousTotal = prevTotalAgg._sum.amount || 0;

    const percentageChange =
      previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : 0;

    // -------------------- RESPONSE --------------------
    res.json({
      summary: {
        totalExpenses: currentTotal,
        expenseCount,
        averageExpense: expenseCount > 0 ? currentTotal / expenseCount : 0,
        percentageChange,
      },
      expensesByCategory,
      recentExpenses,
      activeBudgets: budgetsWithProgress,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};
