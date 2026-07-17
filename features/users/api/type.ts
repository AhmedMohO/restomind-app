export interface ApiImage {
  public_id: string
  secure_url: string
}

export interface ApiUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "customer" | "manager"
  gender?: "male" | "female"
  phone: string
  isEmailVerified: boolean
  DOB?: string
  image?: ApiImage
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedUsers {
  items: ApiUser[]
  page: number
  limit: number
  totalPages: number
}

export interface GetUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  sort?: string
  order?: "asc" | "desc"
}

export interface CreateUserPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  role?: "admin" | "customer" | "manager"
  gender?: "male" | "female"
  DOB?: string
}

export interface UpdateUserPayload {
  firstName?: string
  lastName?: string
  phone?: string
  gender?: "male" | "female"
  DOB?: string
  role?: "admin" | "customer" | "manager"
}
