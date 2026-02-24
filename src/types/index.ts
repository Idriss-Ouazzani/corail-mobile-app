/**
 * Corail - Types & Interfaces
 * Réutilisés et adaptés de VTC Market
 */

export type RideStatus = 'PUBLISHED' | 'CLAIMED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
export type RideVisibility = 'PUBLIC' | 'GROUP'
/** Origine de l'annonce : chauffeur (app), hôtel/établissement, ou client (site web / outil résa) */
export type RideSource = 'chauffeur' | 'hotel' | 'client'
export type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'PLATINUM'
export type VehicleType = 'STANDARD' | 'PREMIUM' | 'ELECTRIC' | 'VAN' | 'LUXURY'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  is_subscribed: boolean
  subscription_plan?: SubscriptionPlan
  rating: number
  total_reviews: number
  credits?: number
  created_at: string
  avatar_url?: string
}

export interface Ride {
  id: string
  creator_id: string
  picker_id: string | null
  pickup_address: string
  dropoff_address: string
  scheduled_at: string
  price_cents: number
  status: RideStatus
  created_at: string
  updated_at: string
  completed_at: string | null
  visibility?: RideVisibility
  /** Origine de l'annonce (chauffeur, hôtel/établissement, client). Défaut: chauffeur */
  source?: RideSource
  group_id?: string | null
  vehicle_type?: VehicleType
  distance_km?: number
  duration_minutes?: number
  client_name?: string
  client_phone?: string
  client_email?: string
  quote_id?: string | null
  quote_status?: 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REFUSED' | null
  quote_token?: string | null
  /** Commentaire / note de l'auteur de l'annonce */
  notes?: string | null
  /** Note (1-5) laissée par le chauffeur (picker) à l'auteur après la course */
  rating_by_picker_stars?: number | null
  /** Commentaire du chauffeur pour l'auteur */
  rating_by_picker_comment?: string | null
  rating_by_picker_at?: string | null
  /** Fourchette indicative (demandes client site web), en centimes */
  indicative_low_cents?: number | null
  indicative_high_cents?: number | null
  creator?: Partial<User>
  picker?: Partial<User>
}

export interface Group {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
  member_count: number
}

export interface RideListResponse {
  data: Ride[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiError {
  detail: string
  status_code: number
}

export interface Location {
  latitude: number
  longitude: number
  address?: string
}

export interface NavigationApp {
  name: string
  icon: string
  color: string
  urlTemplate: (pickup: string, dropoff: string) => string
}

