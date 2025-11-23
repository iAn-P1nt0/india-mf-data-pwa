import { Router } from 'express';

import { fetchFunds, fetchFundsFiltered, sebiDisclaimer } from '../services/mfapi';

const router = Router();

router.get('/funds', async (req, res) => {
  const limitParam = Number(req.query.limit ?? '10');
  const limit = Number.isFinite(limitParam) ? limitParam : 10;
  const query = typeof req.query.q === 'string' ? req.query.q : '';

  try {
    const funds = query ? await fetchFundsFiltered(query, limit) : await fetchFunds(limit);

    res.json({
      success: true,
      count: funds.length,
      funds,
      disclaimer: sebiDisclaimer,
      source: 'MFapi.in',
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(502).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unable to fetch funds',
      source: 'MFapi.in'
    });
  }
});

export default router;
