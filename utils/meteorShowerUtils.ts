export interface MeteorShowerDetails {
  name: string;
  radiant: string; // Constellation where meteors appear to originate
  zhr: string; // Zenithal Hourly Rate (peak meteors per hour)
  parent: string; // Parent comet or asteroid
  duration: string; // Duration of the shower
  bestViewingTime: string; // Best time to view
  description: string; // Detailed description
  viewingTips: string[]; // Tips for viewing
  notableYears?: string; // Notable years with exceptional activity
}

// Detailed information about major meteor showers
export const meteorShowerDetails: { [key: string]: MeteorShowerDetails } = {
  'Quadrantids': {
    name: 'Quadrantids',
    radiant: 'Boötes (near the Big Dipper)',
    zhr: '110 meteors/hour',
    parent: '2003 EH1 (asteroid)',
    duration: 'December 28 - January 12',
    bestViewingTime: 'Late night to dawn (peak around 2 AM local time)',
    description: 'The Quadrantids are known for their bright fireballs and short peak period. They are one of the strongest annual meteor showers, producing up to 110 meteors per hour at peak. The shower is named after the obsolete constellation Quadrans Muralis.',
    viewingTips: [
      'Find a dark location away from city lights',
      'Look northeast toward the constellation Boötes',
      'The peak is very narrow (only a few hours)',
      'Dress warmly - January nights are cold',
      'Allow 20-30 minutes for your eyes to adjust to darkness'
    ],
    notableYears: 'Occasionally produces meteor storms with 200+ meteors/hour'
  },
  'Lyrids': {
    name: 'Lyrids',
    radiant: 'Lyra (near Vega)',
    zhr: '18 meteors/hour',
    parent: 'C/1861 G1 (Thatcher comet)',
    duration: 'April 16 - April 25',
    bestViewingTime: 'Late evening to dawn (best after midnight)',
    description: 'The Lyrids are one of the oldest known meteor showers, observed for over 2,700 years. They produce bright meteors and occasional fireballs. The shower is associated with Comet Thatcher, which orbits the Sun every 415 years.',
    viewingTips: [
      'Look toward the constellation Lyra in the northeast',
      'Find Vega, the brightest star in Lyra',
      'Best viewing is after midnight when the radiant is higher',
      'Watch for bright fireballs - Lyrids are known for them',
      'The shower can produce brief bursts of activity'
    ],
    notableYears: 'Occasional outbursts: 1982 (90/hr), 1922 (1800/hr)'
  },
  'Eta Aquarids': {
    name: 'Eta Aquarids',
    radiant: 'Aquarius (near the star Eta Aquarii)',
    zhr: '50 meteors/hour (Northern Hemisphere), 100+ (Southern Hemisphere)',
    parent: '1P/Halley (Halley\'s Comet)',
    duration: 'April 19 - May 28',
    bestViewingTime: 'Pre-dawn hours (3-5 AM local time)',
    description: 'The Eta Aquarids are associated with Halley\'s Comet, one of the most famous comets. They produce fast, bright meteors with persistent trains. The shower is better observed from the Southern Hemisphere.',
    viewingTips: [
      'Best viewed from Southern Hemisphere locations',
      'Look toward the constellation Aquarius in the east',
      'Pre-dawn hours offer the best viewing',
      'Fast meteors - watch for long trails',
      'The radiant rises late, so early morning is best'
    ],
    notableYears: 'Consistent annual shower with reliable activity'
  },
  'Perseids': {
    name: 'Perseids',
    radiant: 'Perseus (near the Double Cluster)',
    zhr: '100 meteors/hour',
    parent: '109P/Swift-Tuttle comet',
    duration: 'July 17 - August 24',
    bestViewingTime: 'Late evening to dawn (peak around 2-3 AM)',
    description: 'The Perseids are the most popular meteor shower of the year, known for their bright, colorful meteors and high activity rate. They occur during warm summer nights, making them ideal for viewing. The shower is associated with Comet Swift-Tuttle.',
    viewingTips: [
      'One of the best showers for beginners',
      'Look northeast toward the constellation Perseus',
      'Warm summer nights make viewing comfortable',
      'Produces many bright meteors and fireballs',
      'Activity increases after midnight',
      'Can see 50-100 meteors per hour at peak'
    ],
    notableYears: 'Occasional outbursts: 1993 (200+/hr), 2016 (150-200/hr)'
  },
  'Orionids': {
    name: 'Orionids',
    radiant: 'Orion (near Betelgeuse)',
    zhr: '20 meteors/hour',
    parent: '1P/Halley (Halley\'s Comet)',
    duration: 'October 2 - November 7',
    bestViewingTime: 'After midnight to dawn',
    description: 'The Orionids are another meteor shower associated with Halley\'s Comet. They produce fast meteors that can be seen in both the Northern and Southern Hemispheres. The shower has a broad peak, making it easier to catch.',
    viewingTips: [
      'Look toward the constellation Orion',
      'Find Betelgeuse, the bright red star in Orion',
      'Fast meteors - watch for quick streaks',
      'Broad peak means good viewing over several nights',
      'Best after midnight when Orion is higher in the sky'
    ],
    notableYears: 'Occasional outbursts: 2006-2009 (50-70/hr)'
  },
  'Leonids': {
    name: 'Leonids',
    radiant: 'Leo (near the star Regulus)',
    zhr: '15 meteors/hour (normal), 1000+ (storm years)',
    parent: '55P/Tempel-Tuttle comet',
    duration: 'November 6 - November 30',
    bestViewingTime: 'Late night to dawn',
    description: 'The Leonids are famous for producing meteor storms every 33 years when the parent comet returns. During storm years, thousands of meteors can be seen per hour. In normal years, they produce a modest but reliable display.',
    viewingTips: [
      'Look toward the constellation Leo in the east',
      'Find Regulus, the brightest star in Leo',
      'Best viewing is after midnight',
      'Watch for fast, bright meteors',
      'Every 33 years produces spectacular storms'
    ],
    notableYears: 'Historic storms: 1833 (100,000+/hr), 1966 (100,000+/hr), 2001 (1000+/hr)'
  },
  'Geminids': {
    name: 'Geminids',
    radiant: 'Gemini (near Castor and Pollux)',
    zhr: '120 meteors/hour',
    parent: '3200 Phaethon (asteroid)',
    duration: 'December 4 - December 17',
    bestViewingTime: 'Evening to dawn (best around 2 AM)',
    description: 'The Geminids are considered one of the best and most reliable meteor showers of the year. They produce bright, colorful meteors and have a high activity rate. Unlike most meteor showers, the Geminids originate from an asteroid rather than a comet.',
    viewingTips: [
      'One of the best showers of the year',
      'Look toward the constellation Gemini',
      'Find the bright stars Castor and Pollux',
      'Produces many bright, colorful meteors',
      'Good viewing from early evening through dawn',
      'Can see 100+ meteors per hour at peak'
    ],
    notableYears: 'Consistently one of the strongest annual showers'
  }
};

/**
 * Get detailed information about a meteor shower by name
 */
export function getMeteorShowerDetails(showerName: string): MeteorShowerDetails | null {
  // Extract the shower name from titles like "Perseids Meteor Shower"
  const name = showerName.replace(' Meteor Shower', '').trim();
  return meteorShowerDetails[name] || null;
}

