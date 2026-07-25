# RestoMind API Documentation

This documentation provides comprehensive details for integrating with the **RestoMind API**. It is designed specifically for frontend developers, detailing base configurations, request/response formats, authorization levels, parameters, validations, and response schemas.

---

## Table of Contents

1. [General Setup & Configurations](#1-general-setup--configurations)
2. [Core Model Schemas (Response Entities)](#2-core-model-schemas-response-entities)
3. [Authentication Module (`/auth`)](#3-authentication-module-auth)
4. [User Management Module (`/users`)](#4-user-management-module-users)
5. [Categories Module (`/categories`)](#5-categories-module-categories)
6. [Products Module (`/products`)](#6-products-module-products)
7. [Favorites Module (`/favorites`)](#7-favorites-module-favorites)
8. [Cart Module (`/cart`)](#8-cart-module-cart)
9. [Orders Module (`/orders` & `/order-groups`)](#9-orders-module-orders--order-groups)
10. [Restaurant Module (`/restaurants`)](#10-restaurant-module-restaurants)
11. [Offers Module (`/offers`)](#11-offers-module-offers)
12. [Ingredients Module (`/ingredients`)](#12-ingredients-module-ingredients)
13. [Dashboard Module (`/dashboard`)](#13-dashboard-module-dashboard)
14. [Sales Module (`/sales`)](#14-sales-module-sales)
15. [End-to-End Shopping, Order, Sales & Analytics Workflow](#15-end-to-end-shopping-order-sales--analytics-workflow)

---

## 1. General Setup & Configurations

### Base URL

- **Local Development**: `http://localhost:3000` (or the port defined in your `.env`)

### Content Type

- Default: `application/json`
- File Uploads: `multipart/form-data`

### Authentication & Headers

Protected endpoints require a JWT bearer token sent via the `Authorization` header.

- **Access Token Authorization**:
  - Header: `Authorization`
  - Format: `Bearer <accessToken>`
- **Refresh Token Authorization**: (Only used for generating a new access token)
  - Header: `Authorization`
  - Format: `Bearer <refreshToken>`
- **Reset Token Authorization**: (Only used for resetting password after OTP confirmation)
  - Header: `Authorization`
  - Format: `Bearer <resetToken>`

### Standard Error Response Format

All validation, authentication, and logical errors follow this standard structure:

```json
{
  "statusCode": 400,
  "message": [
    "firstName must be longer than or equal to 3 characters",
    "email must be an email"
  ],
  "error": "Bad Request"
}
```

_Note: For single errors, `"message"` is a string instead of an array of strings._

---

## 2. Core Model Schemas (Response Entities)

Below are the typescript-equivalent structures of the primary entities returned by the API.

### Image Object

```typescript
interface Image {
  public_id: string;   // Cloudinary or file storage identifier
  secure_url: string;  // Publicly accessible image URL
}
```

### User Address Schema

```typescript
interface UserAddress {
  _id: string;          // ObjectId
  label?: string;       // e.g. "Home", "Work"
  fullName: string;
  phoneNumber: string;
  street: string;
  city: string;
  country?: string;
  isDefault: boolean;
}
```

### User Schema

```typescript
interface User {
  _id: string;                  // ObjectId
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'customer' | 'manager' | 'staff';
  gender?: 'male' | 'female';
  phone: string;                // Encrypted on DB, plain string on API boundaries
  isEmailVerified: boolean;
  DOB?: string;                 // ISO Date String
  image?: Image;                // Profile picture object
  restaurantId?: string;        // Associated Restaurant ObjectId (for manager or staff role)
  addresses?: UserAddress[];    // Saved delivery addresses
  isDeleted: boolean;
  createdAt: string;            // ISO Date String
  updatedAt: string;            // ISO Date String
}
```

### Restaurant Schema

```typescript
interface RestaurantAddress {
  street?: string;
  city?: string;
  country?: string;
}

interface Restaurant {
  _id: string;                  // ObjectId
  name: string;
  ownerUserId: string;          // User ObjectId of manager/owner
  description?: string;
  logoUrl?: string;
  phone?: string;
  address?: RestaurantAddress;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string;           // ISO Date String
  createdAt: string;            // ISO Date String
  updatedAt: string;            // ISO Date String
}
```

### Category Schema

```typescript
interface Category {
  _id: string;
  name: string;
  description: string;
  image: Image;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Product Schema

```typescript
interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  price: number;
  discountedPrice: number;
  rating: number;               // Decimal, 0 to 5
  reviewsCount: number;
  isBestseller: boolean;
  isAvailable: boolean;
  image: Image;
  category: string | Category;  // Category ID or populated Category object
  restaurantId: string | Restaurant; // Associated Restaurant ID or populated Restaurant object
  freshnessWindow: number;      // Freshness window in days
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Ingredient Schema

```typescript
type IngredientUnit = 'kg' | 'liter' | 'piece' | 'grams';

interface Ingredient {
  _id: string;
  restaurantId: string;         // Restaurant ObjectId
  ingredientCode?: string;      // Unique per restaurant e.g. "ING-FLOUR-01"
  name: string;
  quantity?: number;
  unit: IngredientUnit;
  shelfLifeDays?: number;
  minimumStock?: number;
  safetyStock?: number;
  minStockAlert?: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Recipe Schema

```typescript
interface RecipeIngredient {
  ingredientId: string | Ingredient;
  quantityPerPortion: number;
  unit: IngredientUnit;
  yieldPercentage: number;     // 0 - 100 (Default: 100)
}

interface Recipe {
  _id: string;
  restaurantId: string;
  productId: string;
  ingredients: RecipeIngredient[];
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Offer Schema

```typescript
interface Offer {
  _id: string;                      // ObjectId
  productId: string | Product;      // Associated Product ID or populated Product
  restaurantId: string | Restaurant; // Associated Restaurant ID or populated Restaurant
  originalPrice: number;            // Product base price at offer creation
  offerPrice: number;               // Calculated discounted price
  discountPercentage: number;       // Discount % (1 - 100)
  availableQuantity: number;        // Total offer capacity allocated
  remainingQuantity: number;        // Available units remaining for purchase
  maxPerCustomer?: number;          // Purchase limit per customer account
  startDate: string;                // ISO Date String
  endDate: string;                  // ISO Date String
  status: 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled' | 'sold_out';
  source: 'manual' | 'ai_recommendation';
  recommendationId?: string;        // Optional AI recommendation ID
  featured: boolean;                // Featured offer flag
  estimatedWasteReduction?: number; // Optional analytics metrics
  estimatedRevenueRecovery?: number;
  actualUnitsSold?: number;
  actualRevenueRecovered?: number;
  createdBy: string;                // User ObjectId of creator
  isDeleted: boolean;
  createdAt: string;                // ISO Date String
  updatedAt: string;                // ISO Date String
}
```

### Cart Item Schema (Offer-Centric)

```typescript
interface CartOfferItem {
  _id: string;
  status: string;
  discountPercentage: number;
  originalPrice: number;
  offerPrice: number;
  remainingQuantity: number;
  maxPerCustomer?: number;
  startDate: string;
  endDate: string;
  product: {
    _id: string;
    title: string;
    image: Image;
  } | null;
  restaurant: {
    _id: string;
    name: string;
  } | null;
}

interface CartItem {
  offer: CartOfferItem;
  quantity: number;
  unitOriginalPrice: number;
  unitOfferPrice: number;
  totalItemPrice: number;       // quantity * unitOfferPrice
}

interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalQuantity: number;
  totalOriginalPrice: number;
  totalDiscount: number;
  finalTotalPrice: number;
}
```

### Favorite Schema (Offer-Centric)

```typescript
interface Favorite {
  _id: string;
  userId: string;
  offerId: string | Offer;       // Populated active/scheduled Offer object
  createdAt: string;
  updatedAt: string;
}
```

### Order & GroupOrder Schemas

```typescript
interface OrderItem {
  offerId: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  restaurantId: string;
  restaurantName: string;
  originalPrice: number;
  offerPrice: number;
  discountPercentage: number;
  quantity: number;
  purchasedAt: string;          // ISO Date string
  lineTotal: number;            // quantity * offerPrice
}

interface DeliveryAddress {
  addressId?: string;
  street: string;
  city: string;
  country: string;
}

interface Order {
  _id: string;
  groupOrderId?: string;
  userId: string;
  restaurantId: string | Restaurant;
  items: OrderItem[];
  totalOriginalPrice: number;
  totalDiscount: number;
  finalTotalPrice: number;
  totalQuantity: number;
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  deliveryMethod: 'Home Delivery' | 'Store Pickup';
  deliveryAddress?: DeliveryAddress;
  specialNotes?: string;
  paymentMethod: 'Cash on Delivery';
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

interface GroupOrder {
  _id: string;
  userId: string;
  orders: Order[];              // Array of populated sub-orders per restaurant
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  deliveryMethod: 'Home Delivery' | 'Store Pickup';
  deliveryAddress?: DeliveryAddress;
  specialNotes?: string;
  paymentMethod: 'Cash on Delivery';
  totalOriginalPrice: number;
  totalDiscount: number;
  finalTotalPrice: number;
  totalQuantity: number;
  overallStatus: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out For Delivery' | 'Delivered' | 'Cancelled' | 'Partially Delivered' | 'Partially Cancelled' | 'Processing';
  createdAt: string;
  updatedAt: string;
}
```

### SalesTransaction Schema

```typescript
interface SalesTransaction {
  _id: string;
  restaurantId: string | Restaurant;
  productId: string | Product;
  date: string;                       // ISO Date String
  quantitySold: number;
  basePrice: number;
  sellingPrice: number;
  promotionActive: boolean;
  featured: boolean;
  salesChannel: string;               // e.g. "marketplace"
  source: 'csv_import' | 'marketplace_order' | 'pos_sync';
  orderId?: string;
  createdAt: string;                  // ISO Date String
  updatedAt: string;                  // ISO Date String
}
```

### Dashboard Analytics Schemas

```typescript
export interface KpiMetric {
  current: number;
  previous: number;
  changePercent: number;        // Percentage change, guarded against division by zero (returns 0)
}

export interface AdminKpis {
  revenue: KpiMetric;
  orders: KpiMetric;
  activeOffers: number;
  pendingOrders: number;
  activeRestaurants: number;
  netProfit: number;
  taxDeduction: number;
  avgOrderValue: number;
  totalUsers: number;
  totalRestaurants: number;
}

export interface ManagerKpis {
  revenue: KpiMetric;
  orders: KpiMetric;
  activeOffers: number;
  pendingOrders: number;
  netProfit: number;
  taxDeduction: number;
  avgOrderValue: number;
}

export interface RankedItem {
  id: string;
  rank: number;
  name: string;
  count: number;
  maxCount: number;
}

export interface FulfillmentMethodItem {
  id: string;
  type: string;
  name: string;
  count: number;
  percentage: number;
}

export interface DashboardStatsResponse {
  kpis: AdminKpis;
  topProducts: RankedItem[];
  topCategories: RankedItem[];
  topRestaurants: RankedItem[];
  fulfillmentMethods: FulfillmentMethodItem[];
}

export interface ManagerDashboardStatsResponse {
  restaurantName: string;
  kpis: ManagerKpis;
  topProducts: RankedItem[];
  topCategories: RankedItem[];
  fulfillmentMethods: FulfillmentMethodItem[];
}
```

---

## 3. Authentication Module (`/auth`)

### 3.1 Sign Up

Registers a new customer. Automatically fires an email verification OTP to the user's email.

- **Method / URL**: `POST /auth/signUp`
- **Auth Level**: Public
- **Request Body (`application/json`)**:

  | Field       | Type   | Required | Rules                          | Description             |
  | :---------- | :----- | :------- | :----------------------------- | :---------------------- |
  | `firstName` | String | Yes      | Min length 3, max length 20    | User's first name       |
  | `lastName`  | String | Yes      | Min length 3, max length 20    | User's last name        |
  | `email`     | String | Yes      | Must be valid email format     | Unique email address    |
  | `password`  | String | Yes      | Min length 6                   | Security password       |
  | `phone`     | String | Yes      | Valid phone number format      | Contact number          |
  | `gender`    | String | No       | Must be `'male'` or `'female'` | User's gender           |
  | `DOB`       | String | No       | ISO Date format (`YYYY-MM-DD`) | Date of birth           |
  | `role`      | String | No       | Must be one of `RolesEnum`     | Default is `'customer'` |

  _Request Example_:

  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "johndoe@example.com",
    "password": "securepassword123",
    "phone": "+1234567890",
    "gender": "male",
    "DOB": "1995-10-15"
  }
  ```

- **Response (201 Created)**:
  Returns the newly created user object (excluding password).

---

### 3.2 Log In

Authenticates user. Returns access and refresh JWT tokens.

- **Method / URL**: `POST /auth/login`
- **Auth Level**: Public
- **Request Body (`application/json`)**:

  | Field      | Type   | Required | Rules              | Description     |
  | :--------- | :----- | :------- | :----------------- | :-------------- |
  | `email`    | String | Yes      | Valid email format | User's email    |
  | `password` | String | Yes      | Min length 6       | User's password |

- **Response (200 OK)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

### 3.3 Get My Profile

Returns the profile info of the authenticated user.

- **Method / URL**: `GET /auth/me`
- **Auth Level**: Access Token (`admin`, `customer`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Active user object.

---

### 3.4 Confirm Email

Verifies email address using the 6-digit code sent via email.

- **Method / URL**: `PATCH /auth/confirm-email`
- **Auth Level**: Public
- **Request Body (`application/json`)**:

  | Field   | Type   | Required | Description            |
  | :------ | :----- | :------- | :--------------------- |
  | `email` | String | Yes      | Verified email address |
  | `otp`   | String | Yes      | 6-digit OTP code       |

- **Response (200 OK)**: `{ "message": "Email confirmed successfully" }`

---

### 3.5 Log Out

Blacklists the current access token.

- **Method / URL**: `POST /auth/logout`
- **Auth Level**: Access Token (`admin`, `customer`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: `{ "message": "Logout successfully" }`

---

### 3.6 Send OTP

Resends verification OTP or reset password OTP.

- **Method / URL**: `POST /auth/send-otp`
- **Auth Level**: Public
- **Request Body (`application/json`)**:

  | Field   | Type   | Required | Rules                                  | Description      |
  | :------ | :----- | :------- | :------------------------------------- | :--------------- |
  | `email` | String | Yes      | Valid email                            | Target email     |
  | `type`  | String | Yes      | `'confirmEmail'` or `'resetPassword'` | Type of OTP flow |

- **Response (200 OK)**: `{ "message": "OTP sent successfully" }`

---

### 3.7 Forgot Password

Generates password reset OTP code and emails it to the user.

- **Method / URL**: `POST /auth/forgot-password`
- **Auth Level**: Public
- **Request Body (`application/json`)**: `{ "email": "johndoe@example.com" }`
- **Response (200 OK)**: `{ "message": "Password reset OTP sent to email" }`

---

### 3.8 Generate Access Token (Token Refresh)

Uses a valid refresh token to get a new short-lived access token.

- **Method / URL**: `POST /auth/generate-access-token`
- **Auth Level**: Refresh Token (`admin`, `customer`, `manager`)
- **Headers**: `Authorization: Bearer <refreshToken>`
- **Response (200 OK)**: `{ "accessToken": "newAccessToken...", "refreshToken": "newRefreshToken..." }`

---

### 3.9 Confirm Reset OTP

Verifies the password reset OTP and returns a temporary `resetToken`.

- **Method / URL**: `PATCH /auth/confirm-reset-otp`
- **Auth Level**: Public
- **Request Body (`application/json`)**: `{ "email": "johndoe@example.com", "otp": "459012" }`
- **Response (200 OK)**: `{ "resetToken": "ey..." }`

---

### 3.10 Reset Password

Updates the password for the user using the `resetToken` received from OTP verification.

- **Method / URL**: `PATCH /auth/reset-password`
- **Auth Level**: Reset Token
- **Headers**: `Authorization: Bearer <resetToken>`
- **Request Body (`application/json`)**: `{ "password": "newPassword123", "confirmPassword": "newPassword123" }`
- **Response (200 OK)**: `{ "message": "Password reset successfully" }`

---

### 3.11 Update Me

Updates active user's details and/or uploads profile photo.

- **Method / URL**: `PATCH /auth/update-me`
- **Auth Level**: Access Token (`admin`, `customer`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**: `firstName`, `lastName`, `phone`, `gender`, `DOB`, `image` (file).
- **Response (200 OK)**: Updated user object.

---

### 3.12 Saved Delivery Addresses (`/auth/addresses`)

- `POST /auth/addresses` — Add Delivery Address
- `GET /auth/addresses` — Get My Saved Addresses
- `PATCH /auth/addresses/:addressId` — Update Saved Address
- `DELETE /auth/addresses/:addressId` — Delete Saved Address
- `PATCH /auth/addresses/:addressId/default` — Set Address as Default

---

## 4. User Management Module (`/users`)

### 4.1 Create User

- **Method / URL**: `POST /users`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  ```json
  {
    "firstName": "Staff",
    "lastName": "Member",
    "email": "staff@restaurant.com",
    "password": "Password123",
    "phone": "+1122334455",
    "role": "staff",
    "gender": "male",
    "DOB": "1995-05-15",
    "restaurantId": "669fc8888888888abcdef222"
  }
  ```
- **Validation Rules**: `firstName`, `lastName`, `email`, `password`, `phone`, `role`, `gender` (`'male'` | `'female'`), and `DOB` (ISO Date) are required. `role` enum (`customer`, `manager`, `admin`, `staff`). `restaurantId` is optional. Managers can only create users with the `staff` role assigned to their own restaurant.

---

### 4.2 Find All Users (Paginated & Filtered)

- **Method / URL**: `GET /users`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `page` | Number / String | `1` | Page number |
  | `limit` | Number / String | `10` | Items per page |
  | `search` | String | *None* | Search in `firstName`, `lastName`, `email`, `phone` |
  | `role` | String | *None* | Filter by role (`customer`, `manager`, `admin`, `staff`) |
  | `restaurantId` | String | *None* | Filter by Restaurant ObjectId |
  | `isDeleted` | Boolean String | *None* | Filter soft-deleted status (`true`, `false`) |
  | `sort` / `sortBy` | String | `createdAt` | Field to sort by |
  | `order` / `sortOrder` | String | `desc` | Sort direction (`asc`, `desc`) |
  | `createdAt` | ISO Date | *None* | Creation date filter |
  | `updatedAt` | ISO Date | *None* | Update date filter |

- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "_id": "669fc7777777777abcdef333",
        "firstName": "Staff",
        "lastName": "Member",
        "email": "staff@restaurant.com",
        "role": "staff"
      }
    ],
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1,
    "pageSize": 10,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
  ```

---

### 4.3 Find User by ID

- **Method / URL**: `GET /users/:id`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`

---

### 4.4 Update User by ID

- **Method / URL**: `PATCH /users/:id`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: Accepts optional `firstName`, `lastName`, `phone`, `role`, `gender`, `DOB`.

---

### 4.5 Soft Delete User

- **Method / URL**: `DELETE /users/:id`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Business Behavior & Constraints**: Soft-deletes user account (`isDeleted: true`).
  - *Conflict Check*: If the user is a manager currently assigned as owner of an active restaurant, returns **HTTP 409 Conflict** with error code `MANAGER_HAS_ACTIVE_RESTAURANT`.
- **Response (200 OK)**: `{ "message": "User deleted successfully" }`
- **Error Response (409 Conflict)**:
  ```json
  {
    "statusCode": 409,
    "message": "Unable to delete this manager because they are currently assigned as the owner of an active restaurant...",
    "code": "MANAGER_HAS_ACTIVE_RESTAURANT"
  }
  ```

---

## 5. Categories Module (`/categories`)

### 5.1 Create Category

- **Method / URL**: `POST /categories`
- **Auth Level**: Access Token (`admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**: `name` (required), `description`, `image` (file, required).

---

### 5.2 Update Category

- **Method / URL**: `PATCH /categories/:id`
- **Auth Level**: Access Token (`admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data` or `application/json`)**: `name`, `description`, optional replacement `image` file.

---

### 5.3 Soft Delete Category

- **Method / URL**: `DELETE /categories/:id`
- **Auth Level**: Access Token (`admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Business Behavior**: Products associated with this category are automatically reassigned to the default system category before soft-deleting the category.

---

### 5.4 View All Categories (Paginated & Searchable)

- **Method / URL**: `GET /categories`
- **Auth Level**: Public
- **Query Parameters**:

  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `page` | Number / String | *Optional* | Page index |
  | `limit` | Number / String | *Optional* | Items count per page |
  | `search` | String | *None* | Search in category name |
  | `isDeleted` | Boolean String | `false` | Soft-deleted filter (`true`, `false`) |

- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "_id": "669fc4444444444abcdef333",
        "name": "Pizzas",
        "description": "Stone baked pizzas",
        "image": {
          "public_id": "categories/pizzas",
          "secure_url": "https://res.cloudinary.com/..."
        }
      }
    ],
    "items": [ ... ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
  ```

---

### 5.5 Get Category by ID

- **Method / URL**: `GET /categories/:id`
- **Auth Level**: Public

---

## 6. Products Module (`/products`)

### 6.1 Create Product

- **Method / URL**: `POST /products`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**: `title`, `description`, `longDescription`, `price`, `discountedPrice`, `category`, `restaurantId`, `freshnessWindow`, `tags[]`, `isBestseller`, `isAvailable`, `image` (file).

---

### 6.2 Update Product

- **Method / URL**: `PATCH /products/:id`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**: Accepts optional fields from `Create Product`, plus an optional replacement `image` file.

---

### 6.3 Delete Product (Soft Delete)

- **Method / URL**: `DELETE /products/:id`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`

---

### 6.4 Change Availability

- **Method / URL**: `PATCH /products/:id/availability`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: `{ "isAvailable": boolean }`

---

### 6.5 Get All Products (Filtered & Paginated)

- **Method / URL**: `GET /products`
- **Auth Level**: Public
- **Query Parameters**: `page`, `limit`, `categoryId`, `restaurantId`, `search`, `isAvailable`, `isDeleted`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`.

---

### 6.6 Get Product Details

- **Method / URL**: `GET /products/:id`
- **Auth Level**: Public
- **Description**: Accepts Mongo ObjectId or product slug string.

---

### 6.7 Upsert Product Recipe

Creates or updates portion recipe for a product. Validates ingredient ownership, units, and yield percentage.

- **Method / URL**: `PUT /products/:productId/recipe`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  ```json
  {
    "ingredients": [
      {
        "ingredientId": "<ingredient_object_id_1>",
        "quantityPerPortion": 0.25,
        "unit": "kg",
        "yieldPercentage": 95
      },
      {
        "ingredientId": "<ingredient_object_id_2>",
        "quantityPerPortion": 0.1,
        "unit": "liter",
        "yieldPercentage": 100
      }
    ]
  }
  ```

---

### 6.8 Get Product Recipe

- **Method / URL**: `GET /products/:productId/recipe`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Retrieves portion recipe for a product with populated ingredient details. Accepts product ObjectId or slug.

---

## 7. Favorites Module (`/favorites`)

The favorites system is **Offer-centric** — customers favorite specific active/scheduled promotional offers.

### 7.1 Add Offer to Favorites

- **Method / URL**: `POST /favorites/:offerId`
- **Auth Level**: Access Token (`customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Adds an active or scheduled offer to customer's favorites. Returns `400 Bad Request` if offer status is invalid or `409 Conflict` if already in favorites.

---

### 7.2 Remove Offer from Favorites

- **Method / URL**: `DELETE /favorites/:offerId`
- **Auth Level**: Access Token (`customer`)
- **Headers**: `Authorization: Bearer <accessToken>`

---

### 7.3 Get All Favorite Offers

- **Method / URL**: `GET /favorites`
- **Auth Level**: Access Token (`customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Returns all favorited items with populated `offerId` (including product & restaurant info).

---

### 7.4 Check If Offer is Favorite

- **Method / URL**: `GET /favorites/:offerId/status`
- **Auth Level**: Access Token (`customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: `{ "isFavorite": boolean }`

---

## 8. Cart Module (`/cart`)

The shopping cart system is **Offer-centric** — customer cart items reference specific active promotional `Offer` IDs.

### 8.1 Get Current Cart

- **Method / URL**: `GET /cart`
- **Auth Level**: Access Token (`customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Returns populated cart summary (`items`, `totalQuantity`, `totalOriginalPrice`, `totalDiscount`, `finalTotalPrice`).

---

### 8.2 Add Offer to Cart

- **Method / URL**: `POST /cart`
- **Auth Level**: Access Token (`customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  ```json
  {
    "offerId": "<offer_object_id>",
    "quantity": 2
  }
  ```

---

### 8.3 Remove Offer from Cart

- **Method / URL**: `DELETE /cart/:offerId`
- **Auth Level**: Access Token (`customer`)
- **Headers**: `Authorization: Bearer <accessToken>`

---

### 8.4 Update Item Quantity in Cart

- **Method / URL**: `PATCH /cart/:offerId`
- **Auth Level**: Access Token (`customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  ```json
  {
    "quantity": 5
  }
  ```

---

### 8.5 Clear Entire Cart

- **Method / URL**: `DELETE /cart`
- **Auth Level**: Access Token (`customer`)
- **Headers**: `Authorization: Bearer <accessToken>`

---

## 9. Orders Module (`/orders` & `/order-groups`)

Orders support multi-restaurant cart checkouts through an aggregated **`GroupOrder`** entity.

### 9.1 Create Order from Cart

- **Method / URL**: `POST /orders`
- **Auth Level**: Access Token (`customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  ```json
  {
    "fullName": "John Doe",
    "phoneNumber": "+1234567890",
    "emailAddress": "johndoe@example.com",
    "deliveryMethod": "Home Delivery",
    "deliveryAddress": {
      "street": "12 Nile St",
      "city": "Cairo",
      "country": "Egypt"
    },
    "specialNotes": "Ring the bell twice",
    "paymentMethod": "Cash on Delivery"
  }
  ```

- **Response (201 Created)**: Aggregated `GroupOrder` structure containing customer info, overall status, total prices, and an array of restaurant sub-orders.

---

### 9.2 Get My Orders (Order History)

- **Method / URL**: `GET /orders/me`
- **Auth Level**: Access Token (`customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `page` | Number / String | No | `1` | Page index |
  | `limit` | Number / String | No | `10` | Items per page |
  | `status` | String | No | *None* | Filter by `OrderStatusEnum` (`Pending`, `Confirmed`, `Preparing`, `Ready`, `Out For Delivery`, `Delivered`, `Cancelled`) |
  | `restaurantId` | String | No | *None* | Filter by Restaurant ObjectId |

- **Response (200 OK)**:
  Paginated wrapper object containing an array of formatted `GroupOrder` objects:
  ```json
  {
    "data": [
      {
        "_id": "669fc999888777abcdef999",
        "groupOrderId": "669fc999888777abcdef999",
        "orderGroupId": "669fc999888777abcdef999",
        "userId": "669fc1234567890abcdef123",
        "fullName": "John Doe",
        "phoneNumber": "+1234567890",
        "emailAddress": "johndoe@example.com",
        "deliveryMethod": "Home Delivery",
        "deliveryAddress": {
          "street": "12 Nile St",
          "city": "Cairo",
          "country": "Egypt"
        },
        "paymentMethod": "Cash on Delivery",
        "specialNotes": "Ring the bell twice",
        "overallStatus": "Pending",
        "items": [
          {
            "offerId": "669fc0000000000abcdef777",
            "productId": "669fc3333333333abcdef444",
            "productTitle": "Margherita Pizza",
            "productImage": "https://res.cloudinary.com/...",
            "restaurantId": "669fc8888888888abcdef222",
            "restaurantName": "Pizza Gourmet Express",
            "originalPrice": 12.99,
            "offerPrice": 10.39,
            "discountPercentage": 20,
            "quantity": 2,
            "purchasedAt": "2026-07-23T20:00:00.000Z",
            "lineTotal": 20.78
          }
        ],
        "totalOriginalPrice": 25.98,
        "totalDiscount": 5.20,
        "finalTotalPrice": 20.78,
        "totalQuantity": 2,
        "createdAt": "2026-07-23T20:00:00.000Z",
        "updatedAt": "2026-07-23T20:00:00.000Z"
      }
    ],
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1,
    "pageSize": 10,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
  ```

---

### 9.3 Get Checkout / Group Order Details

- **Method / URL**: `GET /orders/me/:id`, `GET /orders/group/:id`, or `GET /order-groups/:id`
- **Auth Level**: Access Token (`customer`, `admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Accepts either `groupOrderId` or sub-order `orderId` and returns the unified `GroupOrder` object.

---

### 9.4 Get All Orders (Admin Listing)

- **Method / URL**: `GET /orders`
- **Auth Level**: Access Token (`admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `page` | Number | No | `1` | Page index |
  | `limit` | Number | No | `10` | Items per page |
  | `search` | String | No | *None* | Search in `fullName`, `emailAddress`, `phoneNumber`, `groupOrderId`, or `_id` |
  | `status` | String | No | *None* | Filter by `OrderStatusEnum` (`Pending`, `Confirmed`, `Preparing`, `Ready`, `Out For Delivery`, `Delivered`, `Cancelled`) |
  | `paymentMethod` | String | No | *None* | Filter by payment method (`Cash on Delivery`) |
  | `deliveryMethod` | String | No | *None* | Filter by delivery method (`Home Delivery`, `Store Pickup`) |
  | `startDate` | ISO Date | No | *None* | Start creation date filter (`createdAt >= startDate 00:00:00.000Z`) |
  | `endDate` | ISO Date | No | *None* | End creation date filter (`createdAt <= endDate 23:59:59.999Z`) |
  | `minTotalPrice` | Number | No | *None* | Filter minimum final total price |
  | `maxTotalPrice` | Number | No | *None* | Filter maximum final total price |
  | `restaurantId` | String | No | *None* | Filter by Restaurant ObjectId |
  | `sortBy` / `sort` | String | No | `createdAt` | Field to sort by (`createdAt`, `updatedAt`, `finalTotalPrice`, `totalQuantity`, `overallStatus`) |
  | `sortOrder` / `order` | String | No | `desc` | Sort direction (`asc`, `desc`) |

- **Response (200 OK)**:
  Paginated wrapper object containing an array of formatted `GroupOrder` items with populated `userId` (excluding password):
  ```json
  {
    "data": [
      {
        "_id": "669fc999888777abcdef999",
        "groupOrderId": "669fc999888777abcdef999",
        "orderGroupId": "669fc999888777abcdef999",
        "userId": {
          "_id": "669fc1234567890abcdef123",
          "firstName": "John",
          "lastName": "Doe",
          "email": "johndoe@example.com",
          "phone": "+1234567890",
          "role": "customer"
        },
        "fullName": "John Doe",
        "phoneNumber": "+1234567890",
        "emailAddress": "johndoe@example.com",
        "deliveryMethod": "Home Delivery",
        "deliveryAddress": {
          "street": "12 Nile St",
          "city": "Cairo",
          "country": "Egypt"
        },
        "paymentMethod": "Cash on Delivery",
        "specialNotes": "Ring the bell twice",
        "overallStatus": "Pending",
        "items": [
          {
            "offerId": "669fc0000000000abcdef777",
            "productId": "669fc3333333333abcdef444",
            "productTitle": "Margherita Pizza",
            "productImage": "https://res.cloudinary.com/...",
            "restaurantId": "669fc8888888888abcdef222",
            "restaurantName": "Pizza Gourmet Express",
            "originalPrice": 12.99,
            "offerPrice": 10.39,
            "discountPercentage": 20,
            "quantity": 2,
            "purchasedAt": "2026-07-23T20:00:00.000Z",
            "lineTotal": 20.78
          }
        ],
        "totalOriginalPrice": 25.98,
        "totalDiscount": 5.20,
        "finalTotalPrice": 20.78,
        "totalQuantity": 2,
        "createdAt": "2026-07-23T20:00:00.000Z",
        "updatedAt": "2026-07-23T20:00:00.000Z"
      }
    ],
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1,
    "pageSize": 10,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
  ```

---

### 9.5 Get Restaurant Orders (Admin / Manager)

- **Method / URL**: `GET /orders/restaurant/:restaurantId`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Returns sub-orders for a specific restaurant. Managers can ONLY view orders for their own assigned restaurant (`restaurantId` must match `user.restaurantId`).
- **Query Parameters**: Same filtering and pagination parameters as `QueryOrderListingDto` above.

---

### 9.6 Update Sub-Order Status (Admin / Manager)

- **Method / URL**: `PATCH /orders/:id/status`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Security Check**: Managers can only update status of orders belonging to their own restaurant.
- **Request Body (`application/json`)**:
  ```json
  {
    "status": "Preparing"
  }
  ```
  _Allowed Statuses: `"Pending"`, `"Confirmed"`, `"Preparing"`, `"Ready"`, `"Out For Delivery"`, `"Delivered"`, `"Cancelled"`_

- **Automated Side Effects**:
  - `Delivered`: Idempotently creates `SalesTransaction` records for each order line item (`source: marketplace_order`).
  - `Cancelled`: Restores offer remaining quantity and reactivates offer if previously `sold_out`.

---

### 9.7 Get Order Group by ID (`/order-groups`)

- **Method / URL**: `GET /order-groups/:id`
- **Auth Level**: Access Token (`admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Fetches aggregated order group entity by ID for admin inspection.

---

## 10. Restaurant Module (`/restaurants`)

### 10.1 Create Restaurant

- **Method / URL**: `POST /restaurants`
- **Auth Level**: Access Token (`admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  ```json
  {
    "name": "Pizza Gourmet",
    "ownerUserId": "669fc5555555555abcdef111",
    "description": "Authentic Italian Pizza",
    "phone": "+1555444333",
    "address": {
      "street": "100 Broadway",
      "city": "New York",
      "country": "USA"
    }
  }
  ```

---

### 10.2 Get All Restaurants (Paginated & Filtered)

- **Method / URL**: `GET /restaurants`
- **Auth Level**: Access Token (`admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `page` | Number / String | `1` | Page index |
  | `limit` | Number / String | `10` | Items per page |
  | `search` | String | *None* | Search in restaurant name |
  | `status` | String | *None* | Status string filter |
  | `ownerUserId` | String | *None* | Filter by Manager User ObjectId |
  | `isActive` | Boolean String | *None* | Filter active status (`true`, `false`) |
  | `isDeleted` | Boolean String | `false` | Filter soft-deleted status (`true`, `false`) |
  | `sort` | String | `createdAt` | Sort field |
  | `order` | String | `desc` | Sort order (`asc`, `desc`) |

- **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "_id": "669fc8888888888abcdef222",
        "name": "Pizza Gourmet",
        "ownerUserId": {
          "_id": "669fc5555555555abcdef111",
          "firstName": "Manager",
          "lastName": "Owner"
        },
        "isActive": true
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
  ```

---

### 10.3 Get Manager's Own Restaurant (`me`)

- **Method / URL**: `GET /restaurants/me`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`

---

### 10.4 Get Restaurant by ID

- **Method / URL**: `GET /restaurants/:id`
- **Auth Level**: Access Token (`admin`)
- **Headers**: `Authorization: Bearer <accessToken>`

---

### 10.5 Update Restaurant

- **Method / URL**: `PATCH /restaurants/:id`
- **Auth Level**: Access Token (`admin`, `manager` - own restaurant only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: `name`, `description`, `phone`, `address`, `isActive`.

---

### 10.6 Soft Delete Restaurant

- **Method / URL**: `DELETE /restaurants/:id`
- **Auth Level**: Access Token (`admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Business Behavior**:
  - Soft-deletes restaurant (`isDeleted: true`, `deletedAt: Date`).
  - Clears `ownerUserId` on restaurant.
  - Clears `restaurantId` on assigned manager user.
  - Soft-deletes all promotional offers belonging to this restaurant.

---

## 11. Offers Module (`/offers`)

### 11.1 Create Offer

- **Method / URL**: `POST /offers`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  ```json
  {
    "productId": "<product_object_id>",
    "discountPercentage": 20,
    "availableQuantity": 50,
    "maxPerCustomer": 3,
    "startDate": "2026-07-20",
    "endDate": "2026-07-30",
    "featured": true,
    "status": "active"
  }
  ```
  _Note: `availableQuantity` is required ($\ge 1$). `remainingQuantity` is managed automatically by the backend. Optional `status` enum (`draft`, `scheduled`, `active`, `expired`, `sold_out`, `cancelled`)._

---

### 11.2 Get Active Offers (Public Customer Store)

Returns currently active promotional offers (`status = active` and `endDate >= now`).

- **Method / URL**: `GET /offers/active`
- **Auth Level**: Public
- **Query Parameters**:
  - `restaurantId` (string)
  - `categoryId` (string)
  - `productId` (string)
  - `source` (enum: `manual`, `recommendation`)
  - `search` (string, searches product title/description)
  - `featured` (boolean)
  - `minPrice` (number)
  - `maxPrice` (number)
  - `startDate` (date string)
  - `endDate` (date string)
  - `sortBy` (`createdAt`, `offerPrice`, `discountPercentage`, `startDate`, `endDate`)
  - `sortOrder` (`asc`, `desc`, Default: `desc`)
  - `page` (number, Default: `1`)
  - `limit` (number, Default: `10`)

---

### 11.3 Get Active Offer Details (Public)

- **Method / URL**: `GET /offers/active/:id`
- **Auth Level**: Public
- **Description**: Accepts Offer ObjectId, Product ObjectId, or Product Slug.

---

### 11.4 Get Offer Recommendations (Public Customer Store)

Returns active promotional offers sorted by backend recommendation scoring algorithm (`featured` desc, `discountPercentage` desc, `endDate` asc, `availableQuantity` desc, `createdAt` desc). Only returns active offers with `remainingQuantity > 0`.

- **Method / URL**: `GET /offers/recommendations`
- **Auth Level**: Public
- **Query Parameters**:

  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `restaurantId` | String | No | *None* | Filter by Restaurant ObjectId |
  | `categoryId` | String | No | *None* | Filter by Category ObjectId |
  | `search` | String | No | *None* | Search in product title/description |
  | `minPrice` | Number | No | *None* | Minimum offer price |
  | `maxPrice` | Number | No | *None* | Maximum offer price |
  | `page` | String | No | `1` | Page index |
  | `limit` | String | No | `10` | Items count per page |

- **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "_id": "64b102996f6d5c001cfef2ff",
        "originalPrice": 25,
        "offerPrice": 20,
        "discountPercentage": 20,
        "availableQuantity": 50,
        "remainingQuantity": 45,
        "maxPerCustomer": 3,
        "startDate": "2026-07-20T00:00:00.000Z",
        "endDate": "2026-07-30T23:59:59.999Z",
        "status": "active",
        "source": "manual",
        "featured": true,
        "productId": {
          "_id": "64b100996f6d5c001cfef2ea",
          "title": "Fresh Organic Spinach",
          "description": "Rich in iron, fresh green spinach leaves.",
          "price": 25,
          "image": {
            "public_id": "restomind/products/spinach",
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v1/spinach.jpg"
          },
          "category": {
            "_id": "64b0feaa6f6d5c001cfef2d0",
            "name": "Organic Vegetables"
          },
          "slug": "fresh-organic-spinach",
          "isAvailable": true
        },
        "restaurantId": {
          "_id": "64b0fd116f6d5c001cfef2c2",
          "name": "Green Garden Bistro",
          "description": "Farm to table restaurant",
          "phone": "+1234567890",
          "address": {
            "street": "123 Main St",
            "city": "Cairo",
            "country": "Egypt"
          }
        }
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
  ```

---

### 11.5 Get Restaurant Offers (Manager)

- **Method / URL**: `GET /offers`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `status` | String | *None* | Offer status (`draft`, `scheduled`, `active`, `expired`, `cancelled`, `sold_out`) |
  | `productId` | String | *None* | Filter by Product ObjectId |
  | `categoryId` | String | *None* | Filter by Category ObjectId |
  | `restaurantId` | String | *None* | Filter by Restaurant ObjectId |
  | `source` | String | *None* | Offer origin (`manual`, `ai_recommendation`) |
  | `featured` | Boolean String | *None* | Filter featured status (`true`, `false`) |
  | `search` | String | *None* | Search in product title/description |
  | `minPrice` | Number | *None* | Minimum offer price |
  | `maxPrice` | Number | *None* | Maximum offer price |
  | `startDate` | Date String | *None* | Filter by start date |
  | `endDate` | Date String | *None* | Filter by end date |
  | `sortBy` | String | `createdAt` | Field to sort by |
  | `sortOrder` | String | `desc` | Sort direction (`asc`, `desc`) |
  | `page` | String | `1` | Page number |
  | `limit` | String | `10` | Items per page |

---

### 11.6 Get Offer Details by ID or Slug (Manager)

- **Method / URL**: `GET /offers/:id`
- **Auth Level**: Access Token (`manager`)
- **Description**: Accepts Offer ObjectId, Product ObjectId, or Product Slug.

---

### 11.7 Update Offer (Manager)

Allows updating `discountPercentage`, `startDate`, `endDate`, `featured`, or `productId` for `draft` or `scheduled` offers.

- **Method / URL**: `PATCH /offers/:id`
- **Auth Level**: Access Token (`manager`)

---

### 11.8 Cancel Offer (Manager)

- **Method / URL**: `PATCH /offers/:id/cancel`
- **Auth Level**: Access Token (`manager`)

---

## 12. Ingredients Module (`/ingredients`)

The Ingredients module allows restaurant managers to manage raw material inventory for recipe portions.

### 12.1 Create Ingredient

- **Method / URL**: `POST /ingredients`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  ```json
  {
    "name": "Mozzarella Cheese",
    "quantity": 5000,
    "unit": "grams",
    "minStockAlert": 1000
  }
  ```

---

### 12.2 Get All Ingredients (Paginated & Filtered)

- **Method / URL**: `GET /ingredients`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**: `page` (Default: `1`), `limit` (Default: `10`), `search` (matches ingredient `name`), `minQuantity`, `maxQuantity`, `unit`, `sortBy`, `sortOrder`, `isDeleted`.

---

### 12.3 Get Ingredient by ID

- **Method / URL**: `GET /ingredients/:id`
- **Auth Level**: Access Token (`manager`)

---

### 12.4 Update Ingredient

- **Method / URL**: `PATCH /ingredients/:id`
- **Auth Level**: Access Token (`manager`)
- **Request Body (`application/json`)**: Accepts optional `name`, `quantity`, `unit`, `minStockAlert`.

---

### 12.5 Delete Ingredient (Soft Delete)

- **Method / URL**: `DELETE /ingredients/:id`
- **Auth Level**: Access Token (`manager`)
- **Description**: Soft deletes ingredient. Returns `400 Bad Request` if ingredient is used in an active product recipe.

---

## 13. Dashboard Module (`/dashboard`)

The Dashboard module provides analytics, KPI aggregations, revenue trends, order status distributions, ranked top products/categories/restaurants, fulfillment method distributions, and operational alerts for both System Administrators and Restaurant Managers.

### 13.1 Get Admin Dashboard Analytics

Retrieves high-level platform-wide analytics, metrics, rankings, and operational alerts for system administrators.

- **Method / URL**: `GET /dashboard/admin`
- **Auth Level**: Access Token (`admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `startDate` | ISO Date String | No | *7 days ago* | Start of date range (e.g. `2026-07-17` or `2026-07-17T00:00:00.000Z`) |
  | `endDate` | ISO Date String | No | *Now / Today* | End of date range (e.g. `2026-07-23` or `2026-07-23T23:59:59.999Z`) |

- **Behavior & Metrics**:
  - **Default Range**: If omitted, defaults to the last 7 days.
  - **KPI Comparison**: Calculates `previous` period metrics using an equal-length duration preceding `startDate`.
  - **KPI Breakdown**:
    - `revenue`: Total revenue from orders with `status = 'Delivered'` (`current`, `previous`, `changePercent`).
    - `orders`: Total count of orders placed within the date range (`current`, `previous`, `changePercent`).
    - `activeOffers`: Total non-deleted active promotional offers across active restaurants.
    - `pendingOrders`: Current count of orders with `status = 'Pending'`.
    - `activeRestaurants`: Total count of active, non-deleted restaurants on the platform.
    - `netProfit`: Total net revenue after tax and operational fee deductions.
    - `taxDeduction`: Calculated tax amount deducted across delivered orders.
    - `avgOrderValue`: Average transaction value per completed order (`total revenue / delivered orders count`).
    - `totalUsers`: Platform-wide count of non-deleted user accounts.
    - `totalRestaurants`: Total count of non-deleted restaurants registered.
  - **Ranked Items & Distributions**:
    - `topProducts`: Top performing products ranked by quantity sold (`[{ id, rank, name, count, maxCount }]`).
    - `topCategories`: Top performing categories ranked by volume sold (`[{ id, rank, name, count, maxCount }]`).
    - `topRestaurants`: Top performing restaurants ranked by order volume (`[{ id, rank, name, count, maxCount }]`).
    - `fulfillmentMethods`: Distribution of orders by delivery method (`Home Delivery`, `Store Pickup`).

- **Response (200 OK)**:
  ```json
  {
    "kpis": {
      "revenue": {
        "current": 436.38,
        "previous": 350.00,
        "changePercent": 24.68
      },
      "orders": {
        "current": 15,
        "previous": 12,
        "changePercent": 25.00
      },
      "activeOffers": 8,
      "pendingOrders": 2,
      "activeRestaurants": 5,
      "netProfit": 375.29,
      "taxDeduction": 61.09,
      "avgOrderValue": 29.09,
      "totalUsers": 120,
      "totalRestaurants": 6
    },
    "topProducts": [
      {
        "id": "669fc3333333333abcdef444",
        "rank": 1,
        "name": "Margherita Pizza",
        "count": 42,
        "maxCount": 42
      }
    ],
    "topCategories": [
      {
        "id": "669fc4444444444abcdef333",
        "rank": 1,
        "name": "Pizza",
        "count": 65,
        "maxCount": 65
      }
    ],
    "topRestaurants": [
      {
        "id": "669fc8888888888abcdef222",
        "rank": 1,
        "name": "Pizza Gourmet Express",
        "count": 28,
        "maxCount": 28
      }
    ],
    "fulfillmentMethods": [
      {
        "id": "home_delivery",
        "type": "Home Delivery",
        "name": "Home Delivery",
        "count": 12,
        "percentage": 80
      },
      {
        "id": "store_pickup",
        "type": "Store Pickup",
        "name": "Store Pickup",
        "count": 3,
        "percentage": 20
      }
    ]
  }
  ```

---

### 13.2 Get Restaurant Manager Dashboard Analytics

Retrieves analytics, metrics, ranked top products/categories, fulfillment distribution, and operational alerts specifically scoped to the authenticated manager's assigned restaurant.

- **Method / URL**: `GET /dashboard/manager`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `startDate` | ISO Date String | No | *7 days ago* | Start of date range (e.g. `2026-07-17` or `2026-07-17T00:00:00.000Z`) |
  | `endDate` | ISO Date String | No | *Now / Today* | End of date range (e.g. `2026-07-23` or `2026-07-23T23:59:59.999Z`) |

- **Behavior & Constraints**:
  - **Manager Scoping**: Scoped strictly to `user.restaurantId`. Throws `400 Bad Request` if no restaurant is assigned to the manager.
  - **Exclusions**: System-wide metrics (`activeRestaurants`, `totalUsers`, `totalRestaurants`, `topRestaurants`) are completely excluded.
  - **Restaurant Info**: Includes `restaurantName` in top-level response payload.

- **Response (200 OK)**:
  ```json
  {
    "restaurantName": "Pizza Gourmet Express",
    "kpis": {
      "revenue": {
        "current": 250.00,
        "previous": 200.00,
        "changePercent": 25.00
      },
      "orders": {
        "current": 8,
        "previous": 6,
        "changePercent": 33.33
      },
      "activeOffers": 3,
      "pendingOrders": 1,
      "netProfit": 215.00,
      "taxDeduction": 35.00,
      "avgOrderValue": 31.25
    },
    "topProducts": [
      {
        "id": "669fc3333333333abcdef444",
        "rank": 1,
        "name": "Margherita Pizza",
        "count": 20,
        "maxCount": 20
      }
    ],
    "topCategories": [
      {
        "id": "669fc4444444444abcdef333",
        "rank": 1,
        "name": "Pizza",
        "count": 30,
        "maxCount": 30
      }
    ],
    "fulfillmentMethods": [
      {
        "id": "home_delivery",
        "type": "Home Delivery",
        "name": "Home Delivery",
        "count": 6,
        "percentage": 75
      },
      {
        "id": "store_pickup",
        "type": "Store Pickup",
        "name": "Store Pickup",
        "count": 2,
        "percentage": 25
      }
    ]
  }
  ```

---

## 14. Sales Module (`/sales`)

The Sales Module provides granular sales transaction tracking, historical sales listing, source-based revenue audit trails, and aggregate financial sales statistics for System Administrators and Restaurant Managers.

### 14.1 Get Sales Transactions (Paginated & Filtered)

- **Method / URL**: `GET /sales`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Security Check**: Managers are automatically scoped to their own assigned `restaurantId`. Admin can query across all restaurants or filter by a specific `restaurantId`.
- **Query Parameters**:

  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `restaurantId` | String | No | *None* | Filter by Restaurant ObjectId (Admin only; Managers locked to assigned restaurant) |
  | `productId` | String | No | *None* | Filter by Product ObjectId |
  | `startDate` | ISO Date String | No | *None* | Start date filter (`date >= startDate 00:00:00.000Z`) |
  | `endDate` | ISO Date String | No | *None* | End date filter (`date <= endDate 23:59:59.999Z`) |
  | `source` | Enum String | No | *None* | Filter transaction source (`csv_import`, `marketplace_order`, `pos_sync`) |
  | `page` | Number | No | `1` | Page number |
  | `limit` | Number | No | `10` | Items per page |
  | `sort` | String | No | `date` | Field to sort by (`date`, `quantitySold`, `sellingPrice`) |
  | `order` | String | No | `desc` | Sort direction (`asc`, `desc`) |

- **Response (200 OK)**:
  ```json
  {
    "data": {
      "items": [
        {
          "_id": "669fd1111111111abcdef000",
          "restaurantId": {
            "_id": "669fc8888888888abcdef222",
            "name": "Pizza Gourmet Express"
          },
          "productId": {
            "_id": "669fc3333333333abcdef444",
            "title": "Margherita Pizza",
            "price": 12.99,
            "discountedPrice": 10.39
          },
          "date": "2026-07-23T20:00:00.000Z",
          "quantitySold": 2,
          "basePrice": 12.99,
          "sellingPrice": 10.39,
          "promotionActive": true,
          "featured": true,
          "salesChannel": "marketplace",
          "source": "marketplace_order",
          "orderId": "669fc999888777abcdef999"
        }
      ],
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

---

### 14.2 Get Sales Summary Statistics

- **Method / URL**: `GET /sales/summary`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Security Check**: Managers are automatically scoped to their own assigned `restaurantId`.
- **Query Parameters**: Same filtering parameters (`restaurantId`, `productId`, `startDate`, `endDate`, `source`).
- **Response (200 OK)**:
  ```json
  {
    "data": {
      "totalTransactions": 15,
      "totalQuantitySold": 42,
      "totalGrossRevenue": 545.58,
      "totalNetRevenue": 436.38,
      "totalDiscountsGiven": 109.20,
      "promotionalSalesCount": 42,
      "featuredSalesCount": 42,
      "averageSellingPrice": 10.39
    }
  }
  ```

---

## 15. End-to-End Shopping, Order, Sales & Analytics Workflow

1. **Create Restaurant** (Admin): `POST /restaurants`
2. **Create Ingredients & Recipe** (Manager):
   - Add raw material ingredients via `POST /ingredients`.
   - Map ingredients to product recipes via `PUT /products/:productId/recipe`.
3. **Create Category & Product** (Admin / Manager):
   - `POST /categories`, `POST /products`.
4. **Create Promotional Offers** (Manager):
   - `POST /offers` with `availableQuantity` and discount percentage.
5. **Customer Browses Offers**:
   - `GET /offers/active` or `GET /offers/recommendations` with search, filtering, and sorting parameters.
6. **Add Offers to Cart / Favorites**:
   - `POST /cart` with `{ "offerId": "<offerId>", "quantity": N }`.
   - `POST /favorites/:offerId`.
7. **Checkout & Order Execution**:
   - `POST /orders` with delivery details and payment method.
   - Response returns unified `GroupOrder`.
8. **Order Processing & Fulfillment**:
   - Customer checks order status via `GET /orders/me`.
   - Manager processes restaurant orders via `GET /orders/restaurant/:restaurantId` and updates status via `PATCH /orders/:id/status`.
   - Admin manages all platform orders via `GET /orders`.
   - **Sales Transaction Generation**: Updating sub-order status to `Delivered` automatically and idempotently generates `SalesTransaction` entries (`source: marketplace_order`).
9. **Sales Audit & Financial Summary**:
   - Query detailed sales records via `GET /sales`.
   - Audit overall revenue, total discounts given, and net profit via `GET /sales/summary`.
10. **Dashboard Analytics & System Monitoring**:
    - Admin tracks overall platform revenue, net profit, user counts, top performing products/categories/restaurants, and system alerts via `GET /dashboard/admin`.
    - Manager tracks restaurant-specific revenue, top selling items, fulfillment method breakdown, and operational alerts via `GET /dashboard/manager`.
