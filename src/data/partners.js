// The Amplify partner roster. Shared by the homepage marquee and the Causes
// page. Logos live in /public/partners/logos/<slug>.png unless `logo` overrides
// the path; a missing logo falls back to the org name in text.
//
// Descriptions and categories are first-draft placeholders — refine freely.
export const partners = [
  {
    name: 'A Time',
    slug: 'atime',
    category: 'Family Support',
    description: 'Compassionate support, advocacy, and guidance for couples facing infertility and pregnancy loss.',
  },
  {
    name: 'Aish',
    slug: 'aish',
    category: 'Torah & Education',
    description: 'Making Jewish wisdom and connection accessible to people at every stage of their journey.',
  },
  {
    name: 'Bnai Akiva',
    slug: 'bnai-akiva',
    category: 'Youth',
    description: 'The religious-Zionist youth movement shaping the next generation through Torah and love of Israel.',
  },
  {
    name: 'Bonei Olam',
    slug: 'bonei-olam',
    category: 'Medical',
    description: 'Funding fertility treatment and medical research so couples struggling to conceive can build families.',
  },
  {
    name: 'Camp HASC',
    slug: 'camp-hasc',
    category: 'Special Needs',
    description: 'A summer home where children and adults with disabilities are known, loved, and celebrated.',
  },
  {
    name: 'Chabad on Campus',
    slug: 'chabad-on-campus',
    category: 'Campus Life',
    description: 'A warm Jewish home away from home for students on hundreds of college campuses.',
  },
  {
    name: 'Chai Lifeline',
    slug: 'chai-lifeline',
    category: 'Crisis & Illness',
    description: 'Wrapping families in support the moment a child faces serious illness, at no cost to them.',
  },
  {
    name: 'FIDF',
    slug: 'fidf',
    category: 'Soldier Support',
    description: 'Supporting the wellbeing of IDF soldiers and their families through educational, social, and financial assistance programs.',
  },
  {
    name: 'Misaskim',
    slug: 'misaskim',
    category: 'Crisis & Illness',
    description: 'Volunteers providing immediate, hands-on support to families in the first hours of a crisis or loss.',
  },
  {
    name: 'Mizrachi',
    slug: 'mizrachi',
    category: 'Torah & Education',
    description: 'Advancing religious Zionism worldwide through Torah, education, and connection to Israel.',
  },
  {
    name: 'Zaka',
    slug: 'zaka',
    category: 'Emergency Response',
    description: 'Volunteer first responders providing search, rescue, and dignity for every victim.',
  },
];

// Resolve a partner's logo path (explicit override or slug-based default).
export const partnerLogo = (p) => p.logo || `/partners/logos/${p.slug}.png`;

// `value` is the number the counter animates to; `abbrev: true` renders it
// compactly (2000000 -> "2M", 800000 -> "800K"), otherwise it shows in full
// with commas ("10,000"). All are shown with a trailing "+". `org` is not
// displayed (the band is framed as Amplify's collective impact, not
// per-partner) — it's kept only as a stable React key. Only orgs with a
// live logo (see `partners` above) get a stat here.
export const impactStats = [
  { org: 'Bonei Olam',       value: 15000,  abbrev: false, label: 'Babies born through treatment' },
  { org: 'Chai Lifeline',    value: 50000,  abbrev: false, label: 'Families supported nationwide' },
  { org: 'Camp HASC',        value: 500,    abbrev: false, label: 'Campers with disabilities each summer' },
  { org: 'Chabad on Campus', value: 160000, abbrev: true,  label: 'Jewish students reached on campus' },
  { org: 'FIDF',             value: 170000, abbrev: true,  label: 'Soldiers, veterans & families supported' },
  { org: 'Zaka',             value: 10000,  abbrev: false, label: 'Emergency responses each year' },
];
