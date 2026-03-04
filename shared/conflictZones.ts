// Active conflict zones with polygon boundaries
// Source: WorldMonitor project (koala73/worldmonitor), updated 2025

export interface ConflictZone {
  id: string;
  name: string;
  coords: [number, number][]; // [lng, lat] polygon boundary
  center: [number, number];   // [lng, lat] center for popups
  intensity: 'high' | 'medium' | 'low';
  parties: string[];
  casualties: string;
  displaced: string;
  startDate: string;
  location: string;
  description: string;
  keyDevelopments: string[];
}

export const CONFLICT_ZONES: ConflictZone[] = [
  {
    id: 'ukraine',
    name: 'Ukraine War',
    coords: [[22.137, 48.09], [22.558, 49.085], [22.66, 49.79], [23.2, 50.38], [23.82, 51.22], [24.09, 51.89], [25.6, 51.93], [27.85, 52.18], [30.17, 52.1], [32.76, 52.32], [34.4, 51.76], [36.28, 50.3], [38.25, 49.92], [40.18, 49.6], [40.08, 48.88], [39.68, 47.77], [38.21, 47.1], [36.65, 46.58], [35.19, 46.1], [36.47, 45.22], [36, 44.4], [33.55, 44.39], [32.48, 44.52], [31.78, 45.2], [31.44, 46.03], [30.76, 46.38], [29.6, 45.38], [28.21, 45.45], [28.68, 46.45], [28.24, 47.11], [26.62, 48.26], [24.58, 47.96], [22.87, 47.95], [22.137, 48.09]],
    center: [31, 48.5],
    intensity: 'high',
    parties: ['Russia', 'Ukraine', 'NATO (support)'],
    casualties: '500,000+ (est.)',
    displaced: '6.5M+ refugees',
    startDate: 'Feb 24, 2022',
    location: 'Eastern Ukraine (Donetsk, Luhansk)',
    description: 'Full-scale Russian invasion of Ukraine. Active frontlines in Donetsk, Luhansk, Zaporizhzhia, and Kherson oblasts. Heavy artillery, drone warfare, and trench combat.',
    keyDevelopments: ['Battle of Bakhmut', 'Kursk incursion', 'Black Sea drone strikes', 'Infrastructure attacks'],
  },
  {
    id: 'gaza',
    name: 'Gaza Conflict',
    coords: [[34, 32], [35, 32], [35, 31], [34, 31], [34, 32]],
    center: [34.5, 31.5],
    intensity: 'high',
    parties: ['Israel', 'Hamas', 'Hezbollah', 'PIJ'],
    casualties: '40,000+ (Gaza)',
    displaced: '2M+ displaced',
    startDate: 'Oct 7, 2023',
    location: 'Gaza Strip, Palestinian Territories',
    description: 'Israeli military operations in Gaza following October 7 attacks. Ground invasion, aerial bombardment. Humanitarian crisis. Regional escalation with Hezbollah.',
    keyDevelopments: ['Rafah ground operation', 'Humanitarian crisis', 'Hostage negotiations', 'Iran-backed attacks'],
  },
  {
    id: 'south_lebanon',
    name: 'Israel-Lebanon Border',
    coords: [[35.1, 33.0], [35.1, 33.4], [35.8, 33.4], [35.8, 33.0], [35.1, 33.0]],
    center: [35.4, 33.2],
    intensity: 'high',
    parties: ['Israel (IDF)', 'Hezbollah'],
    casualties: '500+ killed',
    displaced: '150k+ displaced',
    startDate: 'Oct 8, 2023',
    location: 'Southern Lebanon / Northern Israel',
    description: 'Cross-border artillery and rocket fire. Targeted assassinations. High risk of full-scale escalation.',
    keyDevelopments: ['Daily rocket fire', 'IDF airstrikes', 'Buffer zone evacuation', 'Litani River tensions'],
  },
  {
    id: 'yemen_redsea',
    name: 'Red Sea Crisis',
    coords: [[42, 12], [42, 16], [44, 16], [45, 13], [44, 12], [42, 12]],
    center: [43, 14],
    intensity: 'high',
    parties: ['Houthis', 'US/UK Coalition', 'Yemen Govt'],
    casualties: 'Unknown (Maritime)',
    displaced: '4.5M+ (Yemen Civil War)',
    startDate: 'Nov 19, 2023',
    location: 'Red Sea & Gulf of Aden, Yemen',
    description: 'Houthi maritime campaign against commercial shipping. US/UK airstrikes on Houthi targets. Ongoing blockade attempts.',
    keyDevelopments: ['Ship hijackings', 'US airstrikes', 'Cable cuts', 'Sinking of Rubymar'],
  },
  {
    id: 'sudan',
    name: 'Sudan Civil War',
    coords: [[30, 17], [34, 17], [34, 13], [30, 13], [30, 17]],
    center: [32, 15],
    intensity: 'high',
    parties: ['Sudanese Armed Forces (SAF)', 'Rapid Support Forces (RSF)'],
    casualties: '15,000+ killed',
    displaced: '10M+ displaced',
    startDate: 'Apr 15, 2023',
    location: 'Khartoum & Darfur, Sudan',
    description: 'Power struggle between SAF and RSF paramilitary. Fighting centered around Khartoum, Darfur. Major humanitarian catastrophe with famine conditions.',
    keyDevelopments: ['Khartoum battle', 'Darfur massacres', 'El Fasher siege', 'Famine declared'],
  },
  {
    id: 'myanmar',
    name: 'Myanmar Civil War',
    coords: [[95, 22], [98, 22], [98, 18], [95, 18], [95, 22]],
    center: [96.5, 20],
    intensity: 'medium',
    parties: ['Military junta', 'NUG', 'Ethnic armed groups'],
    casualties: '50,000+ (est.)',
    displaced: '2.6M+ displaced',
    startDate: 'Feb 1, 2021',
    location: 'Myanmar (Burma)',
    description: 'Civil war following military coup. Resistance forces gaining ground. Multiple ethnic armed organizations. Humanitarian crisis.',
    keyDevelopments: ['Operation 1027', 'Junta airstrikes', 'Border clashes', 'Resistance advances'],
  },
  {
    id: 'sahel',
    name: 'Sahel Insurgency',
    coords: [[-5, 18], [5, 18], [10, 16], [15, 14], [15, 10], [10, 10], [5, 12], [-5, 14], [-5, 18]],
    center: [2, 14],
    intensity: 'high',
    parties: ['JNIM', 'ISGS', 'Wagner/Africa Corps', 'National armies'],
    casualties: '10,000+ killed annually',
    displaced: '4M+ displaced',
    startDate: '2012',
    location: 'Mali, Burkina Faso, Niger',
    description: 'Islamist insurgency across the Sahel. Multiple military coups. Growing Russian (Wagner) influence. French forces expelled.',
    keyDevelopments: ['4 coups since 2020', 'French forces expelled', 'Wagner expansion', 'ECOWAS tensions'],
  },
  {
    id: 'drc_east',
    name: 'Eastern DRC Conflict',
    coords: [[27, 2], [30, 2], [30, -4], [27, -4], [27, 2]],
    center: [28.5, -1],
    intensity: 'high',
    parties: ['M23 (Rwanda-backed)', 'FARDC', 'MONUSCO', 'ADF'],
    casualties: '6M+ total (since 1996)',
    displaced: '7M+ internally displaced',
    startDate: '1996 (current phase 2021)',
    location: 'North Kivu, South Kivu, Ituri',
    description: 'Armed groups fighting for control of mineral-rich eastern provinces. Rwanda-backed M23 advance. Worst humanitarian crisis in Africa.',
    keyDevelopments: ['M23 advance on Goma', 'Rwanda ceasefire violations', 'MONUSCO withdrawal', 'Mineral exploitation'],
  },
];
