export type PartnershipApplicationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ONBOARDED"

export interface CreatePartnershipPayload {
  businessName: string
  businessType: string
  description?: string
  estimatedOrdersPerDay?: number
  estimatedWasteKgPerDay?: number
  ownerFirstName: string
  ownerLastName: string
  email: string
  phone: string
  city: string
  district?: string
  street?: string
  website?: string
  facebookPage?: string
  instagramPage?: string
  commercialRegistration?: string
  taxId?: string
  notes?: string
}

export interface PartnershipApplicationStatusResult {
  id: string
  businessName: string
  status: PartnershipApplicationStatus
  createdAt: string
}

export interface PartnershipApplicationItem {
  _id: string
  businessName: string
  businessType: string
  description?: string
  estimatedOrdersPerDay?: number
  estimatedWasteKgPerDay?: number
  ownerFirstName: string
  ownerLastName: string
  email: string
  phone: string
  city: string
  district?: string
  street?: string
  website?: string
  facebookPage?: string
  instagramPage?: string
  commercialRegistration?: string
  taxId?: string
  notes?: string
  status: PartnershipApplicationStatus
  rejectionReason?: string
  reviewedBy?: {
    _id?: string
    firstName?: string
    lastName?: string
    email?: string
  }
  approvedBy?: {
    _id?: string
    firstName?: string
    lastName?: string
    email?: string
  }
  approvedAt?: string
  userId?: {
    _id?: string
    firstName?: string
    lastName?: string
    email?: string
    role?: string
  }
  restaurantId?: {
    _id?: string
    name?: string
    phone?: string
    address?: {
      city?: string
      district?: string
      street?: string
    }
  }
  isDeleted?: boolean
  createdAt: string
  updatedAt: string
}

export interface QueryPartnershipApplicationParams {
  page?: number
  limit?: number
  status?: string
}

export interface PaginatedPartnershipApplications {
  items: PartnershipApplicationItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}
