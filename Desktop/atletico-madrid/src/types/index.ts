export interface Athlete {
  id: string
  name: string
  sport: string
  code: string
  position?: string
  created_at: string
  active: boolean
}

export interface CheckIn {
  id: string
  athlete_id: string
  date: string
  energy: number
  mood: number
  timestamp: string
  notes?: string
  athlete?: Athlete
}

export interface AthleteStats {
  total_checkins: number
  avg_energy: number
  avg_mood: number
  energy_trend: number
  mood_trend: number
  last_checkin_date: string
}