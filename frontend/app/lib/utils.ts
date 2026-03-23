import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number) {
  if (score >= 85) return 'high'
  if (score >= 65) return 'mid'
  return 'low'
}

export function scoreColor(score: number) {
  if (score >= 85) return '#B8FF00'  
  if (score >= 65) return '#00D4FF'  
  return '#FF4D6D'                  
}

export function scoreLabel(score: number) {
  if (score >= 85) return 'ATS READY'
  if (score >= 65) return 'REVIEW'
  return 'NEEDS WORK'
}

export function scorePillClass(score: number) {
  if (score >= 85) return 'pill-success'
  if (score >= 65) return 'pill-warning'
  return 'pill-danger'
}

export const PROPERTY_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Rented", value: "RENTED" },
];

export const AMENITY_OPTIONS = [
  { label: "Gym", value: "GYM" },
  { label: "Swimming Pool", value: "SWIMMING_POOL" },
  { label: "Yoga/Aerobics Studio", value: "YOGA_STUDIO" },
  { label: "Steam Room", value: "STEAM_ROOM" },
  { label: "Sauna", value: "SAUNA" },
  { label: "Clubhouse", value: "CLUBHOUSE" },
  { label: "Rooftop Lounge", value: "ROOFTOP_LOUNGE" },
  { label: "Children's Play Area", value: "PLAY_AREA" },
  { label: "Elevator", value: "ELEVATOR" },
  { label: "Backup Generator", value: "BACKUP_GENERATOR" },
  { label: "Laundry Facilities", value: "LAUNDRY" },
  { label: "Borehole Water Supply", value: "BOREHOLE" },
  { label: "Internet Connectivity", value: "INTERNET" },
];
