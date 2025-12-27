/**
 * Corail - Types & Interfaces
 * Réutilisés et adaptés de VTC Market
 */

export type RideStatus = 'PUBLISHED' | 'CLAIMED' | 'COMPLETED' | 'CANCELLED'
export type RideVisibility = 'PUBLIC' | 'GROUP'
export type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'PLATINUM'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  is_subscribed: boolean
  subscription_plan?: SubscriptionPlan
  rating: number
  total_reviews: number
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
  group_id?: string | null
  commission_enabled?: boolean
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

