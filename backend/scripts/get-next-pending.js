import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { buildProductPrompt, buildFarmerLogoPrompt, buildFarmerBannerPrompt, buildMarketBannerPrompt } from './prompt-builder.js';

async function main() {
  await connectDb();
  const db = getDb();
  const jobsColl = db.collection(COLLECTIONS.IMAGE_GEN_JOBS);

  // We prioritize: product -> farmer-logo -> farmer-banner -> market
  const phases = ['product', 'farmer-logo', 'farmer-banner', 'market'];
  let pendingJobs = [];
  let currentPhase = null;

  for (const phase of phases) {
    const jobs = await jobsColl.find({ entityType: phase, status: 'pending' }).limit(12).toArray();
    if (jobs.length > 0) {
      pendingJobs = jobs;
      currentPhase = phase;
      break;
    }
  }

  if (pendingJobs.length === 0) {
    console.log(JSON.stringify({ status: 'complete', items: [] }));
    await closeDb();
    return;
  }

  const items = [];
  for (const job of pendingJobs) {
    let entity = null;
    let prompt = '';

    if (job.entityType === 'product') {
      entity = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: job.entityId });
      if (entity) prompt = buildProductPrompt(entity);
    } else if (job.entityType === 'farmer-logo') {
      entity = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: job.entityId });
      if (entity) prompt = buildFarmerLogoPrompt(entity);
    } else if (job.entityType === 'farmer-banner') {
      entity = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: job.entityId });
      if (entity) prompt = buildFarmerBannerPrompt(entity);
    } else if (job.entityType === 'market') {
      entity = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: job.entityId });
      if (entity) prompt = buildMarketBannerPrompt(entity);
    }

    if (entity) {
      items.push({
        jobId: job._id.toString(),
        entityType: job.entityType,
        entityId: job.entityId.toString(),
        name: entity.name || entity.stallName,
        prompt,
      });
    }
  }

  console.log(JSON.stringify({ status: 'ok', currentPhase, items }, null, 2));
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
