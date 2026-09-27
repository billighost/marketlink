import fs from 'node:fs';
import path from 'node:path';
import { ObjectId } from 'mongodb';
import { connectDb, getDb, closeDb } from '../src/db/client.js';

export async function stageOneImage(productIdStr, sourceAbsolutePath) {
  const destRelative = path.join('scripts', 'generated', 'product', `${productIdStr}.jpg`);
  const destAbsolute = path.join(process.cwd(), destRelative);
  fs.copyFileSync(sourceAbsolutePath, destAbsolute);

  await connectDb();
  const db = getDb();
  await db.collection('imageGenJobs').updateOne(
    { entityType: 'product', entityId: new ObjectId(productIdStr) },
    {
      $set: {
        status: 'generated',
        generationMode: 'agent',
        localFilePath: destAbsolute,
        generatedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
  console.log(`✓ Staged image for product ${productIdStr} from ${path.basename(sourceAbsolutePath)}`);
  await closeDb();
}

if (process.argv[2] && process.argv[3]) {
  stageOneImage(process.argv[2], process.argv[3])
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
