import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import prisma from '../src/lib/prisma';
import '../src/config/env';
import { parseAmfiFile, upsertNavBatch } from '../src/services/amfi';

const AMFI_URL = 'https://www.amfiindia.com/spages/NAVAll.txt';
const BATCH_SIZE = 1000;

async function downloadAmfiFile(destination: string) {
  await mkdir(path.dirname(destination), { recursive: true });
  const response = await fetch(AMFI_URL);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download AMFI file (status ${response.status})`);
  }

  await pipeline(response.body, createWriteStream(destination));
}

async function parseAndUpsert(filePath: string) {
  const batch = [] as Parameters<typeof upsertNavBatch>[0];
  let count = 0;

  for await (const record of parseAmfiFile(filePath)) {
    batch.push(record);
    if (batch.length >= BATCH_SIZE) {
      await upsertNavBatch(batch);
      count += batch.length;
      batch.length = 0;
      console.log(`Upserted ${count} NAV rows so far`);
    }
  }

  if (batch.length) {
    await upsertNavBatch(batch);
    count += batch.length;
  }

  console.log(`AMFI sync inserted/updated ${count} NAV rows`);
}

async function main() {
  const tempFile = path.resolve(process.cwd(), 'tmp', `navall-${Date.now()}.txt`);
  console.log('Downloading AMFI NAV file...');
  await downloadAmfiFile(tempFile);
  console.log('Download complete, beginning parse');
  await parseAndUpsert(tempFile);
  await rm(tempFile, { force: true });
  console.log('AMFI sync completed');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('AMFI sync failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
