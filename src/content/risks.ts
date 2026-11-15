// Generated with AI assistance (Antigravity). Reviewed by the team.

export interface HRPRisk {
  id: string;
  name: string;
  hazard: 'radiation' | 'isolation' | 'distance' | 'gravity' | 'closed_env';
  summary: string;
  why_it_matters_in_space: string;
  actions: string[];
  escalate_when: string[];
  source_url: string;
  verified: boolean;
}

export const HRP_RISKS: Record<string, HRPRisk> = {
  cardiovascular: {
    id: 'cardiovascular',
    name: 'Cardiovascular Adaptations & Deconditioning',
    hazard: 'gravity',
    summary: 'Cephalad fluid redistribution and loss of hydrostatic pressure gradients in microgravity lead to cardiac remodeling and post-flight orthostatic intolerance.',
    why_it_matters_in_space: 'In zero-g, blood and interstitial fluids shift upward toward the head. The heart senses an apparent fluid overload, leading to reduced stroke volume and left ventricular mass reduction.',
    actions: [
      'Complete daily 30-minute interval protocol on the T2 cycle ergometer.',
      'Maintain sodium and fluid repletion protocol 24 hours prior to G-transitions or EVAs.',
      'Apply Lower Body Negative Pressure (LBNP) countermeasure sessions as prescribed.',
    ],
    escalate_when: [
      'Resting heart rate > 110 bpm or sustained arrhythmias.',
      'Orthostatic lightheadedness or presyncope during partial-g or EVA egress.',
      'Sustained blood pressure exceeding 140/90 mmHg.',
    ],
    source_url: 'https://www.nasa.gov/hrp/risks/',
    verified: true,
  },
  bone_changes: {
    id: 'bone_changes',
    name: 'Spaceflight-Induced Bone Mineral Loss',
    hazard: 'gravity',
    summary: 'Progressive demineralization of weight-bearing bones (femur, spine, pelvis) at approximately 1.0% to 1.5% per month in microgravity.',
    why_it_matters_in_space: 'Unloading of mechanical stress leads to osteoclast hyperactivity and calcium excretion, causing long-term osteoporosis and risk of renal stones.',
    actions: [
      'Perform daily heavy resistance loading via ARED (Advanced Resistive Exercise Device).',
      'Maintain daily oral Vitamin D3 (1000-2000 IU) and adequate calcium balance.',
      'Ensure high hydration (> 2.5 L/day) to prevent hypercalciuric nephrolithiasis.',
    ],
    escalate_when: [
      'Acute localized flank pain indicative of kidney stone passage.',
      'Severe spinal pain following resistive loading maneuvers.',
    ],
    source_url: 'https://www.nasa.gov/hrp/risks/',
    verified: true,
  },
  reduced_fitness: {
    id: 'reduced_fitness',
    name: 'Reduced Physical Fitness & Muscle Atrophy',
    hazard: 'gravity',
    summary: 'Rapid loss of skeletal muscle mass and strength, especially in postural calf and thigh muscle groups.',
    why_it_matters_in_space: 'Decreased aerobic capacity (VO2 max) and muscle strength compromise astronaut capability to perform demanding lunar surface EVAs or emergency spacecraft egress.',
    actions: [
      'Execute combined daily ARED resistive training (squats, deadlifts) and T2 treadmill running.',
      'Monitor protein intake target (1.2 to 1.5 g/kg body weight/day).',
    ],
    escalate_when: [
      'Inability to sustain prescribed 45-minute continuous aerobic target.',
      'Subjective muscle weakness interfering with mission operations.',
    ],
    source_url: 'https://www.nasa.gov/hrp/risks/',
    verified: true,
  },
  sans: {
    id: 'sans',
    name: 'Spaceflight Associated Neuro-ocular Syndrome (SANS)',
    hazard: 'gravity',
    summary: 'Optic disc edema, posterior globe flattening, choroidal folds, and hyperopic refractive shift resulting from chronic cephalad venous congestion.',
    why_it_matters_in_space: 'SANS can lead to irreversible visual acuity deterioration and structural retinal changes during long-duration interplanetary missions.',
    actions: [
      'Perform weekly optical coherence tomography (OCT) and visual acuity chart checks.',
      'Track optical refraction and use adjustable focus mission lenses.',
      'Participate in LBNP chorioretinal decongestion protocol.',
    ],
    escalate_when: [
      'New onset visual blurring, scotoma, or headache with diplopia.',
      'Observed Frisen scale Grade 2+ optic disc edema on fundoscopy.',
    ],
    source_url: 'https://www.nasa.gov/hrp/risks/',
    verified: true,
  },
  behavioural: {
    id: 'behavioural',
    name: 'Behavioural Changes & Psychiatric Conditions',
    hazard: 'isolation',
    summary: 'Psychological and interpersonal strain induced by prolonged sensory deprivation, microgravity confinement, and separation from family.',
    why_it_matters_in_space: 'Crew mood degradation or interpersonal friction directly threatens mission safety, team cohesion, and high-consequence operational accuracy.',
    actions: [
      'Conduct daily subjective mood and stress check-ins.',
      'Schedule dedicated crew recreation, private family comms, and mindfulness windows.',
      'Engage in peer-support debriefing sessions weekly.',
    ],
    escalate_when: [
      'Mood score ≤ 2 for 3 consecutive days.',
      'Severe depressive symptoms, insomnia, or emotional withdrawal.',
    ],
    source_url: 'https://www.nasa.gov/hrp/risks/',
    verified: true,
  },
  sleep_irregular: {
    id: 'sleep_irregular',
    name: 'Sleep Loss & Irregular Schedules',
    hazard: 'isolation',
    summary: 'Chronic sleep debt and disruption of endogenous circadian pacemaker due to non-24-hour light/dark cycles and habitat acoustic noise.',
    why_it_matters_in_space: 'Acute sleep deprivation impairs attention, reaction time, cognitive flexibility, and autonomous emergency decision-making.',
    actions: [
      'Enforce strict 8.5-hour scheduled rest opportunity in sound-attenuated sleep quarters.',
      'Utilize dynamic LED spectrum lighting (blue-depleted light 2h prior to sleep).',
      'Wear actigraphy band continuously during mission rest periods.',
    ],
    escalate_when: [
      'Less than 5.5 hours total sleep for two consecutive mission cycles.',
      'PVT (Psychomotor Vigilance Task) performance showing significant attentional lapses.',
    ],
    source_url: 'https://www.nasa.gov/hrp/risks/',
    verified: true,
  },
  nutrition: {
    id: 'nutrition',
    name: 'Inadequate Food and Nutrition',
    hazard: 'closed_env',
    summary: 'Caloric deficiency, degradation of micronutrients in pre-packaged space food, and altered intestinal nutrient bioavailability.',
    why_it_matters_in_space: 'Sub-optimal nutrition accelerates muscle catabolism, suppresses immune defenses, and impairs bone repair mechanisms.',
    actions: [
      'Log daily caloric intake and macro balance against mission energy target.',
      'Rotate nutrient-dense fortified rations and fresh greenhouse crops when available.',
      'Take daily multivitamin and antioxidant supplements.',
    ],
    escalate_when: [
      'Unintended body mass loss > 5% over 30 mission days.',
      'Fasting glucose < 55 mg/dL or signs of metabolic exhaustion.',
    ],
    source_url: 'https://www.nasa.gov/hrp/risks/',
    verified: true,
  },
  hypoxia: {
    id: 'hypoxia',
    name: 'Hypoxia & Hostile Atmospheric Exposures',
    hazard: 'closed_env',
    summary: 'Reduced partial pressure of oxygen or elevated toxic gaseous contaminants in closed life-support atmospheric loops.',
    why_it_matters_in_space: 'Oxygen deprivation rapidly degrades cerebral cortical function, causes motor ataxia, and can lead to loss of consciousness within minutes in space habitat accidents.',
    actions: [
      'Continuous SpO2 telemetry monitoring during high-risk operations.',
      'Regular verification of ECLSS atmospheric cabin partial pressure oxygen sensors.',
      'Pre-EVA hyperoxic denitrogenation pre-breathe compliance.',
    ],
    escalate_when: [
      'SpO2 < 92% (immediate donning of emergency breathing apparatus).',
      'Symptoms of confusion, cyanosis, or rapid breathing.',
    ],
    source_url: 'https://www.nasa.gov/hrp/risks/',
    verified: true,
  },
  immune_response: {
    id: 'immune_response',
    name: 'Altered Immune Responses & Space Fever',
    hazard: 'closed_env',
    summary: 'Suppression of cell-mediated immunity coupled with persistent low-grade systemic inflammation and core temperature elevation ("space fever").',
    why_it_matters_in_space: 'Dormant herpesviruses (EBV, VZV, CMV) frequently reactivate in spaceflight, increasing vulnerability to opportunistic infections and skin rashes.',
    actions: [
      'Log resting core body temperature every morning.',
      'Inspect skin and mucous membranes for viral reactivation or contact dermatitis.',
      'Maintain rigorous habitat microbial surface sanitation protocols.',
    ],
    escalate_when: [
      'Core body temperature > 38.0°C or persistent unexplained fever.',
      'Spreading dermatological rash or localized infection.',
    ],
    source_url: 'https://www.nasa.gov/hrp/risks/',
    verified: true,
  },
  radiation_cancers: {
    id: 'radiation_cancers',
    name: 'Radiation-Induced Cancers & Degenerative Tissue Damage',
    hazard: 'radiation',
    summary: 'Excess lifetime risk of radiation-induced fatal cancer, cataracts, and central nervous system damage from Galactic Cosmic Rays and high-LET neutrons.',
    why_it_matters_in_space: 'Outside Earth\'s magnetosphere, astronauts receive chronic high-energy iron-ion (HZE) and secondary neutron irradiation with high relative biological effectiveness.',
    actions: [
      'Continuous personal active dosimeter and CSA CANS neutron spectrometer monitoring.',
      'Retreat to storm shelter module with water and hydrogenous polymer shielding during SPEs.',
      'Track cumulative dose against NASA 600 mSv career limit.',
    ],
    escalate_when: [
      'Dose rate > 60 µSv/h (SPE warning) or > 150 µSv/h (critical storm shelter alert).',
      'Cumulative career dose reaching 80% of allowed mission budget.',
    ],
    source_url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    verified: true,
  },
};
