/**
 * Photorealism constraints and prompt constructor for MarketLink catalog imagery.
 * Shared across Agent generation (Phase 1) and API generation (Phase 2).
 */

export function getSharedPhotorealismBlock(aspectRatio = '4:3') {
  return `Style: photographed with a mirrorless camera, 50mm or 85mm lens, natural outdoor morning light, soft shadows, shallow depth of field with a gently blurred background. Documentary food/market photography style — think a real farmers market vendor's own photo, not a commercial studio shoot.
Must include (to avoid the "AI-generated" look): slightly imperfect arrangement (not perfectly symmetrical), natural surface texture and minor blemishes where realistic (dirt on root vegetables, uneven crumb on bread, condensation on jars), realistic material physics (wicker actually looks woven, wood actually looks grained, no melting or warping edges), a believable surface underneath (rustic wooden table, woven basket, market stall crate, or checked cloth) rather than a blank studio background, natural colour grading (warm, slightly muted, not oversaturated candy colours).
Must avoid: any readable text, labels, price tags, or signage unless explicitly part of THIS specific prompt — text is where image models fail most visibly, so default to none; plastic-looking or waxy skin/surfaces; unnaturally perfect symmetry or repetition; floating or physically incorrect shadows; watermarks, logos, or camera UI overlays; any real, identifiable brand, trademark, or logo; any depiction of a real, identifiable person; human hands or faces in the frame at all (keep people out of frame entirely); gore or anything unappetising on meat/fish (keep it simple and tasteful: whole or filleted on ice or butcher paper, no violence framing); oversharpened or "3D render" looking edges.
Aspect ratio: ${aspectRatio}.`;
}

export const CATEGORY_PRESENTATION_NOTES = {
  vegetables: 'loose or in a wicker basket/crate, maybe a little dirt still on roots, on a wooden stall table',
  fruit: 'in a wooden crate or paper bag, a couple pieces out of the container for scale',
  bakery: 'on a wire cooling rack or wooden board, natural flour dusting, visible crumb/crust texture',
  'dairy-and-eggs': 'eggs in an open carton or milk/cheese on a wooden board with a checked cloth',
  'dairy-eggs': 'eggs in an open carton or milk/cheese on a wooden board with a checked cloth',
  'honey-and-jam': 'glass jar, warm light catching the contents, a wooden dipper or spoon beside it, no visible label text',
  'honey-jam': 'glass jar, warm light catching the contents, a wooden dipper or spoon beside it, no visible label text',
  'herbs-and-flowers': 'small bunches tied with plain twine, laid on a wooden surface',
  'herbs-flowers': 'small bunches tied with plain twine, laid on a wooden surface',
  'meat-and-fish': 'simply presented on butcher paper or ice, tasteful and clean, no gore',
  'meat-fish': 'simply presented on butcher paper or ice, tasteful and clean, no gore',
};

/**
 * Builds prompt for a product.
 * Aspect ratio: 4:3
 */
export function buildProductPrompt(product) {
  const note =
    CATEGORY_PRESENTATION_NOTES[product.categorySlug] ||
    CATEGORY_PRESENTATION_NOTES[product.category?.slug] ||
    'artfully arranged on a rustic wooden farmers market stall table';

  const desc = product.description || product.name;
  const unit = product.unit || 'each';
  const photorealism = getSharedPhotorealismBlock('4:3');

  return `A photograph of ${product.name}: ${desc}. Unit sold: ${unit}. Presentation: ${note}. ${photorealism}`;
}

/**
 * Builds prompt for a farmer logo/signboard.
 * Aspect ratio: 1:1
 */
export function buildFarmerLogoPrompt(farmer) {
  const stallName = farmer.stallName;
  const specialty = farmer.specialty || 'Fresh local produce';
  const photorealism = getSharedPhotorealismBlock('1:1');

  return `A photograph of a small, rustic hand-painted wooden signboard (or chalkboard) reading only '${stallName}', propped at a farmers market stall. Hand-painted or chalk-written lettering, a little uneven and characterful — imperfect hand-lettering is authentic here, not a flaw. ${specialty} is suggested by a few small real props resting near the sign (e.g. a basket of relevant produce), but the sign and its lettering are the focus. ${photorealism}`;
}

/**
 * Builds prompt for a farmer wide banner.
 * Aspect ratio: 16:9
 */
export function buildFarmerBannerPrompt(farmer) {
  const stallName = farmer.stallName;
  const specialty = farmer.specialty || 'produce';
  const storyDetail = farmer.story ? farmer.story.split('.')[0] : 'family-run market stall';
  const photorealism = getSharedPhotorealismBlock('16:9');

  return `A wide photograph of ${stallName}'s market stall: a table or stand displaying ${specialty}, styled to suggest '${storyDetail}'. No readable signage needs to be in focus for this shot — the produce and stall setup are the focus. ${photorealism}`;
}

/**
 * Builds prompt for a market wide banner.
 * Aspect ratio: 16:9
 */
export function buildMarketBannerPrompt(market) {
  const name = market.name;
  const facilities = Array.isArray(market.facilities) && market.facilities.length > 0
    ? `including ${market.facilities.join(', ')}, paved walkway, people-free for this shot`
    : 'a paved walkway, people-free for this shot';
  const photorealism = getSharedPhotorealismBlock('16:9');

  return `A wide photograph of a small local farmers market called '${name}': a row of stalls with awnings, ${facilities}, morning light, a lively but uncrowded feel. Generic, archetypal small-town market scene — not a real, identifiable location. Keep people out of frame entirely. ${photorealism}`;
}
