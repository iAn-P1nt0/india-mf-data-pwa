import { useMemo } from 'react';

export interface CategoryPerformance {
  category: string;
  returns: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
  };
  fundCount: number;
  avgExpenseRatio: number;
  bestPerformer: string;
  worstPerformer: string;
}

export interface Fund {
  schemeCode: string;
  schemeName: string;
  schemeCategory: string;
  expenseRatio?: number;
  returns?: {
    oneYear?: number;
    threeYear?: number;
    fiveYear?: number;
  };
}

/**
 * Hook to aggregate fund performance by category
 * Calculates average returns and other metrics for each category
 */
export function useHeatmapData(funds: Fund[]): CategoryPerformance[] {
  return useMemo(() => {
    const categoryMap = new Map<string, Fund[]>();

    // Group funds by category
    funds.forEach((fund) => {
      const category = fund.schemeCategory || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(fund);
    });

    // Calculate aggregates for each category
    const results: CategoryPerformance[] = [];

    categoryMap.forEach((categoryFunds, category) => {
      const oneYearReturns = categoryFunds
        .filter((f) => f.returns?.oneYear !== undefined)
        .map((f) => f.returns!.oneYear!)
        .sort((a, b) => b - a);

      const threeYearReturns = categoryFunds
        .filter((f) => f.returns?.threeYear !== undefined)
        .map((f) => f.returns!.threeYear!)
        .sort((a, b) => b - a);

      const fiveYearReturns = categoryFunds
        .filter((f) => f.returns?.fiveYear !== undefined)
        .map((f) => f.returns!.fiveYear!)
        .sort((a, b) => b - a);

      const expenseRatios = categoryFunds
        .filter((f) => f.expenseRatio !== undefined)
        .map((f) => f.expenseRatio!);

      // Calculate averages
      const avgOneYear =
        oneYearReturns.length > 0
          ? oneYearReturns.reduce((a, b) => a + b, 0) / oneYearReturns.length
          : 0;

      const avgThreeYear =
        threeYearReturns.length > 0
          ? threeYearReturns.reduce((a, b) => a + b, 0) / threeYearReturns.length
          : 0;

      const avgFiveYear =
        fiveYearReturns.length > 0
          ? fiveYearReturns.reduce((a, b) => a + b, 0) / fiveYearReturns.length
          : 0;

      const avgExpenseRatio =
        expenseRatios.length > 0
          ? expenseRatios.reduce((a, b) => a + b, 0) / expenseRatios.length
          : 0;

      // Find best and worst performers
      const bestPerformer =
        oneYearReturns.length > 0
          ? categoryFunds.find(
              (f) => f.returns?.oneYear === oneYearReturns[0]
            )?.schemeName || 'N/A'
          : 'N/A';

      const worstPerformer =
        oneYearReturns.length > 0
          ? categoryFunds.find(
              (f) =>
                f.returns?.oneYear === oneYearReturns[oneYearReturns.length - 1]
            )?.schemeName || 'N/A'
          : 'N/A';

      results.push({
        category,
        returns: {
          oneYear: avgOneYear,
          threeYear: avgThreeYear,
          fiveYear: avgFiveYear
        },
        fundCount: categoryFunds.length,
        avgExpenseRatio,
        bestPerformer,
        worstPerformer
      });
    });

    // Sort by category name for consistent display
    return results.sort((a, b) => a.category.localeCompare(b.category));
  }, [funds]);
}

/**
 * Hook to get comparative performance ranking
 */
export function useCategoryRanking(
  categoryPerformance: CategoryPerformance[],
  period: 'oneYear' | 'threeYear' | 'fiveYear'
) {
  return useMemo(() => {
    const ranked = [...categoryPerformance].sort(
      (a, b) => b.returns[period] - a.returns[period]
    );

    return ranked.map((category, index) => ({
      ...category,
      rank: index + 1
    }));
  }, [categoryPerformance, period]);
}

/**
 * Hook to get category statistics
 */
export function useCategoryStats(categoryPerformance: CategoryPerformance[]) {
  return useMemo(() => {
    if (categoryPerformance.length === 0) {
      return {
        bestCategory: null,
        worstCategory: null,
        avgCategoryReturn: { oneYear: 0, threeYear: 0, fiveYear: 0 },
        totalFunds: 0
      };
    }

    const byOneYear = [...categoryPerformance].sort(
      (a, b) => b.returns.oneYear - a.returns.oneYear
    );

    const totalFunds = categoryPerformance.reduce(
      (sum, cat) => sum + cat.fundCount,
      0
    );

    const avgOneYear =
      categoryPerformance.reduce((sum, cat) => sum + cat.returns.oneYear, 0) /
      categoryPerformance.length;

    const avgThreeYear =
      categoryPerformance.reduce((sum, cat) => sum + cat.returns.threeYear, 0) /
      categoryPerformance.length;

    const avgFiveYear =
      categoryPerformance.reduce((sum, cat) => sum + cat.returns.fiveYear, 0) /
      categoryPerformance.length;

    return {
      bestCategory: byOneYear[0],
      worstCategory: byOneYear[byOneYear.length - 1],
      avgCategoryReturn: {
        oneYear: avgOneYear,
        threeYear: avgThreeYear,
        fiveYear: avgFiveYear
      },
      totalFunds
    };
  }, [categoryPerformance]);
}
