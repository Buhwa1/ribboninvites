// ============================================================
//  RIBBONINVITES — BUSINESS SETTINGS
//  Edit these before going live. Everything on the site reads from here.
//  Guest-limit numbers must match lib/plans.js (the server enforces them).
// ============================================================
window.BRAND = {
  name: 'RibbonInvites',
  domain: 'ribboninvites.com',
  tagline: 'Elegant invitations, opened with care',
  salesWhatsApp: '256700000000',           // your business WhatsApp number, digits only (256…)
  email: 'hello@ribboninvites.com',
  instagram: 'ribboninvites',
  tiktok: 'ribboninvites',

  payment: {
    lines: ['MTN Mobile Money: 0770 000 000', 'Airtel Money: 0750 000 000'],
    accountName: 'RibbonInvites'
  },
  setupFee: 100000,                         // optional "we set it up for you" service

  plans: [
    { id: 'intimate', name: 'Intimate', guests: 50,  price: 200000, note: 'Small weddings and family gatherings' },
    { id: 'classic',  name: 'Classic',  guests: 100, price: 300000, note: 'Our most chosen plan', popular: true },
    { id: 'grand',    name: 'Grand',    guests: 250, price: 550000, note: 'Full church and garden weddings' },
    { id: 'gala',     name: 'Gala',     guests: 500, price: 850000, note: 'Large introductions and receptions' }
  ],

  templates: [
    { id: 'porcelain', name: 'Porcelain', mood: 'Blush paper with embossed florals', opening: 'Gatefold doors swing open', best: 'Church and garden weddings',
      swatch: ['#EFE3DB', '#F8F0EA', '#9C7A5B'] },
    { id: 'lubugo', name: 'Lubugo', mood: 'Barkcloth, cream and gold', opening: 'A wax-sealed envelope opens', best: 'Weddings with a Ugandan heritage touch',
      swatch: ['#76401F', '#F6EEDF', '#A8802F'] },
    { id: 'emerald', name: 'Emerald', mood: 'Green velvet with art-deco gold', opening: 'A gold ribbon unties', best: 'Evening and black-tie receptions',
      swatch: ['#0F3B2E', '#185645', '#D4AF6A'] },
    { id: 'vellum', name: 'Vellum', mood: 'Linen white, modern and minimal', opening: 'A vellum sleeve slides away', best: 'Modern and city weddings',
      swatch: ['#FAF8F4', '#D8CDB7', '#1D1C1A'] },
    { id: 'royal', name: 'Royal', mood: 'Maroon velvet, ivory and gold', opening: 'Velvet curtains part', best: 'Introductions (kwanjula) and grand weddings',
      swatch: ['#5A1424', '#FFF9EF', '#B08A3A'] }
  ]
};
