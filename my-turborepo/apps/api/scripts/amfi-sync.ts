import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import prisma from '../src/lib/prisma';
import '../src/config/env';

const AMFI_URL = 'https://www.amfiindia.com/spages/NAVAll.txt';

async function downloadAmfiFile(destination: string) {
  await mkdir(path.dirname(destination), { recursive: true });
  const response = await fetch(AMFI_URL);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download AMFI file (status ${response.status})`);
  }

  await pipeline(response.body, createWriteStream(destination));
}

async function parseAndUpsert(filePath: string) {
  // TODO: implement parser that chunks records and upserts via prisma.navHistory.createMany
  console.log(`Placeholder – parse ${filePath} and upsert into PostgreSQL`);
}

async function main() {
  const tempFile = path.resolve(process.cwd(), 'tmp', `navall-${Date.now()}.txt`);
  console.log('Downloading AMFI NAV file...');
  await downloadAmfiFile(tempFile);
  console.log('Download complete, beginning parse');
  await parseAndUpsert(tempFile);
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
