export interface ApiImage {
  public_id: string
  secure_url: string
}

export interface ApiUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "customer" | "manager" | "staff"
  gender?: "male" | "female"
  phone: string
  isEmailVerified: boolean
  isActive?: boolean
  employmentStatus?: "active" | "inactive" | "terminated"
  employeeCode?: string
  department?: string
  hireDate?: string
  notes?: string
  DOB?: string
  image?: ApiImage
  restaurantId?: string
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
  isActive?: boolean
  employmentStatus?: string
  sort?: string
  order?: "asc" | "desc"
}

export interface CreateUserPayload {
  firstName: string
  lastName: string
  email: string
  password?: string
  phone: string
  role?: "admin" | "customer" | "manager" | "staff"
  restaurantId?: string
  gender?: "male" | "female"
  DOB?: string
  employeeCode?: string
  department?: string
  hireDate?: string
  notes?: string
}

export interface UpdateUserPayload {
  firstName?: string
  lastName?: string
  phone?: string
  gender?: "male" | "female"
  DOB?: string
  role?: "admin" | "customer" | "manager" | "staff"
  restaurantId?: string
  employeeCode?: string
  department?: string
  hireDate?: string
  notes?: string
  isActive?: boolean
  employmentStatus?: "active" | "inactive" | "terminated"
}

