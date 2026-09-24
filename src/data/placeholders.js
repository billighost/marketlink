/**
 * Reusable placeholder data for MarketLink
 * Rich, realistic, consistent data for all three roles.
 * TEMP: replace with API calls when backend is ready.
 */

// ─── Demo users for login ────────────────────────────────────────────────────
// TEMP: replace when backend is ready
export const demoUsers = {
  customer: {
    id: 'user-george',
    name: 'George Adams',
    firstName: 'George',
    email: 'george@example.com',
    password: 'market123',
    phone: '(555) 012-3456',
    address: '14 Birch Lane, Maplewood',
    homeMarketId: 'market-elm',
    role: 'buyer',
    initials: 'GA',
  },
  farmer: {
    id: 'user-farmer',
    name: 'Anna Kowalski',
    firstName: 'Anna',
    email: 'anna@riverbend.farm',
    password: 'farm1234',
    role: 'vendor',
    initials: 'AK',
  },
  admin: {
    id: 'user-admin',
    name: 'Sam Torres',
    firstName: 'Sam',
    email: 'sam@marketlink.co',
    password: 'admin123',
    role: 'admin',
    initials: 'ST',
  },
};

// ─── Current customer (derived from demo user) ──────────────────────────────
export const currentCustomer = demoUsers.customer;

// ─── Categories ──────────────────────────────────────────────────────────────
export const categories = [
  'Vegetables',
  'Fruit',
  'Bakery',
  'Dairy and eggs',
  'Honey and jam',
  'Herbs and flowers',
  'Meat and fish',
];

// ─── Markets ─────────────────────────────────────────────────────────────────
export const markets = [
  {
    id: 'market-elm',
    name: 'Elm Street Market',
    address: '200 Elm Street, Maplewood',
    days: ['Saturday'],
    hours: '8:00 am – 1:00 pm',
    distance: '0.8 mi',
    farmerIds: ['f-riverbend', 'f-oakmill', 'f-hollowcreek', 'f-willowbend', 'f-maplecrest', 'f-sunridge', 'f-greenhollow', 'f-thornberry', 'f-cedarbrook', 'f-oldstone', 'f-wildmeadow', 'f-clearwater'],
    note: 'Free parking behind the community centre.',
    lat: 40.735,
    lng: -74.172,
  },
  {
    id: 'market-river',
    name: 'Riverside Sunday Market',
    address: '45 River Road, Millburn',
    days: ['Sunday'],
    hours: '9:00 am – 2:00 pm',
    distance: '2.1 mi',
    farmerIds: ['f-riverbend', 'f-oakmill', 'f-maplecrest', 'f-sunridge', 'f-thornberry'],
    note: 'Dogs welcome. Card payments accepted at most stalls.',
    lat: 40.725,
    lng: -74.310,
  },
  {
    id: 'market-hill',
    name: 'Hilltop Farmers Market',
    address: '88 Summit Avenue, Summit',
    days: ['Wednesday', 'Saturday'],
    hours: '7:30 am – 12:00 pm',
    distance: '3.4 mi',
    farmerIds: ['f-hollowcreek', 'f-willowbend', 'f-greenhollow', 'f-cedarbrook', 'f-clearwater'],
    note: 'Wheelchair accessible. Covered pavilion.',
    lat: 40.715,
    lng: -74.362,
  },
  {
    id: 'market-grove',
    name: 'Grove Park Market',
    address: '12 Park Lane, South Orange',
    days: ['Saturday'],
    hours: '8:30 am – 1:30 pm',
    distance: '4.7 mi',
    farmerIds: ['f-riverbend', 'f-oakmill', 'f-oldstone', 'f-wildmeadow'],
    note: 'Live music most Saturdays. Picnic area nearby.',
    lat: 40.748,
    lng: -74.264,
  },
];

export const homeMarket = markets[0];

// ─── Farmers (12) ────────────────────────────────────────────────────────────
export const farmers = [
  {
    id: 'f-riverbend',
    stallName: 'Riverbend Farm',
    stallNumber: 'Stall 4',
    marketIds: ['market-elm', 'market-river', 'market-grove'],
    specialty: 'Vegetables and herbs',
    story: 'Three generations of the Kowalski family have farmed this 40-acre plot along the Passaic River. Everything is picked the morning before market.',
    since: 2018,
    rating: 4.9,
    reviewCount: 48,
    days: ['Saturday', 'Sunday'],
    art: 'crate-carrots',
    isTopSeller: true,
    isNew: false,
  },
  {
    id: 'f-oakmill',
    stallName: 'Oak & Mill Bakery',
    stallNumber: 'Stall 7',
    marketIds: ['market-elm', 'market-river', 'market-grove'],
    specialty: 'Sourdough and pastries',
    story: 'Dan and Priya bake everything by hand in a converted garage using heirloom flour from a New York mill. Their croissants sell out by 10 am.',
    since: 2020,
    rating: 5.0,
    reviewCount: 62,
    days: ['Saturday', 'Sunday'],
    art: 'sourdough-boule',
    isTopSeller: true,
    isNew: false,
  },
  {
    id: 'f-hollowcreek',
    stallName: 'Hollow Creek Apiary',
    stallNumber: 'Stall 2',
    marketIds: ['market-elm', 'market-hill'],
    specialty: 'Raw honey and preserves',
    story: 'Beekeeper Lena manages 30 hives across three wildflower meadows in Morris County. Each jar is labelled with the season it was harvested.',
    since: 2019,
    rating: 4.8,
    reviewCount: 35,
    days: ['Saturday', 'Wednesday'],
    art: 'honey-jar',
    isTopSeller: false,
    isNew: false,
  },
  {
    id: 'f-willowbend',
    stallName: 'Willow Bend Poultry',
    stallNumber: 'Stall 9',
    marketIds: ['market-elm', 'market-hill'],
    specialty: 'Free-range eggs and chicken',
    story: 'The hens at Willow Bend roam five acres of pasture and eat only organic feed. Eggs come in every shade from cream to blue.',
    since: 2017,
    rating: 4.7,
    reviewCount: 29,
    days: ['Saturday', 'Wednesday'],
    art: 'egg-carton',
    isTopSeller: false,
    isNew: false,
  },
  {
    id: 'f-maplecrest',
    stallName: 'Maplecrest Creamery',
    stallNumber: 'Stall 11',
    marketIds: ['market-elm', 'market-river'],
    specialty: 'Artisan cheese and butter',
    story: 'Small-batch Jersey cow dairy from a 60-acre farm in Hunterdon County. Their aged cheddar won Best in State two years running.',
    since: 2021,
    rating: 4.6,
    reviewCount: 18,
    days: ['Saturday', 'Sunday'],
    art: 'cheese',
    isTopSeller: false,
    isNew: false,
  },
  {
    id: 'f-sunridge',
    stallName: 'Sunridge Berry Farm',
    stallNumber: 'Stall 3',
    marketIds: ['market-elm', 'market-river'],
    specialty: 'Berries and stone fruit',
    story: 'Five varieties of blueberry plus strawberries, raspberries, and peaches on a sunny south-facing slope. Pick-your-own opens in June.',
    since: 2022,
    rating: 4.9,
    reviewCount: 22,
    days: ['Saturday', 'Sunday'],
    art: 'strawberries',
    isTopSeller: true,
    isNew: false,
  },
  {
    id: 'f-greenhollow',
    stallName: 'Green Hollow Mushrooms',
    stallNumber: 'Stall 6',
    marketIds: ['market-elm', 'market-hill'],
    specialty: 'Gourmet mushrooms',
    story: 'Grown in repurposed shipping containers using oak sawdust from local woodworkers. Shiitake, oyster, lion\'s mane, and maitake year-round.',
    since: 2023,
    rating: 4.5,
    reviewCount: 11,
    days: ['Saturday', 'Wednesday'],
    art: 'mushrooms',
    isTopSeller: false,
    isNew: true,
  },
  {
    id: 'f-thornberry',
    stallName: 'Thornberry Preserves',
    stallNumber: 'Stall 5',
    marketIds: ['market-elm', 'market-river'],
    specialty: 'Jams and fruit butter',
    story: 'Margaret has been making small-batch jams from her garden for 20 years. Every jar uses fruit she grew herself, and nothing else.',
    since: 2016,
    rating: 4.8,
    reviewCount: 41,
    days: ['Saturday', 'Sunday'],
    art: 'jam',
    isTopSeller: false,
    isNew: false,
  },
  {
    id: 'f-cedarbrook',
    stallName: 'Cedarbrook Flowers',
    stallNumber: 'Stall 12',
    marketIds: ['market-elm', 'market-hill'],
    specialty: 'Cut flowers and herbs',
    story: 'Seasonal bouquets and potted herbs grown without pesticides on a two-acre plot behind the family house. Lavender and sunflowers are the favourites.',
    since: 2024,
    rating: 4.4,
    reviewCount: 7,
    days: ['Saturday', 'Wednesday'],
    art: 'flowers',
    isTopSeller: false,
    isNew: true,
  },
  {
    id: 'f-oldstone',
    stallName: 'Old Stone Fishmonger',
    stallNumber: 'Stall 10',
    marketIds: ['market-elm', 'market-grove'],
    specialty: 'Fresh catch and smoked fish',
    story: 'Day-boat fish from Barnegat Bay and cold-smoked trout from their own smokehouse. They arrive at 6 am with the catch packed on ice.',
    since: 2019,
    rating: 4.7,
    reviewCount: 33,
    days: ['Saturday'],
    art: 'fish',
    isTopSeller: false,
    isNew: false,
  },
  {
    id: 'f-wildmeadow',
    stallName: 'Wild Meadow Meats',
    stallNumber: 'Stall 8',
    marketIds: ['market-elm', 'market-grove'],
    specialty: 'Sausages and cured meats',
    story: 'Pasture-raised pork and beef from a farm in Warren County. Their maple breakfast sausage is the reason people queue before 8.',
    since: 2020,
    rating: 4.8,
    reviewCount: 38,
    days: ['Saturday'],
    art: 'sausages',
    isTopSeller: true,
    isNew: false,
  },
  {
    id: 'f-clearwater',
    stallName: 'Clearwater Orchards',
    stallNumber: 'Stall 1',
    marketIds: ['market-hill'],
    specialty: 'Apples, pears and cider',
    story: 'A century-old orchard with 40 heritage apple varieties. Their fresh-pressed cider is unfiltered and unpasteurised.',
    since: 2015,
    rating: 4.9,
    reviewCount: 55,
    days: ['Wednesday', 'Saturday'],
    art: 'apples',
    isTopSeller: true,
    isNew: false,
  },
];

// ─── Products (36) ───────────────────────────────────────────────────────────
export const products = [
  // Riverbend Farm — Vegetables
  { id: 'p-01', name: 'Heirloom tomatoes',     farmerId: 'f-riverbend', category: 'Vegetables',       price: 4.50, unit: 'lb',     stock: 'in',  quantityLeft: 24, description: 'A mix of Cherokee Purple, Brandywine and Green Zebra, picked yesterday.', art: 'tomato',          tags: ['seasonal', 'bestseller'],       cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-02', name: 'Rainbow carrots',       farmerId: 'f-riverbend', category: 'Vegetables',       price: 4.50, unit: 'bunch',  stock: 'in',  quantityLeft: 18, description: 'Purple, orange, yellow and white carrots, tops still attached.',               art: 'carrot',          tags: ['organic'],                      cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-03', name: 'Red and gold beets',    farmerId: 'f-riverbend', category: 'Vegetables',       price: 5.00, unit: 'bunch',  stock: 'low', quantityLeft: 4,  description: 'Sweet and earthy, roasted or raw in salads.',                                 art: 'beet-bunch',      tags: ['seasonal'],                     cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-04', name: 'Tuscan kale',           farmerId: 'f-riverbend', category: 'Vegetables',       price: 3.50, unit: 'bunch',  stock: 'in',  quantityLeft: 15, description: 'Dark, crinkly lacinato kale. Perfect for soups and chips.',                   art: 'leafy-greens',    tags: ['organic'],                      cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-05', name: 'Yukon Gold potatoes',   farmerId: 'f-riverbend', category: 'Vegetables',       price: 3.00, unit: 'lb',     stock: 'in',  quantityLeft: 30, description: 'Creamy and buttery. Excellent mashed or roasted.',                             art: 'potatoes',        tags: [],                               cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-06', name: 'Sweet corn',            farmerId: 'f-riverbend', category: 'Vegetables',       price: 1.00, unit: 'ear',    stock: 'low', quantityLeft: 6,  description: 'Picked at dawn. Best eaten the same day.',                                    art: 'corn',            tags: ['seasonal', 'new'],              cutoff: 'Order by Friday, 6 pm' },

  // Oak & Mill Bakery
  { id: 'p-07', name: 'Sourdough boule',       farmerId: 'f-oakmill',   category: 'Bakery',           price: 7.00, unit: 'loaf',   stock: 'in',  quantityLeft: 12, description: 'Naturally leavened over 36 hours with a crackling crust.',                     art: 'sourdough-boule', tags: ['bestseller'],                   cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-08', name: 'Butter croissant',      farmerId: 'f-oakmill',   category: 'Bakery',           price: 4.00, unit: 'each',   stock: 'in',  quantityLeft: 20, description: 'Flaky, laminated by hand with grass-fed butter.',                              art: 'croissant',       tags: ['bestseller'],                   cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-09', name: 'Seeded rye loaf',       farmerId: 'f-oakmill',   category: 'Bakery',           price: 8.00, unit: 'loaf',   stock: 'in',  quantityLeft: 8,  description: 'Dense, dark rye studded with caraway and sunflower seeds.',                    art: 'sourdough-boule', tags: ['new'],                          cutoff: 'Order by Friday, 6 pm' },

  // Hollow Creek Apiary
  { id: 'p-10', name: 'Wildflower honey',      farmerId: 'f-hollowcreek', category: 'Honey and jam',  price: 9.50, unit: 'jar',    stock: 'low', quantityLeft: 3,  description: 'Raw, unfiltered summer wildflower honey from Morris County.',                  art: 'honey-jar',       tags: ['bestseller'],                   cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-11', name: 'Creamed clover honey',  farmerId: 'f-hollowcreek', category: 'Honey and jam',  price: 11.00, unit: 'jar',   stock: 'in',  quantityLeft: 10, description: 'Spreadable whipped honey with a smooth, buttery texture.',                     art: 'honey-jar',       tags: [],                               cutoff: 'Order by Friday, 6 pm' },

  // Willow Bend Poultry
  { id: 'p-12', name: 'Farm eggs',             farmerId: 'f-willowbend', category: 'Dairy and eggs',   price: 6.00, unit: 'dozen',  stock: 'in',  quantityLeft: 14, description: 'Free-range, pasture-raised. Yolks as orange as sunset.',                      art: 'egg-carton',      tags: ['organic'],                      cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-13', name: 'Half-dozen eggs',       farmerId: 'f-willowbend', category: 'Dairy and eggs',   price: 3.50, unit: 'half doz', stock: 'in', quantityLeft: 10, description: 'Same pasture-raised eggs in a smaller carton.',                                art: 'egg-carton',      tags: [],                               cutoff: 'Order by Friday, 6 pm' },

  // Maplecrest Creamery
  { id: 'p-14', name: 'Aged farmhouse cheddar', farmerId: 'f-maplecrest', category: 'Dairy and eggs',  price: 12.00, unit: 'wedge', stock: 'in',  quantityLeft: 8,  description: 'Sharp, crumbly, aged 18 months in their cellar.',                              art: 'cheese',          tags: ['bestseller'],                   cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-15', name: 'Fresh ricotta',         farmerId: 'f-maplecrest', category: 'Dairy and eggs',   price: 8.00, unit: 'tub',    stock: 'in',  quantityLeft: 6,  description: 'Made that morning from whole Jersey cow milk. Creamy and mild.',               art: 'cheese',          tags: ['new'],                          cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-16', name: 'Cultured butter',       farmerId: 'f-maplecrest', category: 'Dairy and eggs',   price: 6.50, unit: 'block',  stock: 'in',  quantityLeft: 12, description: 'Tangy, European-style cultured butter with sea salt flakes.',                  art: 'milk-bottle',     tags: [],                               cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-17', name: 'Whole milk',            farmerId: 'f-maplecrest', category: 'Dairy and eggs',   price: 5.50, unit: 'quart',  stock: 'in',  quantityLeft: 10, description: 'Non-homogenised, cream-top Jersey cow milk in a glass bottle.',               art: 'milk-bottle',     tags: [],                               cutoff: 'Order by Friday, 6 pm' },

  // Sunridge Berry Farm
  { id: 'p-18', name: 'Strawberries',          farmerId: 'f-sunridge',  category: 'Fruit',             price: 6.00, unit: 'pint',   stock: 'in',  quantityLeft: 16, description: 'Sweet, fragrant Earliglow berries picked that morning.',                       art: 'strawberries',    tags: ['seasonal', 'bestseller'],       cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-19', name: 'Blueberries',           farmerId: 'f-sunridge',  category: 'Fruit',             price: 5.50, unit: 'pint',   stock: 'in',  quantityLeft: 20, description: 'Plump Duke and Bluecrop blueberries from the sunny hillside.',                art: 'blueberries',     tags: ['seasonal'],                     cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-20', name: 'Mixed berry box',       farmerId: 'f-sunridge',  category: 'Fruit',             price: 10.00, unit: 'box',   stock: 'low', quantityLeft: 3,  description: 'A little of everything: strawberries, blueberries, raspberries.',              art: 'strawberries',    tags: ['seasonal'],                     cutoff: 'Order by Friday, 6 pm' },

  // Green Hollow Mushrooms
  { id: 'p-21', name: 'Oyster mushrooms',      farmerId: 'f-greenhollow', category: 'Vegetables',      price: 8.00, unit: 'lb',     stock: 'in',  quantityLeft: 10, description: 'Tender blue oysters grown on oak sawdust. Delicate and nutty.',               art: 'mushrooms',       tags: ['new'],                          cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-22', name: 'Lion\'s mane',          farmerId: 'f-greenhollow', category: 'Vegetables',      price: 14.00, unit: 'lb',    stock: 'in',  quantityLeft: 5,  description: 'Shaggy, lobster-textured mushroom. Slice thick and sear in butter.',           art: 'mushrooms',       tags: ['new'],                          cutoff: 'Order by Friday, 6 pm' },

  // Thornberry Preserves
  { id: 'p-23', name: 'Strawberry jam',        farmerId: 'f-thornberry', category: 'Honey and jam',    price: 7.50, unit: 'jar',    stock: 'in',  quantityLeft: 14, description: 'Just strawberries, sugar and lemon. Nothing else.',                            art: 'jam',             tags: ['bestseller'],                   cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-24', name: 'Fig and walnut butter', farmerId: 'f-thornberry', category: 'Honey and jam',    price: 9.00, unit: 'jar',    stock: 'in',  quantityLeft: 8,  description: 'Thick, spoonable fig butter with toasted walnut pieces.',                      art: 'jam',             tags: ['seasonal'],                     cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-25', name: 'Peach chutney',         farmerId: 'f-thornberry', category: 'Honey and jam',    price: 8.00, unit: 'jar',    stock: 'out', quantityLeft: 0,  description: 'Spiced peach chutney with ginger. Back when peaches return.',                  art: 'jam',             tags: ['seasonal'],                     cutoff: 'Order by Friday, 6 pm' },

  // Cedarbrook Flowers
  { id: 'p-26', name: 'Seasonal bouquet',      farmerId: 'f-cedarbrook', category: 'Herbs and flowers', price: 12.00, unit: 'bunch', stock: 'in',  quantityLeft: 10, description: 'Mixed dahlias, zinnias and greenery, wrapped in brown paper.',                 art: 'flowers',         tags: ['seasonal', 'new'],              cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-27', name: 'Fresh basil pot',       farmerId: 'f-cedarbrook', category: 'Herbs and flowers', price: 4.00, unit: 'pot',    stock: 'in',  quantityLeft: 8,  description: 'A living Genovese basil plant. Snip what you need, keep it growing.',          art: 'herbs',           tags: [],                               cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-28', name: 'Dried lavender bunch',  farmerId: 'f-cedarbrook', category: 'Herbs and flowers', price: 6.00, unit: 'bunch',  stock: 'in',  quantityLeft: 15, description: 'English lavender dried slowly in the barn. Fills a room with scent.',          art: 'flowers',         tags: ['seasonal'],                     cutoff: 'Order by Friday, 6 pm' },

  // Old Stone Fishmonger
  { id: 'p-29', name: 'Fresh striped bass',    farmerId: 'f-oldstone',  category: 'Meat and fish',     price: 16.00, unit: 'lb',    stock: 'in',  quantityLeft: 6,  description: 'Day-boat catch from Barnegat Bay, filleted to order.',                         art: 'fish',            tags: [],                               cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-30', name: 'Cold-smoked trout',     farmerId: 'f-oldstone',  category: 'Meat and fish',     price: 12.00, unit: 'fillet', stock: 'in',  quantityLeft: 8,  description: 'Beechwood-smoked rainbow trout. Silky and delicate.',                          art: 'fish',            tags: ['bestseller'],                   cutoff: 'Order by Friday, 6 pm' },

  // Wild Meadow Meats
  { id: 'p-31', name: 'Maple breakfast sausage', farmerId: 'f-wildmeadow', category: 'Meat and fish',   price: 9.00, unit: 'pack',  stock: 'in',  quantityLeft: 12, description: 'Sweet, smoky pork sausage with real maple syrup. The Saturday queue-maker.',   art: 'sausages',        tags: ['bestseller'],                   cutoff: 'Order by Friday, 6 pm' },
  { id: 'p-32', name: 'Italian pork sausage',  farmerId: 'f-wildmeadow', category: 'Meat and fish',     price: 8.50, unit: 'pack',  stock: 'in',  quantityLeft: 10, description: 'Fennel seed, garlic and crushed red pepper. Grill or braise.',                  art: 'sausages',        tags: [],                               cutoff: 'Order by Friday, 6 pm' },

  // Clearwater Orchards
  { id: 'p-33', name: 'Honeycrisp apples',     farmerId: 'f-clearwater', category: 'Fruit',             price: 4.00, unit: 'lb',    stock: 'in',  quantityLeft: 25, description: 'Crisp, sweet-tart and impossibly juicy. The apple that ruins all other apples.', art: 'apples',          tags: ['seasonal', 'bestseller'],       cutoff: 'Order by Tuesday, 6 pm' },
  { id: 'p-34', name: 'Bartlett pears',        farmerId: 'f-clearwater', category: 'Fruit',             price: 3.50, unit: 'lb',    stock: 'in',  quantityLeft: 18, description: 'Buttery when ripe. Let them sit on the counter for a day or two.',              art: 'pears',           tags: ['seasonal'],                     cutoff: 'Order by Tuesday, 6 pm' },
  { id: 'p-35', name: 'Fresh-pressed cider',   farmerId: 'f-clearwater', category: 'Fruit',             price: 8.00, unit: 'half gal', stock: 'low', quantityLeft: 4, description: 'Unfiltered, unpasteurised blend of heritage apples. Shake before pouring.',     art: 'apples',          tags: ['seasonal', 'new'],              cutoff: 'Order by Tuesday, 6 pm' },
  { id: 'p-36', name: 'Butternut squash',      farmerId: 'f-riverbend', category: 'Vegetables',        price: 3.00, unit: 'each',  stock: 'in',  quantityLeft: 20, description: 'Dense, sweet flesh. Roast, mash, or turn into soup.',                          art: 'squash',          tags: ['seasonal'],                     cutoff: 'Order by Friday, 6 pm' },
];

// ─── Pickup slots ────────────────────────────────────────────────────────────
export const pickupSlots = [
  { id: 'slot-1', label: 'Sat 8 – 10 am',  day: 'Saturday',  start: '8:00 am',  end: '10:00 am' },
  { id: 'slot-2', label: 'Sat 10 am – 12 pm', day: 'Saturday',  start: '10:00 am', end: '12:00 pm' },
  { id: 'slot-3', label: 'Sat 12 – 1 pm',  day: 'Saturday',  start: '12:00 pm', end: '1:00 pm' },
  { id: 'slot-4', label: 'Sun 9 – 11 am',  day: 'Sunday',    start: '9:00 am',  end: '11:00 am' },
  { id: 'slot-5', label: 'Sun 11 am – 1 pm', day: 'Sunday',   start: '11:00 am', end: '1:00 pm' },
  { id: 'slot-6', label: 'Wed 8 – 10 am',  day: 'Wednesday', start: '8:00 am',  end: '10:00 am' },
];

// ─── Orders (6) ──────────────────────────────────────────────────────────────
export const orders = [
  {
    id: 'ord-001',
    number: 'ML-1047',
    status: 'Ready for pickup',
    items: [
      { productId: 'p-01', name: 'Heirloom tomatoes', quantity: 2, price: 4.50, unit: 'lb', farmerId: 'f-riverbend' },
      { productId: 'p-04', name: 'Tuscan kale', quantity: 1, price: 3.50, unit: 'bunch', farmerId: 'f-riverbend' },
    ],
    farmerGroups: [
      { farmerId: 'f-riverbend', stallName: 'Riverbend Farm', stallNumber: 'Stall 4', slotId: 'slot-1', subtotal: 12.50 },
    ],
    total: 12.50,
    marketId: 'market-elm',
    pickupSlot: 'Sat 8 – 10 am',
    timeline: [
      { status: 'Placed',            at: '2026-09-19T14:22:00' },
      { status: 'Accepted',          at: '2026-09-19T18:05:00' },
      { status: 'Ready for pickup',  at: '2026-09-20T07:30:00' },
    ],
  },
  {
    id: 'ord-002',
    number: 'ML-1042',
    status: 'Accepted',
    items: [
      { productId: 'p-07', name: 'Sourdough boule', quantity: 1, price: 7.00, unit: 'loaf', farmerId: 'f-oakmill' },
      { productId: 'p-08', name: 'Butter croissant', quantity: 3, price: 4.00, unit: 'each', farmerId: 'f-oakmill' },
    ],
    farmerGroups: [
      { farmerId: 'f-oakmill', stallName: 'Oak & Mill Bakery', stallNumber: 'Stall 7', slotId: 'slot-2', subtotal: 19.00 },
    ],
    total: 19.00,
    marketId: 'market-elm',
    pickupSlot: 'Sat 10 am – 12 pm',
    timeline: [
      { status: 'Placed',   at: '2026-09-21T09:14:00' },
      { status: 'Accepted', at: '2026-09-21T11:30:00' },
    ],
  },
  {
    id: 'ord-003',
    number: 'ML-1038',
    status: 'Placed',
    items: [
      { productId: 'p-18', name: 'Strawberries', quantity: 2, price: 6.00, unit: 'pint', farmerId: 'f-sunridge' },
      { productId: 'p-14', name: 'Aged farmhouse cheddar', quantity: 1, price: 12.00, unit: 'wedge', farmerId: 'f-maplecrest' },
    ],
    farmerGroups: [
      { farmerId: 'f-sunridge',  stallName: 'Sunridge Berry Farm', stallNumber: 'Stall 3', slotId: 'slot-1', subtotal: 12.00 },
      { farmerId: 'f-maplecrest', stallName: 'Maplecrest Creamery', stallNumber: 'Stall 11', slotId: 'slot-2', subtotal: 12.00 },
    ],
    total: 24.00,
    marketId: 'market-elm',
    pickupSlot: 'Sat 8 – 10 am / Sat 10 am – 12 pm',
    timeline: [
      { status: 'Placed', at: '2026-09-23T20:45:00' },
    ],
  },
  {
    id: 'ord-004',
    number: 'ML-0985',
    status: 'Completed',
    items: [
      { productId: 'p-01', name: 'Heirloom tomatoes', quantity: 1, price: 4.50, unit: 'lb', farmerId: 'f-riverbend' },
      { productId: 'p-07', name: 'Sourdough boule', quantity: 1, price: 7.00, unit: 'loaf', farmerId: 'f-oakmill' },
      { productId: 'p-12', name: 'Farm eggs', quantity: 1, price: 6.00, unit: 'dozen', farmerId: 'f-willowbend' },
    ],
    farmerGroups: [
      { farmerId: 'f-riverbend',  stallName: 'Riverbend Farm', stallNumber: 'Stall 4', slotId: 'slot-1', subtotal: 4.50 },
      { farmerId: 'f-oakmill',    stallName: 'Oak & Mill Bakery', stallNumber: 'Stall 7', slotId: 'slot-1', subtotal: 7.00 },
      { farmerId: 'f-willowbend', stallName: 'Willow Bend Poultry', stallNumber: 'Stall 9', slotId: 'slot-2', subtotal: 6.00 },
    ],
    total: 17.50,
    marketId: 'market-elm',
    pickupSlot: 'Sat 8 – 10 am',
    timeline: [
      { status: 'Placed',            at: '2026-09-05T10:12:00' },
      { status: 'Accepted',          at: '2026-09-05T14:30:00' },
      { status: 'Ready for pickup',  at: '2026-09-06T07:15:00' },
      { status: 'Completed',         at: '2026-09-06T09:22:00' },
    ],
  },
  {
    id: 'ord-005',
    number: 'ML-0923',
    status: 'Completed',
    items: [
      { productId: 'p-10', name: 'Wildflower honey', quantity: 2, price: 9.50, unit: 'jar', farmerId: 'f-hollowcreek' },
      { productId: 'p-23', name: 'Strawberry jam', quantity: 1, price: 7.50, unit: 'jar', farmerId: 'f-thornberry' },
    ],
    farmerGroups: [
      { farmerId: 'f-hollowcreek', stallName: 'Hollow Creek Apiary', stallNumber: 'Stall 2', slotId: 'slot-1', subtotal: 19.00 },
      { farmerId: 'f-thornberry',  stallName: 'Thornberry Preserves', stallNumber: 'Stall 5', slotId: 'slot-1', subtotal: 7.50 },
    ],
    total: 26.50,
    marketId: 'market-elm',
    pickupSlot: 'Sat 8 – 10 am',
    timeline: [
      { status: 'Placed',            at: '2026-08-22T16:40:00' },
      { status: 'Accepted',          at: '2026-08-22T19:10:00' },
      { status: 'Ready for pickup',  at: '2026-08-23T07:50:00' },
      { status: 'Completed',         at: '2026-08-23T10:05:00' },
    ],
  },
  {
    id: 'ord-006',
    number: 'ML-0890',
    status: 'Cancelled',
    cancelReason: 'Farmer was unable to fill the order due to crop damage from last week\'s storm.',
    items: [
      { productId: 'p-06', name: 'Sweet corn', quantity: 6, price: 1.00, unit: 'ear', farmerId: 'f-riverbend' },
    ],
    farmerGroups: [
      { farmerId: 'f-riverbend', stallName: 'Riverbend Farm', stallNumber: 'Stall 4', slotId: 'slot-1', subtotal: 6.00 },
    ],
    total: 6.00,
    marketId: 'market-elm',
    pickupSlot: 'Sat 8 – 10 am',
    timeline: [
      { status: 'Placed',    at: '2026-08-08T11:20:00' },
      { status: 'Cancelled', at: '2026-08-09T08:15:00' },
    ],
  },
];

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviews = [
  { id: 'rev-1', farmerId: 'f-riverbend',   productId: 'p-01', author: 'Mia K.',       rating: 5, date: '2026-09-14', text: 'The best tomatoes I\'ve ever had. We ate half the bag on the drive home.' },
  { id: 'rev-2', farmerId: 'f-riverbend',   productId: 'p-02', author: 'James T.',     rating: 5, date: '2026-09-07', text: 'Beautiful rainbow carrots. My kids were fighting over the purple ones.' },
  { id: 'rev-3', farmerId: 'f-oakmill',     productId: 'p-07', author: 'Sarah L.',     rating: 5, date: '2026-09-14', text: 'This sourdough is life-changing. I can\'t go back to store bread.' },
  { id: 'rev-4', farmerId: 'f-oakmill',     productId: 'p-08', author: 'David R.',     rating: 5, date: '2026-09-07', text: 'Flaky, buttery, perfect. Worth getting up early for.' },
  { id: 'rev-5', farmerId: 'f-hollowcreek', productId: 'p-10', author: 'Elena R.',     rating: 4, date: '2026-08-31', text: 'Lovely honey. A little pricey but you can taste the quality.' },
  { id: 'rev-6', farmerId: 'f-willowbend',  productId: 'p-12', author: 'Chris W.',     rating: 5, date: '2026-09-07', text: 'These eggs make the fluffiest scramble. Orange yolks are no joke.' },
  { id: 'rev-7', farmerId: 'f-maplecrest',  productId: 'p-14', author: 'Nina P.',      rating: 4, date: '2026-08-24', text: 'Excellent cheddar. Sharp enough to hold its own on a cheeseboard.' },
  { id: 'rev-8', farmerId: 'f-sunridge',    productId: 'p-18', author: 'George A.',    rating: 5, date: '2026-09-14', text: 'Incredibly sweet strawberries. We finished the whole pint before lunch.' },
  { id: 'rev-9', farmerId: 'f-wildmeadow',  productId: 'p-31', author: 'Tomoko H.',   rating: 5, date: '2026-09-07', text: 'The maple sausage is the reason I wake up early on Saturday.' },
  { id: 'rev-10', farmerId: 'f-clearwater', productId: 'p-33', author: 'Mark D.',     rating: 5, date: '2026-09-14', text: 'Crunchiest apples I\'ve ever had. These ruin supermarket apples forever.' },
  { id: 'rev-11', farmerId: 'f-thornberry', productId: 'p-23', author: 'Laura B.',    rating: 5, date: '2026-08-17', text: 'Real jam that tastes like actual strawberries. My grandma would approve.' },
  { id: 'rev-12', farmerId: 'f-oldstone',   productId: 'p-30', author: 'Paul G.',     rating: 4, date: '2026-08-31', text: 'Beautifully smoked trout. Melts on a bagel with cream cheese.' },
];

// ─── Favorites ───────────────────────────────────────────────────────────────
export const favoriteProductIds = ['p-01', 'p-07', 'p-10', 'p-18', 'p-31', 'p-33'];
export const favoriteFarmerIds = ['f-riverbend', 'f-oakmill', 'f-sunridge'];

// ─── Recently bought (from completed orders) ────────────────────────────────
export const recentlyBoughtProductIds = ['p-01', 'p-07', 'p-12', 'p-10', 'p-23'];

// ─── Recent searches ─────────────────────────────────────────────────────────
export const recentSearches = ['tomatoes', 'sourdough', 'honey', 'eggs', 'strawberries'];

// ─── Assistant scripted replies ──────────────────────────────────────────────
export const assistantReplies = {
  'What\'s fresh on Saturday?': 'This Saturday at Elm Street Market, Riverbend Farm has heirloom tomatoes and sweet corn, Oak & Mill is baking sourdough and croissants, and Sunridge Berry Farm has fresh strawberries. What sounds good?',
  'Who sells eggs?': 'Willow Bend Poultry at Stall 9 has free-range eggs — $6.00 a dozen or $3.50 for a half dozen. They\'re pasture-raised with orange yolks.',
  'When does Elm Street close?': 'Elm Street Market is open Saturdays from 8 am to 1 pm. The cut-off for most pre-orders is Friday at 6 pm.',
  default: 'I\'m not sure about that yet, but I\'m learning. Try asking about what\'s fresh, who sells a specific item, or market hours.',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Look up a farmer by id */
export function getFarmer(id) {
  return farmers.find((f) => f.id === id);
}

/** Look up a product by id */
export function getProduct(id) {
  return products.find((p) => p.id === id);
}

/** Look up a market by id */
export function getMarket(id) {
  return markets.find((m) => m.id === id);
}

/** Get products for a specific farmer */
export function getProductsByFarmer(farmerId) {
  return products.filter((p) => p.farmerId === farmerId);
}

/** Get products by category */
export function getProductsByCategory(category) {
  return products.filter((p) => p.category === category);
}

/** Get reviews for a specific farmer */
export function getReviewsByFarmer(farmerId) {
  return reviews.filter((r) => r.farmerId === farmerId);
}

/** Get reviews for a specific product */
export function getReviewsByProduct(productId) {
  return reviews.filter((r) => r.productId === productId);
}

// ─── Legacy exports (used by guest pages — do not remove) ────────────────────
export const PRICE_BOARD_ITEMS = [
  { id: 'item-1', name: 'Heirloom tomatoes',  farmer: 'Riverbend Farm',       price: '$4.50', unit: 'lb',    status: 'In stock',  statusTone: 'herb' },
  { id: 'item-2', name: 'Sourdough loaf',     farmer: 'Oak & Mill Bakery',    price: '$7.00', unit: 'loaf',  status: 'In stock',  statusTone: 'herb' },
  { id: 'item-3', name: 'Wildflower honey',   farmer: 'Hollow Creek Apiary',  price: '$9.50', unit: 'jar',   status: 'Low stock', statusTone: 'carrot' },
  { id: 'item-4', name: 'Rainbow carrots',    farmer: 'Riverbend Farm',       price: '$4.50', unit: 'bunch', status: 'In stock',  statusTone: 'herb' },
  { id: 'item-5', name: 'Farm eggs',          farmer: 'Willow Bend Poultry',  price: '$6.00', unit: 'dozen', status: 'In stock',  statusTone: 'herb' },
  { id: 'item-6', name: 'Rhubarb',            farmer: 'Hollow Creek Apiary',  price: '$3.50', unit: 'bunch', status: 'Low stock', statusTone: 'carrot' },
];

export const FEATURED_FARMERS = [
  { id: 'farmer-1', name: 'Riverbend Farm',      description: 'Vegetables and herbs · Elm Street on Saturdays', rating: '4.9', reviewCount: 48, illustration: 'crate' },
  { id: 'farmer-2', name: 'Oak & Mill Bakery',   description: 'Sourdough breads and pastries · Elm Street on Saturdays', rating: '5.0', reviewCount: 62, illustration: 'loaf' },
  { id: 'farmer-3', name: 'Hollow Creek Apiary', description: 'Raw local honey and preserves · Elm Street on Saturdays', rating: '4.8', reviewCount: 35, illustration: 'honey' },
];

export const TEAM_MEMBERS = [
  { id: 'team-1', name: 'Marta Davies',    initials: 'MD', role: 'Market Coordinator',  bio: 'Twelve years organizing regional markets and supporting local growers.' },
  { id: 'team-2', name: 'Sarah Lin',       initials: 'SL', role: 'Product & Design',    bio: 'Crafting calm software that farmers and neighbours love to use.' },
  { id: 'team-3', name: 'James Thornton',  initials: 'JT', role: 'Farmer Support',      bio: 'Helping smallholders list their harvest with zero tech headaches.' },
  { id: 'team-4', name: 'Elena Ramos',     initials: 'ER', role: 'Community Lead',      bio: 'Connecting families with fresh produce across our Saturday stalls.' },
];

export const FAQ_ITEMS = [
  { id: 'faq-1', question: 'Do I pay online?',       answer: 'No. You pay the Farmer in person at pickup. Cash or card is accepted at the stall depending on the Farmer.' },
  { id: 'faq-2', question: 'Can I change my order?',  answer: 'Yes, until the Farmer\'s cut-off time (usually Friday evening before Saturday market day).' },
  { id: 'faq-3', question: 'Do you deliver?',         answer: 'No. MarketLink is for pickup at the market only. There are no delivery vans or courier fees.' },
];
