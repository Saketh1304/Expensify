import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

/**
 * GET /api/categories
 */
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

/**
 * GET /api/categories/:id
 */
export const getCategoryById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

/**
 * POST /api/categories
 */
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.user!.userId;
    const { name, color, icon } = req.body;

    const existing = await prisma.category.findFirst({
      where: { name, userId },
    });

    if (existing) {
      res.status(400).json({ error: 'Category with this name already exists' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name,
        color: color || '#3b82f6',
        icon: icon || 'Wallet',
        userId,
      },
    });

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

/**
 * PUT /api/categories/:id
 */
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, color, icon } = req.body;

    const existing = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    if (name && name !== existing.name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          name,
          userId,
          id: { not: id },
        },
      });

      if (duplicate) {
        res.status(400).json({ error: 'Category with this name already exists' });
        return;
      }
    }

    await prisma.category.updateMany({
      where: { id, userId },
      data: { name, color, icon },
    });

    const updated = await prisma.category.findFirst({
      where: { id, userId },
    });

    res.json({ message: 'Category updated successfully', category: updated });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

/**
 * DELETE /api/categories/:id
 */
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    if (category._count.expenses > 0) {
      res.status(400).json({
        error: 'Cannot delete category with existing expenses. Please reassign or delete expenses first.',
      });
      return;
    }

    // Optional safety: prevent deleting last category
    const totalCategories = await prisma.category.count({
      where: { userId },
    });

    if (totalCategories <= 1) {
      res.status(400).json({
        error: 'At least one category is required',
      });
      return;
    }

    await prisma.category.deleteMany({
      where: { id, userId },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
