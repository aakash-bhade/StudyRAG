import { getAdminOverview } from '../services/adminService.js';

export async function adminOverviewAction(req, res, next) {
  try {
    const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 25));
    const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
    res.json(await getAdminOverview({ page, limit, query }));
  } catch (error) { next(error); }
}
