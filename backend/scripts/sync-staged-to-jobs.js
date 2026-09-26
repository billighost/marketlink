import fs from 'node:fs';
import path from 'node:path';
import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { ObjectId } from 'mongodb';

async function main() {
  const dir = path.join(process.cwd(), 'scripts', 'generated', 'product');
  if (!fs.existsSync(dir)) {
    console.log('No product directory found');
    return;
  }
  const files = fs.readdirSync(dir);
  console.log('Files in scripts/generated/product:', files);

  await connectDb();
  const db = getDb();
  for (const f of files) {
    if (f.endsWith('.jpg')) {
      const idStr = f.replace('.jpg', '');
      const objId = new ObjectId(idStr);
      const res = await db.collection(COLLECTIONS.IMAGE_GEN_JOBS).updateOne(
        { entityType: 'product', entityId: objId },
        {
          $set: {
            status: 'generated',
            generationMode: 'agent',
            localFilePath: path.join('scripts', 'generated', 'product', f),
            updatedAt: new Date(),
          },
        }
      );
      console.log(`Updated ${idStr} to generated (matched: ${res.matchedCount}, modified: ${res.modifiedCount})`);
    }
  }
  await closeDb();
}

main().catch(console.error);
