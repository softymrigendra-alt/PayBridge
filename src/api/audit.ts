import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

/**
 * GET /api/audit/:opportunityId
 * Get audit log for a specific opportunity
 */
router.get('/:opportunityId', async (req: Request, res: Response) => {
  const { opportunityId } = req.params;

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: { id: true },
  });

  if (!opportunity) throw new AppError('Opportunity not found', 404);

  const logs = await prisma.auditLog.findMany({
    where: { opportunityId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: logs });
});

export default router;
