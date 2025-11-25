import { Launch } from '../types';

export interface RocketDetails {
  id: number;
  name: string;
  family: string;
  full_name: string;
  variant?: string;
  description?: string;
  min_stage?: number;
  max_stage?: number;
  length?: number;
  diameter?: number;
  launch_mass?: number;
  leo_capacity?: number;
  gto_capacity?: number;
  to_thrust?: number;
  apogee?: number;
  vehicle_range?: number;
  image_url?: string;
  info_url?: string;
  wiki_url?: string;
  first_flight?: string;
  last_flight?: string;
  // SpaceX-specific fields
  boosters?: number;
  cost_per_launch?: number;
  success_rate_pct?: number;
  stages?: number;
  engines?: {
    number?: number;
    type?: string;
    version?: string;
    layout?: string;
    isp?: {
      sea_level?: number;
      vacuum?: number;
    };
    thrust_sea_level?: {
      kN?: number;
      lbf?: number;
    };
    thrust_vacuum?: {
      kN?: number;
      lbf?: number;
    };
  };
  landing_legs?: {
    number?: number;
    material?: string;
  };
  payload_weights?: Array<{
    id: string;
    name: string;
    kg: number;
    lb: number;
  }>;
  // Booster history
  booster_flights?: Array<{
    id: string;
    name: string;
    flight_number: number;
    date: string;
    success: boolean;
    reused: boolean;
  }>;
}

export interface EngineLayout {
  type: string;
  count: number;
  layout: string; // 'single', 'double', 'triple', 'quad', 'octaweb', etc.
  positions?: Array<{ x: number; y: number }>;
}

// Generate default SpaceX-style mission timeline
export function generateDefaultTimeline(launch: Launch): Array<{
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
}> {
  const launchTime = new Date(launch.net);
  const timeline: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    icon: string;
  }> = [];

  // T-0: Launch
  timeline.push({
    id: 'launch',
    title: 'Launch',
    description: 'Rocket lifts off from the launch pad',
    time: launchTime.toISOString(),
    icon: 'rocket-launch',
  });

  // T+1:30 - Max Q (Maximum dynamic pressure)
  const maxQTime = new Date(launchTime.getTime() + 90 * 1000);
  timeline.push({
    id: 'maxq',
    title: 'Max Q',
    description: 'Maximum aerodynamic pressure',
    time: maxQTime.toISOString(),
    icon: 'speedometer',
  });

  // T+2:30 - MECO (Main Engine Cutoff)
  const mecoTime = new Date(launchTime.getTime() + 150 * 1000);
  timeline.push({
    id: 'meco',
    title: 'MECO',
    description: 'First stage main engine cutoff',
    time: mecoTime.toISOString(),
    icon: 'engine-off',
  });

  // T+2:35 - Stage Separation
  const sepTime = new Date(launchTime.getTime() + 155 * 1000);
  timeline.push({
    id: 'separation',
    title: 'Stage Separation',
    description: 'First and second stages separate',
    time: sepTime.toISOString(),
    icon: 'layers',
  });

  // T+3:00 - Second Stage Ignition
  const secondStageTime = new Date(launchTime.getTime() + 180 * 1000);
  timeline.push({
    id: 'second-stage',
    title: 'Second Stage Ignition',
    description: 'Second stage engines ignite',
    time: secondStageTime.toISOString(),
    icon: 'rocket',
  });

  // T+6:00 - Fairing Separation (if applicable)
  const fairingTime = new Date(launchTime.getTime() + 360 * 1000);
  timeline.push({
    id: 'fairing',
    title: 'Fairing Separation',
    description: 'Payload fairing jettisoned',
    time: fairingTime.toISOString(),
    icon: 'package',
  });

  // T+8:30 - SECO (Second Engine Cutoff)
  const secoTime = new Date(launchTime.getTime() + 510 * 1000);
  timeline.push({
    id: 'seco',
    title: 'SECO',
    description: 'Second stage engine cutoff',
    time: secoTime.toISOString(),
    icon: 'engine-off',
  });

  // T+9:00 - Payload Deployment
  const deployTime = new Date(launchTime.getTime() + 540 * 1000);
  timeline.push({
    id: 'deployment',
    title: 'Payload Deployment',
    description: 'Payload deployed to orbit',
    time: deployTime.toISOString(),
    icon: 'satellite',
  });

  return timeline;
}

// Parse engine layout from SpaceX data or generate default
export function parseEngineLayout(rocketDetails?: RocketDetails): EngineLayout | null {
  if (!rocketDetails?.engines) {
    return null;
  }

  const engines = rocketDetails.engines;
  const count = engines.number || 9; // Default for Falcon 9
  const layout = engines.layout || 'octaweb';

  // Generate positions for common layouts
  const positions: Array<{ x: number; y: number }> = [];
  
  if (layout === 'octaweb' || count === 9) {
    // Octaweb: 8 engines in a circle, 1 in center
    const radius = 40;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      positions.push({
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
      });
    }
    positions.push({ x: 50, y: 50 }); // Center engine
  } else if (count === 1) {
    positions.push({ x: 50, y: 50 });
  } else if (count === 2) {
    positions.push({ x: 30, y: 50 });
    positions.push({ x: 70, y: 50 });
  } else if (count === 3) {
    positions.push({ x: 50, y: 30 });
    positions.push({ x: 30, y: 70 });
    positions.push({ x: 70, y: 70 });
  } else {
    // Default circular arrangement
    const radius = 35;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      positions.push({
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
      });
    }
  }

  return {
    type: engines.type || 'merlin',
    count,
    layout,
    positions,
  };
}

