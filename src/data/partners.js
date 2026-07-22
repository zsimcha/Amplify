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
    logo: '/ChaiLifeline.png',
    category: 'Crisis & Illness',
    description: 'Wrapping families in support the moment a child faces serious illness, at no cost to them.',
  },
  {
    name: 'Leket Israel',
    slug: 'leket-israel',
    category: 'Food Security',
    description: "Israel's national food bank, rescuing healthy surplus food for hundreds of thousands in need.",
  },
  {
    name: 'Mizrachi',
    slug: 'mizrachi',
    category: 'Torah & Education',
    description: 'Advancing religious Zionism worldwide through Torah, education, and connection to Israel.',
  },
  {
    name: 'Renewal',
    slug: 'renewal',
    category: 'Medical',
    description: 'Facilitating living kidney donations that give patients with kidney failure a second chance at life.',
  },
  {
    name: 'StandWithUs',
    slug: 'stand-with-us',
    category: 'Israel Advocacy',
    description: 'Educating and empowering communities to stand up for Israel and confront antisemitism.',
  },
  {
    name: 'TorahAnytime',
    slug: 'torah-anytime',
    category: 'Torah & Education',
    description: 'Tens of thousands of free Torah classes, making Jewish learning accessible anywhere, anytime.',
  },
  {
    name: 'United Hatzalah',
    slug: 'united-hatzalah',
    category: 'Emergency Response',
    description: 'Volunteer first responders reaching any emergency in Israel within minutes, free of charge.',
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
