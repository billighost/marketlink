import fs from 'node:fs';
import path from 'node:path';
import { connectDb, getDb, closeDb } from '../src/db/client.js';

const ARTIFACT_DIR = 'C:\\Users\\bb201\\.gemini\\antigravity-ide\\brain\\43694f26-0c10-4af3-9127-89f74403eaf7';

async function match() {
  await connectDb();
  const db = getDb();
  const products = await db.collection('products').find({}).toArray();

  const files = fs.readdirSync(ARTIFACT_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Total image files in artifact dir: ${files.length}`);

  const mapping = [
    { name: 'Heirloom tomatoes', pattern: /heirloom_tomatoes/i },
    { name: 'Rainbow carrots', pattern: /rainbow_carrots/i },
    { name: 'Red and gold beets', pattern: /red_gold_beets/i },
    { name: 'Tuscan kale', pattern: /tuscan_kale/i },
    { name: 'Yukon Gold potatoes', pattern: /yukon_gold_potatoes/i },
    { name: 'Sweet corn', pattern: /sweet_corn/i },
    { name: 'Butternut squash', pattern: /butternut_squash/i },
    { name: 'Sourdough boule', pattern: /sourdough_boule/i },
    { name: 'Butter croissant', pattern: /butter_croissant/i },
    { name: 'Seeded rye loaf', pattern: /seeded_rye_loaf/i },
    { name: 'Almond pastry', pattern: /almond_croissant/i },
    { name: 'Wildflower honey', pattern: /wildflower_honey/i },
    { name: 'Creamed clover honey', pattern: /creamed_clover_honey/i },
    { name: 'Honeycomb section', pattern: /raw_honeycomb/i },
    { name: 'Farm eggs', pattern: /farm_eggs/i },
    { name: 'Half-dozen eggs', pattern: /half_dozen_eggs/i },
    { name: 'Pastured whole chicken', pattern: /pastured_roasting_chicken/i },
    { name: 'Aged farmhouse cheddar', pattern: /farmhouse_cheddar/i },
    { name: 'Fresh ricotta', pattern: /fresh_ricotta/i },
    { name: 'Cultured butter', pattern: /cultured_butter/i },
    { name: 'Whole milk', pattern: /whole_milk/i },
    { name: 'Strawberries', pattern: /fresh_strawberries/i },
    { name: 'Blueberries', pattern: /fresh_blueberries/i },
    { name: 'Mixed berry box', pattern: /mixed_berry_box/i },
    { name: 'Red raspberries', pattern: /red_raspberries/i },
    { name: 'Oyster mushrooms', pattern: /oyster_mushrooms/i },
    { name: "Lion's mane", pattern: /lions_mane/i },
    { name: 'Shiitake cluster', pattern: /shiitake_cluster/i },
    { name: 'Strawberry jam', pattern: /strawberry_jam/i },
    { name: 'Fig and walnut butter', pattern: /fig_walnut_butter/i },
    { name: 'Peach chutney', pattern: /peach_chutney/i },
    { name: 'Seasonal bouquet', pattern: /seasonal_farm_bouquet/i },
    { name: 'Fresh basil pot', pattern: /fresh_basil/i },
    { name: 'Dried lavender bunch', pattern: /dried_lavender/i },
    { name: 'Fresh striped bass', pattern: /striped_bass/i },
    { name: 'Smoked fish pate', pattern: /smoked_fish_pate/i },
    { name: 'Grass-fed ground beef', pattern: /ground_beef/i },
    { name: 'Bartlett pears', pattern: /bartlett_pears/i },
    { name: 'Sweet cherry tomatoes', pattern: /cherry_tomatoes/i },
  ];

  const matched = [];
  const unmatchedFiles = new Set(files);
  const unmatchedProducts = [];

  for (const item of mapping) {
    const prod = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
    const file = files.find(f => item.pattern.test(f));
    if (prod && file) {
      matched.push({ name: prod.name, id: prod._id.toString(), file });
      unmatchedFiles.delete(file);
    } else {
      unmatchedProducts.push(item.name);
    }
  }

  // Check remaining products not in mapping
  for (const p of products) {
    if (!matched.find(m => m.id === p._id.toString())) {
      if (!unmatchedProducts.includes(p.name)) {
        unmatchedProducts.push(p.name);
      }
    }
  }

  console.log(`\nMatched ${matched.length} products to files:`);
  console.table(matched);

  console.log(`\nUnmatched files (${unmatchedFiles.size}):`, Array.from(unmatchedFiles));
  console.log(`\nUnmatched products (${unmatchedProducts.length}):`, unmatchedProducts);

  await closeDb();
}

match().catch(console.error);
