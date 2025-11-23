import { Router } from 'express';

import { fetchFundDetails, fetchFunds, fetchFundsFiltered, fetchHistoricalNav, sebiDisclaimer } from '../../services/mfapi';

const router = Router();

router.get('/', async (req, res) => {
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

router.get('/:schemeCode', async (req, res) => {
  const schemeCode = req.params.schemeCode;
  try {
    const fund = await fetchFundDetails(schemeCode);
    res.json({
      success: true,
      fund,
      disclaimer: sebiDisclaimer,
      source: 'MFapi.in',
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fund not found',
      source: 'MFapi.in'
    });
  }
});

router.get('/:schemeCode/nav', async (req, res) => {
  const schemeCode = req.params.schemeCode;
  const { start, end } = req.query;
  try {
    const navHistory = await fetchHistoricalNav(schemeCode, start as string | undefined, end as string | undefined);
    res.json({
      success: true,
      navHistory,
      disclaimer: sebiDisclaimer,
      source: 'MFapi.in',
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'NAV history not found',
      source: 'MFapi.in'
    });
  }
});

export default router;
