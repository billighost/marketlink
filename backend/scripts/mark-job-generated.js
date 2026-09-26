import { ObjectId } from 'mongodb';
import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';

export async function markJobGenerated({ entityType, entityId, localFilePath, promptUsed }) {
  await connectDb();
  const db = getDb();
  const jobsColl = db.collection(COLLECTIONS.IMAGE_GEN_JOBS);
  const entityIdObj = typeof entityId === 'string' ? new ObjectId(entityId) : entityId;

  const res = await jobsColl.updateOne(
    { entityType, entityId: entityIdObj },
    {
      $set: {
        status: 'generated',
        generationMode: 'agent',
        localFilePath,
        promptUsed,
        generatedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  await closeDb();
  return res;
}

if (process.argv[1] && process.argv[1].endsWith('mark-job-generated.js')) {
  const [,, entityType, entityId, localFilePath, ...promptParts] = process.argv;
  const promptUsed = promptParts.join(' ');
  markJobGenerated({ entityType, entityId, localFilePath, promptUsed })
    .then(() => {
      console.log(`Marked ${entityType} ${entityId} as generated.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
