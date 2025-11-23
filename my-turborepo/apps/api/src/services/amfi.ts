import fs from 'node:fs';
import readline from 'node:readline';

import { Prisma } from '@prisma/client';

import prisma from '../lib/prisma';

export interface AmfiNavRecord {
  schemeCode: string;
  isinDiv: string | null;
  isinGrowth: string | null;
  schemeName: string;
  nav: string;
  navDate: string;
}

/** Parse AMFI NAVAll files line-by-line and yield structured records */
export async function* parseAmfiFile(filePath: string): AsyncGenerator<AmfiNavRecord> {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line || line.startsWith('#') || !line.includes(';')) continue;
    const [schemeCode, isinDiv, isinGrowth, schemeName, nav, navDate] = line.split(';');

    if (!schemeCode || !schemeName || !nav || !navDate) continue;

    yield {
      schemeCode: schemeCode.trim(),
      isinDiv: safeValue(isinDiv),
      isinGrowth: safeValue(isinGrowth),
      schemeName: schemeName.trim(),
      nav: nav.trim(),
      navDate: navDate.trim()
    };
  }
}

function safeValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function upsertNavBatch(records: AmfiNavRecord[]) {
  if (!records.length) return;

  const schemesData: Prisma.SchemeCreateManyInput[] = [];
  const navData: Prisma.NavHistoryCreateManyInput[] = [];
  const updates: Prisma.PrismaPromise<any>[] = [];

  for (const record of records) {
    const navValue = Number(record.nav.replace(/,/g, ''));
    if (Number.isNaN(navValue)) continue;

    schemesData.push({
      schemeCode: record.schemeCode,
      schemeName: record.schemeName,
      isinDividend: record.isinDiv ?? null,
      isinGrowth: record.isinGrowth ?? null
    });

    const navDate = parseIndianDate(record.navDate);
    if (!navDate) continue;

    navData.push({
      schemeCode: record.schemeCode,
      navDate,
      navValue
    });
  }

  if (schemesData.length) {
    updates.push(prisma.scheme.createMany({ data: schemesData, skipDuplicates: true }));
  }

  if (navData.length) {
    updates.push(prisma.navHistory.createMany({ data: navData, skipDuplicates: true }));
  }

  await prisma.$transaction(updates);
}

function parseIndianDate(value: string): Date | null {
  // Format: 22-Nov-2025
  const [day, monthStr, year] = value.split('-');
  if (!day || !monthStr || !year) return null;
  const month = MONTHS[monthStr.toLowerCase()];
  if (month === undefined) return null;
  const parsed = new Date(Date.UTC(Number(year), month, Number(day)));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
};
