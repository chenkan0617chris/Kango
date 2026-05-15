export type UserRole = 'tourist' | 'driver'

export type DemandStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type BidStatus = 'active' | 'accepted' | 'rejected' | 'withdrawn'
export type PaymentStatus = 'unpaid' | 'deposited' | 'paid_in_full' | 'refunded'
export type TripStatus = 'confirmed' | 'in_progress' | 'completed' | 'disputed' | 'cancelled'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  bio: string | null
  // driver fields
  license_no?: string | null
  vehicle_type?: string | null
  vehicle_plate?: string | null
  vehicle_photo_url?: string | null
  is_verified: boolean
  rating: number
  total_trips: number
  created_at: string
  updated_at: string
}

export interface Demand {
  id: string
  tourist_id: string
  pickup_loc: string
  waypoints: string[]          // intermediate stops in order
  dropoff_loc: string
  return_loc: string | null    // optional return location
  pickup_detail: string | null
  travel_date: string
  travel_time: string | null
  pax_count: number
  luggage_count: number
  note: string | null
  budget_min: number | null   // AUD cents
  budget_max: number | null   // AUD cents
  status: DemandStatus
  accepted_bid_id: string | null
  created_at: string
  updated_at: string
  // joined
  tourist?: Profile
  bids?: Bid[]
}

export interface Bid {
  id: string
  demand_id: string
  driver_id: string
  price: number             // AUD cents
  vehicle_info: string
  message: string | null
  status: BidStatus
  created_at: string
  updated_at: string
  // joined
  driver?: Profile
  demand?: Demand
}

export interface Order {
  id: string
  demand_id: string
  bid_id: string
  tourist_id: string
  driver_id: string
  amount: number            // AUD cents
  payment_status: PaymentStatus
  trip_status: TripStatus
  tourist_confirmed_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // joined
  demand?: Demand
  bid?: Bid
  tourist?: Profile
  driver?: Profile
}

export interface Review {
  id: string
  order_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
}

// API response helpers
export type ApiResponse<T> = { data: T; error: null } | { data: null; error: string }

// Form types
export interface CreateDemandInput {
  pickup_loc: string
  waypoints?: string[]
  dropoff_loc: string
  return_loc?: string
  pickup_detail?: string
  travel_date: string
  travel_time?: string
  pax_count: number
  luggage_count: number
  note?: string
  budget_min?: number
  budget_max?: number
}

export interface CreateBidInput {
  demand_id: string
  price: number   // AUD dollars (will be converted to cents)
  vehicle_info: string
  message?: string
}
