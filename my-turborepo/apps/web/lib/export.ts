import Papa from 'papaparse';

export interface ExportData {
  [key: string]: string | number | undefined;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData[] | Record<string, string>[], filename: string = 'export.csv') {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename);
}

/**
 * Export fund comparison to CSV
 */
export function exportComparisonToCSV(
  funds: Array<{
    meta: {
      scheme_name: string;
      fund_house: string;
      scheme_category: string;
      scheme_code: string;
    };
    data: Array<{ nav: string; date: string }>;
  }>,
  filename: string = 'fund-comparison.csv'
) {
  const rows: Record<string, string>[] = [];

  // Add metadata rows for each fund
  funds.forEach((fund, index) => {
    rows.push({
      'Fund': `Fund ${index + 1}`,
      'Scheme Name': fund.meta.scheme_name,
      'Fund House': fund.meta.fund_house,
      'Category': fund.meta.scheme_category,
      'Code': fund.meta.scheme_code
    });
  });

  rows.push({
    'Fund': '',
    'Scheme Name': '',
    'Fund House': '',
    'Category': '',
    'Code': ''
  });

  // Add NAV data
  const maxDataPoints = Math.max(...funds.map((f) => f.data.length));

  for (let i = 0; i < maxDataPoints; i++) {
    const row: Record<string, string> = {};
    funds.forEach((fund, fundIndex) => {
      const navPoint = fund.data[i];
      if (navPoint) {
        row[`Fund ${fundIndex + 1} Date`] = navPoint.date;
        row[`Fund ${fundIndex + 1} NAV`] = navPoint.nav;
      }
    });
    rows.push(row);
  }

  exportToCSV(rows, filename);
}

/**
 * Export portfolio to CSV
 */
export function exportPortfolioToCSV(
  holdings: Array<{
    schemeCode: string;
    schemeName: string;
    fundHouse: string;
    units: number;
    avgNav: number;
  }>,
  filename: string = 'portfolio.csv'
) {
  const data = holdings.map((holding) => ({
    'Scheme Code': holding.schemeCode,
    'Scheme Name': holding.schemeName,
    'Fund House': holding.fundHouse,
    'Units': holding.units.toFixed(4),
    'Avg NAV': holding.avgNav.toFixed(2),
    'Investment': (holding.units * holding.avgNav).toFixed(2)
  }));

  // Add summary row
  const totalInvestment = holdings.reduce((sum, h) => sum + h.units * h.avgNav, 0);
  const totalUnits = holdings.reduce((sum, h) => sum + h.units, 0);

  data.push({
    'Scheme Code': 'TOTAL',
    'Scheme Name': '',
    'Fund House': '',
    'Units': totalUnits.toFixed(4),
    'Avg NAV': '',
    'Investment': totalInvestment.toFixed(2)
  });

  exportToCSV(data, filename);
}

/**
 * Export NAV history to CSV
 */
export function exportNAVHistoryToCSV(
  schemeCode: string,
  schemeName: string,
  navData: Array<{ date: string; nav: string }>,
  filename: string = `${schemeCode}-nav-history.csv`
) {
  const data = navData.map((point) => ({
    Date: point.date,
    NAV: point.nav,
    'Scheme Code': schemeCode,
    'Scheme Name': schemeName
  }));

  exportToCSV(data, filename);
}

/**
 * Create HTML for PDF export
 */
export function createFundComparisonHTML(
  funds: Array<{
    meta: {
      scheme_name: string;
      fund_house: string;
      scheme_category: string;
      scheme_code: string;
      isin_growth: string;
    };
    data: Array<{ nav: string; date: string }>;
  }>,
  disclaimer: string
): string {
  const fundRows = funds
    .map(
      (fund, idx) => `
    <tr>
      <td class="metric">Scheme Name</td>
      <td class="value">${escapeHtml(fund.meta.scheme_name)}</td>
      ${funds.length > 1 && idx === 0 ? `<td colspan="${funds.length - 1}"></td>` : ''}
    </tr>
    <tr>
      <td class="metric">Fund House</td>
      <td class="value">${escapeHtml(fund.meta.fund_house)}</td>
      ${funds.length > 1 && idx === 0 ? `<td colspan="${funds.length - 1}"></td>` : ''}
    </tr>
    <tr>
      <td class="metric">Category</td>
      <td class="value">${escapeHtml(fund.meta.scheme_category)}</td>
      ${funds.length > 1 && idx === 0 ? `<td colspan="${funds.length - 1}"></td>` : ''}
    </tr>
    <tr>
      <td class="metric">ISIN (Growth)</td>
      <td class="value">${escapeHtml(fund.meta.isin_growth)}</td>
      ${funds.length > 1 && idx === 0 ? `<td colspan="${funds.length - 1}"></td>` : ''}
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Fund Comparison Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #1f2937;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 10px;
        }
        .timestamp {
          color: #6b7280;
          font-size: 12px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          padding: 12px;
          text-align: left;
          font-weight: bold;
        }
        td {
          border: 1px solid #e5e7eb;
          padding: 12px;
        }
        .metric {
          font-weight: bold;
          background-color: #f9fafb;
          width: 200px;
        }
        .value {
          word-break: break-word;
        }
        .disclaimer {
          background-color: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 4px;
          padding: 15px;
          margin-top: 20px;
          font-size: 12px;
          color: #92400e;
        }
        .footer {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <h1>Fund Comparison Report</h1>
      <div class="timestamp">Generated on ${new Date().toLocaleString()}</div>

      <table>
        <thead>
          <tr>
            <th>Metric</th>
            ${funds.map((_, idx) => `<th>Fund ${idx + 1}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${fundRows}
        </tbody>
      </table>

      <div class="disclaimer">
        <strong>Disclaimer:</strong> ${escapeHtml(disclaimer)}
      </div>

      <div class="footer">
        <p>India MF Data PWA - Transparent Mutual Fund Analytics</p>
        <p>This report is for informational purposes only and should not be considered as investment advice.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Download file to user's device
 */
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
