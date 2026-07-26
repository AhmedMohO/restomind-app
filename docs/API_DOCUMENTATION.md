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
13. [Suppliers Module (`/suppliers`)](#13-suppliers-module-suppliers)
14. [Purchase Orders Module (`/purchase-orders`)](#14-purchase-orders-module-purchase-orders)
15. [Inventory & Waste Management Module (`/inventory`)](#15-inventory--waste-management-module-inventory)
16. [Daily Production Planning Module (`/predictions/production-plan`)](#16-daily-production-planning-module-predictionsproduction-plan)
17. [Data Ingestion & CSV Import Jobs Module (`/imports`)](#17-data-ingestion--csv-import-jobs-module-imports)
18. [Dashboard Module (`/dashboard`)](#18-dashboard-module-dashboard)
19. [Sales Module (`/sales`)](#19-sales-module-sales)
20. [End-to-End Shopping, Inventory, Production & Order Analytics Workflow](#20-end-to-end-shopping-inventory-production--order-analytics-workflow)

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
type IngredientUnit = 'kg' | 'liter' | 'piece';

interface Ingredient {
  _id: string;
  restaurantId: string;         // Restaurant ObjectId
  ingredientCode: string;       // Unique per restaurant e.g. "ING-FLOUR-01"
  name: string;
  unit: IngredientUnit;
  shelfLifeDays: number;        // Freshness window in days
  minimumStock: number;         // Minimum stock threshold (default 0)
  safetyStock: number;          // Safety stock buffer (default 0)
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
  slug?: string;                    // Unique offer slug identifier
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

There are two distinct order shapes returned by the API — they are **not**
interchangeable, and a listing/detail response is always exactly one of them:

- `GroupSubOrder`, nested inside `GroupOrder.orders[]` — one slim entry per
  restaurant in the group.
- `Order`, a standalone restaurant order returned by `GET /orders/:id`,
  `PATCH /orders/:id/status`, and the manager/staff branch of `GET /orders`.

```typescript
/** Line item inside a group's per-restaurant sub-order (GroupOrder.orders[].items). */
interface GroupOrderItem {
  productId: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  lineTotal: number;
  offerId?: string;
  discountPercentage?: number;
  productImage?: string;
}

/** A group's sub-order for one restaurant — nested inside GroupOrder.orders[]. */
interface GroupSubOrder {
  orderId: string;
  restaurant: { _id: string; name: string; logo?: string; image?: string };
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
  items: GroupOrderItem[];
  totalOriginalPrice: number;
  totalDiscount: number;
  finalTotalPrice: number;
  totalQuantity: number;
  createdAt: string;
}

interface DeliveryAddress {
  addressId?: string;
  street: string;
  city: string;
  country: string;
}

interface GroupOrder {
  _id: string;
  groupOrderId: string;         // same value as _id
  user: User | null;
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  deliveryMethod: 'Home Delivery' | 'Store Pickup';
  deliveryAddress: DeliveryAddress | null;
  specialNotes?: string;
  paymentMethod: 'Cash on Delivery';
  overallStatus: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out For Delivery' | 'Delivered' | 'Cancelled' | 'Partially Delivered' | 'Partially Cancelled' | 'Processing';
  totalOriginalPrice: number;
  totalDiscount: number;
  finalTotalPrice: number;
  totalQuantity: number;
  orders: GroupSubOrder[];       // one entry per restaurant in this group
  createdAt: string;
  updatedAt: string;
}

/** Line item inside a standalone restaurant order (different field names from GroupOrderItem). */
interface OrderItem {
  productId: string;
  productTitle: string;
  productImage?: string;
  offerId?: string;
  restaurantId: string;
  restaurantName: string;
  originalPrice: number;
  offerPrice: number;
  discountPercentage: number;
  quantity: number;
  lineTotal: number;            // quantity * offerPrice
  purchasedAt: string;           // ISO Date string
}

/**
 * A standalone restaurant order — GET /orders/:id, the response of
 * PATCH /orders/:id/status, and the manager/staff branch of GET /orders.
 * Distinct from GroupSubOrder above (different item shape, uses `_id` not `orderId`).
 */
interface Order {
  _id: string;
  groupOrderId?: string;
  user: User | null;
  restaurant: { _id: string; name: string; logo?: string; image?: string };
  items: OrderItem[];
  totalOriginalPrice: number;
  totalDiscount: number;
  finalTotalPrice: number;
  totalQuantity: number;
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  deliveryMethod: 'Home Delivery' | 'Store Pickup';
  deliveryAddress: DeliveryAddress | null;
  specialNotes?: string;
  paymentMethod: 'Cash on Delivery';
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
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

````typescript
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

### Supplier Schema

```typescript
interface Supplier {
  _id: string;                  // ObjectId
  restaurantId: string;         // Associated Restaurant ObjectId
  name: string;                 // Supplier business name
  email?: string;               // Optional email
  phone?: string;               // Optional phone
  leadTimeDays: number;         // Delivery lead time in days (default: 1)
  isDeleted: boolean;
  deletedAt?: string;           // ISO Date String
  createdAt: string;            // ISO Date String
  updatedAt: string;            // ISO Date String
}
````

### Purchase Order Schema

```typescript
type PurchaseOrderStatus = 'draft' | 'sent' | 'received' | 'cancelled';

interface PurchaseOrderItem {
  ingredientId: string | Ingredient;
  quantity: number;
  unit: IngredientUnit;
  unitCost: number;
}

interface PurchaseOrder {
  _id: string;                  // ObjectId
  restaurantId: string;         // Restaurant ObjectId
  supplierId: string | Supplier;// Supplier ObjectId or populated Supplier
  items: PurchaseOrderItem[];
  status: PurchaseOrderStatus;
  expectedDeliveryDate?: string;// ISO Date String
  createdBy: string;            // User ObjectId of creator
  isDeleted: boolean;
  deletedAt?: string;           // ISO Date String
  createdAt: string;            // ISO Date String
  updatedAt: string;            // ISO Date String
}
```

### Inventory Batch Schema

```typescript
interface InventoryBatch {
  _id: string;                  // ObjectId
  restaurantId: string;         // Restaurant ObjectId
  ingredientId: string | Ingredient; // Ingredient ObjectId or populated object
  batchNumber: string;          // Lot / Batch tracking number
  quantityRemaining: number;    // Remaining stock in batch
  unitCost: number;             // Cost per unit
  expiryDate: string;           // ISO Date String
  receivedDate: string;         // ISO Date String
  isDeleted: boolean;
  createdAt: string;            // ISO Date String
  updatedAt: string;            // ISO Date String
}
```

### Stock Transaction Schema

```typescript
type StockTransactionType =
  | 'purchase'
  | 'consumption'
  | 'waste'
  | 'adjustment'
  | 'transfer_in'
  | 'transfer_out'
  | 'return_to_supplier';

interface StockTransaction {
  _id: string;                  // ObjectId
  restaurantId: string;         // Restaurant ObjectId
  ingredientId: string | Ingredient;
  batchId?: string | InventoryBatch;
  transactionType: StockTransactionType;
  quantity: number;
  unit: IngredientUnit;
  date: string;                 // ISO Date String
  isDeleted: boolean;
  createdAt: string;            // ISO Date String
  updatedAt: string;            // ISO Date String
}
```

### Waste Event Schema

```typescript
type WasteReason =
  | 'expired'
  | 'overproduction'
  | 'preparation_loss'
  | 'spoiled'
  | 'customer_return'
  | 'damaged'
  | 'incorrect_order'
  | 'unknown';

interface WasteEvent {
  _id: string;                  // ObjectId
  restaurantId: string;         // Restaurant ObjectId
  ingredientId: string | Ingredient;
  batchId?: string | InventoryBatch;
  quantity: number;
  unit: IngredientUnit;
  wasteReason: WasteReason;
  estimatedCost: number;        // Financial loss value
  date: string;                 // ISO Date String
  isDeleted: boolean;
  createdAt: string;            // ISO Date String
  updatedAt: string;            // ISO Date String
}
```

### Daily Production Plan Schema

```typescript
type ConfidenceLevel = 'high' | 'medium' | 'low';
type ProductionPlanSource = 'ai_model' | 'fallback_yesterday';

interface ProductionPlanItem {
  productId: string | Product;  // Product ObjectId or populated Product
  recommendedQty: number;       // Recommended batch quantity
  lowerBound?: number;          // Lower prediction bound
  upperBound?: number;          // Upper prediction bound
  confidence: ConfidenceLevel;  // AI model confidence score
  source: ProductionPlanSource;
  factors?: any[];              // Exogenous features (e.g. weather, day-of-week)
  actualProducedQty?: number | null; // Actual recorded kitchen production
}

interface DailyProductionPlan {
  _id: string;                  // ObjectId
  restaurantId: string;         // Restaurant ObjectId
  date: string;                 // YYYY-MM-DD format
  totalRecommendedQty: number;  // Aggregated units planned
  items: ProductionPlanItem[];
  isDeleted: boolean;
  createdAt: string;            // ISO Date String
  updatedAt: string;            // ISO Date String
}
```

### Import Job Schema

```typescript
type ImportType =
  | 'sales_history'
  | 'inventory_transactions'
  | 'recipes'
  | 'menu_items'
  | 'ingredients';

type ImportJobStatus =
  | 'processing'
  | 'validated'
  | 'ai_ingest_pending'
  | 'ai_ingest_failed'
  | 'completed'
  | 'failed';

interface ImportErrorDetail {
  row: number;
  column?: string;
  message: string;
}

interface ImportJob {
  _id: string;                  // ObjectId
  restaurantId: string;         // Restaurant ObjectId
  uploadedBy: string;           // User ObjectId
  importType: ImportType;
  fileName: string;
  columnMapping?: Record<string, string>;
  rawRows?: string[][];
  status: ImportJobStatus;
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
  errors?: ImportErrorDetail[];
  aiIngestAttempts: number;
  aiIngestLastError?: string;
  isDeleted: boolean;
  createdAt: string;            // ISO Date String
  updatedAt: string;            // ISO Date String
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

  | Field   | Type   | Required | Rules                                 | Description      |
  | :------ | :----- | :------- | :------------------------------------ | :--------------- |
  | `email` | String | Yes      | Valid email                           | Target email     |
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

#### Add Delivery Address

- **Method / URL**: `POST /auth/addresses`
- **Auth Level**: Access Token (`admin`, `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field         | Type    | Required | Rules / Description                             |
  | :------------ | :------ | :------- | :---------------------------------------------- |
  | `label`       | String  | No       | Custom address title (e.g., `"Home"`, `"Work"`) |
  | `fullName`    | String  | Yes      | Recipient full name                             |
  | `phoneNumber` | String  | Yes      | Contact phone number                            |
  | `street`      | String  | Yes      | Street address                                  |
  | `city`        | String  | Yes      | City name                                       |
  | `country`     | String  | No       | Country name                                    |
  | `isDefault`   | Boolean | No       | Mark as default address (Default: `false`)      |

- **Response (201 Created)**: Updated array of saved address objects.

#### Get Saved Addresses

- **Method / URL**: `GET /auth/addresses`
- **Auth Level**: Access Token (`admin`, `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Array of `UserAddress` objects.

#### Update Saved Address

- **Method / URL**: `PATCH /auth/addresses/:addressId`
- **Auth Level**: Access Token (`admin`, `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: Optional fields from `Add Delivery Address`.

#### Delete Saved Address

- **Method / URL**: `DELETE /auth/addresses/:addressId`
- **Auth Level**: Access Token (`admin`, `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`

#### Set Default Address

- **Method / URL**: `PATCH /auth/addresses/:addressId/default`
- **Auth Level**: Access Token (`admin`, `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`

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

  | Parameter             | Type            | Default     | Description                                              |
  | :-------------------- | :-------------- | :---------- | :------------------------------------------------------- |
  | `page`                | Number / String | `1`         | Page number                                              |
  | `limit`               | Number / String | `10`        | Items per page                                           |
  | `search`              | String          | _None_      | Search in `firstName`, `lastName`, `email`, `phone`      |
  | `role`                | String          | _None_      | Filter by role (`customer`, `manager`, `admin`, `staff`) |
  | `restaurantId`        | String          | _None_      | Filter by Restaurant ObjectId                            |
  | `isDeleted`           | Boolean String  | _None_      | Filter soft-deleted status (`true`, `false`)             |
  | `sort` / `sortBy`     | String          | `createdAt` | Field to sort by                                         |
  | `order` / `sortOrder` | String          | `desc`      | Sort direction (`asc`, `desc`)                           |
  | `createdAt`           | ISO Date        | _None_      | Creation date filter                                     |
  | `updatedAt`           | ISO Date        | _None_      | Update date filter                                       |

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
  - _Conflict Check_: If the user is a manager currently assigned as owner of an active restaurant, returns **HTTP 409 Conflict** with error code `MANAGER_HAS_ACTIVE_RESTAURANT`.
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

  | Parameter   | Type            | Default    | Description                           |
  | :---------- | :-------------- | :--------- | :------------------------------------ |
  | `page`      | Number / String | _Optional_ | Page index                            |
  | `limit`     | Number / String | _Optional_ | Items count per page                  |
  | `search`    | String          | _None_     | Search in category name               |
  | `isDeleted` | Boolean String  | `false`    | Soft-deleted filter (`true`, `false`) |

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

### 6.5 Update Product Discount

- **Method / URL**: `PATCH /products/:id/discount`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: `{ "discountedPrice": number }`
- **Response (200 OK)**: Returns updated `Product` object.

---

### 6.6 Get All Products (Filtered & Paginated)

- **Method / URL**: `GET /products`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**: `page`, `limit`, `category`, `restaurantId`, `search`, `tag`, `sort`, `order`.
- **Note**: Public customer store product browsing and offer listings are conducted via the `/offers/active` and `/offers/recommendations` endpoints.

---

### 6.7 Get Product Details

- **Method / URL**: `GET /products/:id`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Accepts Mongo ObjectId or product slug string.

---

### 6.8 Upsert Product Recipe

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

### 6.9 Get Product Recipe

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
- **Behavior & Automatic Population**:
  - Customer contact details (`fullName`, `phoneNumber`, `emailAddress`) are **automatically injected** by the backend from the authenticated user's profile.
- **Request Body (`application/json`)**:

  | Field                       | Type    | Required    | Rules / Description                                                                                                            |
  | :-------------------------- | :------ | :---------- | :----------------------------------------------------------------------------------------------------------------------------- |
  | `deliveryMethod`            | String  | Yes         | Enum: `'Home Delivery'` or `'Store Pickup'`                                                                                    |
  | `deliveryAddress`           | Object  | Conditional | **Required when `deliveryMethod = 'Home Delivery'`. Must be omitted/null when `deliveryMethod = 'Store Pickup'`.**             |
  | `deliveryAddress.addressId` | String  | Optional    | MongoId of a saved address in user's collection. If provided, `street`, `city`, and `country` are resolved automatically.      |
  | `deliveryAddress.street`    | String  | Conditional | Required if `addressId` is not provided.                                                                                       |
  | `deliveryAddress.city`      | String  | Conditional | Required if `addressId` is not provided.                                                                                       |
  | `deliveryAddress.country`   | String  | Conditional | Required if `addressId` is not provided.                                                                                       |
  | `specialNotes`              | String  | No          | Optional instructions (e.g. `"Ring the bell twice"`)                                                                           |
  | `paymentMethod`             | String  | Yes         | Enum: `'Cash on Delivery'`                                                                                                     |
  | `saveAddress`               | Boolean | No          | Optional. If `true` and raw address details are submitted, automatically saves the address to the user's saved addresses list. |

  _Request Example A (Using Saved Address ID)_:

  ```json
  {
    "deliveryMethod": "Home Delivery",
    "deliveryAddress": {
      "addressId": "669fc7777777777abcdef123"
    },
    "specialNotes": "Ring the bell twice",
    "paymentMethod": "Cash on Delivery"
  }
  ```

  _Request Example B (Using New Raw Address & Save Address Flag)_:

  ```json
  {
    "deliveryMethod": "Home Delivery",
    "deliveryAddress": {
      "street": "12 Nile St",
      "city": "Cairo",
      "country": "Egypt"
    },
    "saveAddress": true,
    "specialNotes": "Leave at front desk",
    "paymentMethod": "Cash on Delivery"
  }
  ```

  _Request Example C (Store Pickup)_:

  ```json
  {
    "deliveryMethod": "Store Pickup",
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

  | Parameter      | Type            | Required | Default | Description                                                                                                              |
  | :------------- | :-------------- | :------- | :------ | :----------------------------------------------------------------------------------------------------------------------- |
  | `page`         | Number / String | No       | `1`     | Page index                                                                                                               |
  | `limit`        | Number / String | No       | `10`    | Items per page                                                                                                           |
  | `status`       | String          | No       | _None_  | Filter by `OrderStatusEnum` (`Pending`, `Confirmed`, `Preparing`, `Ready`, `Out For Delivery`, `Delivered`, `Cancelled`) |
  | `restaurantId` | String          | No       | _None_  | Filter by Restaurant ObjectId                                                                                            |

- **Response (200 OK)**:
  Paginated wrapper object containing an array of formatted `GroupOrder` objects:
  ```json
  {
    "data": [
      {
        "_id": "669fc999888777abcdef999",
        "groupOrderId": "669fc999888777abcdef999",
        "user": {
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
        "orders": [
          {
            "orderId": "669fc8888888888abcdef111",
            "restaurant": {
              "_id": "669fc8888888888abcdef222",
              "name": "Pizza Gourmet Express"
            },
            "status": "Pending",
            "items": [
              {
                "productId": "669fc3333333333abcdef444",
                "title": "Margherita Pizza",
                "price": 12.99,
                "discountedPrice": 10.39,
                "quantity": 2,
                "lineTotal": 20.78,
                "offerId": "669fc0000000000abcdef777",
                "discountPercentage": 20,
                "productImage": "https://res.cloudinary.com/..."
              }
            ],
            "totalOriginalPrice": 25.98,
            "totalDiscount": 5.2,
            "finalTotalPrice": 20.78,
            "totalQuantity": 2,
            "createdAt": "2026-07-23T20:00:00.000Z"
          }
        ],
        "totalOriginalPrice": 25.98,
        "totalDiscount": 5.2,
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

  | Parameter             | Type     | Required | Default     | Description                                                                                                              |
  | :-------------------- | :------- | :------- | :---------- | :----------------------------------------------------------------------------------------------------------------------- |
  | `page`                | Number   | No       | `1`         | Page index                                                                                                               |
  | `limit`               | Number   | No       | `10`        | Items per page                                                                                                           |
  | `search`              | String   | No       | _None_      | Search in `fullName`, `emailAddress`, `phoneNumber`, `groupOrderId`, or `_id`                                            |
  | `status`              | String   | No       | _None_      | Filter by `OrderStatusEnum` (`Pending`, `Confirmed`, `Preparing`, `Ready`, `Out For Delivery`, `Delivered`, `Cancelled`) |
  | `paymentMethod`       | String   | No       | _None_      | Filter by payment method (`Cash on Delivery`)                                                                            |
  | `deliveryMethod`      | String   | No       | _None_      | Filter by delivery method (`Home Delivery`, `Store Pickup`)                                                              |
  | `startDate`           | ISO Date | No       | _None_      | Start creation date filter (`createdAt >= startDate 00:00:00.000Z`)                                                      |
  | `endDate`             | ISO Date | No       | _None_      | End creation date filter (`createdAt <= endDate 23:59:59.999Z`)                                                          |
  | `minTotalPrice`       | Number   | No       | _None_      | Filter minimum final total price                                                                                         |
  | `maxTotalPrice`       | Number   | No       | _None_      | Filter maximum final total price                                                                                         |
  | `restaurantId`        | String   | No       | _None_      | Filter by Restaurant ObjectId                                                                                            |
  | `sortBy` / `sort`     | String   | No       | `createdAt` | Field to sort by (`createdAt`, `updatedAt`, `finalTotalPrice`, `totalQuantity`, `overallStatus`)                         |
  | `sortOrder` / `order` | String   | No       | `desc`      | Sort direction (`asc`, `desc`)                                                                                           |

- **Response (200 OK)**:
  Paginated wrapper object containing an array of formatted `GroupOrder` items with populated `user` (excluding password):
  ```json
  {
    "data": [
      {
        "_id": "669fc999888777abcdef999",
        "groupOrderId": "669fc999888777abcdef999",
        "user": {
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
        "orders": [
          {
            "orderId": "669fc8888888888abcdef111",
            "restaurant": {
              "_id": "669fc8888888888abcdef222",
              "name": "Pizza Gourmet Express"
            },
            "status": "Pending",
            "items": [
              {
                "productId": "669fc3333333333abcdef444",
                "title": "Margherita Pizza",
                "price": 12.99,
                "discountedPrice": 10.39,
                "quantity": 2,
                "lineTotal": 20.78,
                "offerId": "669fc0000000000abcdef777",
                "discountPercentage": 20,
                "productImage": "https://res.cloudinary.com/..."
              }
            ],
            "totalOriginalPrice": 25.98,
            "totalDiscount": 5.2,
            "finalTotalPrice": 20.78,
            "totalQuantity": 2,
            "createdAt": "2026-07-23T20:00:00.000Z"
          }
        ],
        "totalOriginalPrice": 25.98,
        "totalDiscount": 5.2,
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

### 9.6 Update Order Status (Admin / Manager)

- **Method / URL**:
  - `PATCH /orders/:id/status` (Update by order/group ID parameter, with optional `?groupOrderId=...` query)
  - `PATCH /orders/status?groupOrderId=...` (Update by `groupOrderId` query parameter)
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

### 9.8 Cancel Order Group

- **Method / URL**: `PATCH /orders/group/:id/cancel`
- **Auth Level**: Access Token (`customer`, `admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Cancels an entire group order. Updates overall status to `Cancelled` and automatically restores remaining offer quantities.
- **Response (200 OK)**:
  ```json
  {
    "data": {
      "_id": "669fc999888777abcdef999",
      "overallStatus": "Cancelled"
    }
  }
  ```

---

### 9.9 Get Dashboard Orders Summary

- **Method / URL**: `GET /orders/summary`
- **Auth Level**: Access Token (`admin`, `manager`, `staff`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**: Accepts the same filter query parameters as `GET /orders` (`search`, `status`, `paymentMethod`, `deliveryMethod`, `startDate`, `endDate`, `restaurantId`, `sortBy`, `sortOrder`).
- **Description**: Calculates completion counters (`total` matching active filters, `done` reaching terminal `Delivered` status) for dashboard header summary counters.
- **Response (200 OK)**:
  ```json
  {
    "data": {
      "total": 15,
      "done": 12
    }
  }
  ```

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

  | Parameter     | Type            | Default     | Description                                  |
  | :------------ | :-------------- | :---------- | :------------------------------------------- |
  | `page`        | Number / String | `1`         | Page index                                   |
  | `limit`       | Number / String | `10`        | Items per page                               |
  | `search`      | String          | _None_      | Search in restaurant name                    |
  | `status`      | String          | _None_      | Status string filter                         |
  | `ownerUserId` | String          | _None_      | Filter by Manager User ObjectId              |
  | `isActive`    | Boolean String  | _None_      | Filter active status (`true`, `false`)       |
  | `isDeleted`   | Boolean String  | `false`     | Filter soft-deleted status (`true`, `false`) |
  | `sort`        | String          | `createdAt` | Sort field                                   |
  | `order`       | String          | `desc`      | Sort order (`asc`, `desc`)                   |

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

  | Parameter      | Type   | Required | Default | Description                         |
  | :------------- | :----- | :------- | :------ | :---------------------------------- |
  | `restaurantId` | String | No       | _None_  | Filter by Restaurant ObjectId       |
  | `categoryId`   | String | No       | _None_  | Filter by Category ObjectId         |
  | `search`       | String | No       | _None_  | Search in product title/description |
  | `minPrice`     | Number | No       | _None_  | Minimum offer price                 |
  | `maxPrice`     | Number | No       | _None_  | Maximum offer price                 |
  | `page`         | String | No       | `1`     | Page index                          |
  | `limit`        | String | No       | `10`    | Items count per page                |

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

  | Parameter      | Type           | Default     | Description                                                                       |
  | :------------- | :------------- | :---------- | :-------------------------------------------------------------------------------- |
  | `status`       | String         | _None_      | Offer status (`draft`, `scheduled`, `active`, `expired`, `cancelled`, `sold_out`) |
  | `productId`    | String         | _None_      | Filter by Product ObjectId                                                        |
  | `categoryId`   | String         | _None_      | Filter by Category ObjectId                                                       |
  | `restaurantId` | String         | _None_      | Filter by Restaurant ObjectId                                                     |
  | `source`       | String         | _None_      | Offer origin (`manual`, `ai_recommendation`)                                      |
  | `featured`     | Boolean String | _None_      | Filter featured status (`true`, `false`)                                          |
  | `search`       | String         | _None_      | Search in product title/description                                               |
  | `minPrice`     | Number         | _None_      | Minimum offer price                                                               |
  | `maxPrice`     | Number         | _None_      | Maximum offer price                                                               |
  | `startDate`    | Date String    | _None_      | Filter by start date                                                              |
  | `endDate`      | Date String    | _None_      | Filter by end date                                                                |
  | `sortBy`       | String         | `createdAt` | Field to sort by                                                                  |
  | `sortOrder`    | String         | `desc`      | Sort direction (`asc`, `desc`)                                                    |
  | `page`         | String         | `1`         | Page number                                                                       |
  | `limit`        | String         | `10`        | Items per page                                                                    |

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

  | Field            | Type   | Required | Description                                                  |
  | :--------------- | :----- | :------- | :----------------------------------------------------------- |
  | `ingredientCode` | String | Yes      | Unique ingredient code per restaurant (e.g. `"ING-MOZZ-01"`) |
  | `name`           | String | Yes      | Ingredient display name (e.g. `"Mozzarella Cheese"`)         |
  | `unit`           | String | Yes      | Enum: `'kg'`, `'liter'`, `'piece'`                           |
  | `shelfLifeDays`  | Number | Yes      | Shelf life in days ($\ge 0$)                                 |
  | `minimumStock`   | Number | No       | Minimum stock threshold ($\ge 0$, Default: `0`)              |
  | `safetyStock`    | Number | No       | Safety stock buffer ($\ge 0$, Default: `0`)                  |

  _Request Example_:

  ```json
  {
    "ingredientCode": "ING-MOZZ-01",
    "name": "Mozzarella Cheese",
    "unit": "grams",
    "shelfLifeDays": 14,
    "minimumStock": 1000,
    "safetyStock": 500
  }
  ```

---

### 12.2 Get All Ingredients (Paginated & Filtered)

- **Method / URL**: `GET /ingredients`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:
  - `page` (Optional string/number)
  - `limit` (Optional string/number)
  - `search` (Optional string, searches ingredient `name`)

---

### 12.3 Get Ingredient by ID

- **Method / URL**: `GET /ingredients/:id`
- **Auth Level**: Access Token (`manager`)

---

### 12.4 Update Ingredient

- **Method / URL**: `PATCH /ingredients/:id`
- **Auth Level**: Access Token (`manager`)
- **Request Body (`application/json`)**: Accepts optional fields from `Create Ingredient` (`ingredientCode`, `name`, `unit`, `shelfLifeDays`, `minimumStock`, `safetyStock`).

---

### 12.5 Delete Ingredient (Soft Delete)

- **Method / URL**: `DELETE /ingredients/:id`
- **Auth Level**: Access Token (`manager`)
- **Description**: Soft deletes ingredient. Returns `400 Bad Request` if ingredient is used in an active product recipe.

---

## 13. Suppliers Module (`/suppliers`)

The Suppliers module enables restaurant managers to register vendor suppliers, track contact details, and record vendor lead times for automated inventory procurement.

### 13.1 Create Supplier

- **Method / URL**: `POST /suppliers`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field          | Type   | Required | Rules / Description                                |
  | :------------- | :----- | :------- | :------------------------------------------------- |
  | `name`         | String | Yes      | Supplier business name                             |
  | `email`        | String | No       | Valid email address                                |
  | `phone`        | String | No       | Contact phone number                               |
  | `leadTimeDays` | Number | No       | Delivery lead time in days ($\ge 0$, Default: `1`) |

  _Request Example_:

  ```json
  {
    "name": "Fresh Farms Co.",
    "email": "orders@freshfarms.com",
    "phone": "+1234567890",
    "leadTimeDays": 2
  }
  ```

- **Response (201 Created)**: Created `Supplier` entity object.

---

### 13.2 Get Suppliers (Paginated & Searchable)

- **Method / URL**: `GET /suppliers`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter | Type            | Default | Description                                 |
  | :-------- | :-------------- | :------ | :------------------------------------------ |
  | `page`    | Number / String | `1`     | Page number                                 |
  | `limit`   | Number / String | `10`    | Items per page                              |
  | `search`  | String          | _None_  | Search in supplier `name`, `email`, `phone` |

- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "_id": "669fc7777777777abcdef111",
        "restaurantId": "669fc8888888888abcdef222",
        "name": "Fresh Farms Co.",
        "email": "orders@freshfarms.com",
        "phone": "+1234567890",
        "leadTimeDays": 2,
        "isDeleted": false,
        "createdAt": "2026-07-26T10:00:00.000Z",
        "updatedAt": "2026-07-26T10:00:00.000Z"
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

## 14. Purchase Orders Module (`/purchase-orders`)

The Purchase Orders module manages stock procurement workflows, allowing restaurant managers to draft, issue, and receive inventory orders from registered suppliers.

### 14.1 Create Purchase Order

- **Method / URL**: `POST /purchase-orders`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field                  | Type   | Required | Rules / Description                                                         |
  | :--------------------- | :----- | :------- | :-------------------------------------------------------------------------- |
  | `supplierId`           | String | Yes      | Valid MongoId of registered supplier                                        |
  | `items`                | Array  | Yes      | Non-empty array of items to order (min length: 1)                           |
  | `items[].ingredientId` | String | Yes      | Valid MongoId of raw material ingredient                                    |
  | `items[].quantity`     | Number | Yes      | Quantity to order (> 0)                                                     |
  | `items[].unit`         | String | Yes      | Enum: `'kg'`, `'liter'`, `'piece'`                                          |
  | `items[].unitCost`     | Number | Yes      | Cost per unit ($\ge 0$)                                                     |
  | `status`               | String | No       | Enum: `'draft'`, `'sent'`, `'received'`, `'cancelled'` (Default: `'draft'`) |
  | `expectedDeliveryDate` | String | No       | ISO Date string                                                             |

  _Request Example_:

  ```json
  {
    "supplierId": "669fc7777777777abcdef111",
    "items": [
      {
        "ingredientId": "669fc3333333333abcdef123",
        "quantity": 50,
        "unit": "kg",
        "unitCost": 4.5
      }
    ],
    "status": "sent",
    "expectedDeliveryDate": "2026-07-28T00:00:00.000Z"
  }
  ```

- **Response (201 Created)**: Created `PurchaseOrder` object.

---

### 14.2 Get Purchase Orders (Paginated & Filtered)

- **Method / URL**: `GET /purchase-orders`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter    | Type            | Default | Description                                                 |
  | :----------- | :-------------- | :------ | :---------------------------------------------------------- |
  | `page`       | Number / String | `1`     | Page index                                                  |
  | `limit`      | Number / String | `10`    | Items per page                                              |
  | `status`     | String          | _None_  | Filter by status (`draft`, `sent`, `received`, `cancelled`) |
  | `supplierId` | String          | _None_  | Filter by Supplier ObjectId                                 |

---

### 14.3 Receive Purchase Order

- **Method / URL**: `PATCH /purchase-orders/:id/receive`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Business Behavior**:
  - Updates purchase order status to `received`.
  - Automatically creates new `InventoryBatch` records for each item in the purchase order.
  - Generates stock transaction logs (`transactionType: 'purchase'`).
- **Response (200 OK)**: Updated `PurchaseOrder` entity.

---

## 15. Inventory & Waste Management Module (`/inventory`)

The Inventory & Waste Management module allows tracking raw material batches, auditing stock movements, and logging food waste events to minimize shrink and maintain real-time inventory visibility.

### 15.1 Create Inventory Batch

- **Method / URL**: `POST /inventory/batches`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field               | Type   | Required | Rules / Description                          |
  | :------------------ | :----- | :------- | :------------------------------------------- |
  | `ingredientId`      | String | Yes      | MongoId of ingredient                        |
  | `batchNumber`       | String | Yes      | Unique batch / lot reference code            |
  | `quantityRemaining` | Number | Yes      | Remaining stock quantity ($\ge 0$)           |
  | `unitCost`          | Number | Yes      | Purchase cost per unit ($\ge 0$)             |
  | `expiryDate`        | String | Yes      | ISO Date string for ingredient expiration    |
  | `receivedDate`      | String | No       | ISO Date string (Default: Current timestamp) |

  _Request Example_:

  ```json
  {
    "ingredientId": "669fc3333333333abcdef123",
    "batchNumber": "LOT-20260726-01",
    "quantityRemaining": 25.5,
    "unitCost": 4.5,
    "expiryDate": "2026-08-10T00:00:00.000Z"
  }
  ```

- **Response (201 Created)**: Created `InventoryBatch` object.

---

### 15.2 Get Inventory Batches (Paginated & Filtered)

- **Method / URL**: `GET /inventory/batches`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter        | Type            | Default | Description                               |
  | :--------------- | :-------------- | :------ | :---------------------------------------- |
  | `page`           | Number / String | `1`     | Page index                                |
  | `limit`          | Number / String | `10`    | Items per page                            |
  | `ingredientId`   | String          | _None_  | Filter by Ingredient ObjectId             |
  | `expiringBefore` | ISO Date String | _None_  | Filter batches expiring on or before date |

---

### 15.3 Create Stock Transaction

- **Method / URL**: `POST /inventory/transactions`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field             | Type   | Required | Rules / Description                                                                                                       |
  | :---------------- | :----- | :------- | :------------------------------------------------------------------------------------------------------------------------ |
  | `ingredientId`    | String | Yes      | MongoId of ingredient                                                                                                     |
  | `batchId`         | String | No       | Optional MongoId of inventory batch                                                                                       |
  | `transactionType` | String | Yes      | Enum: `'purchase'`, `'consumption'`, `'waste'`, `'adjustment'`, `'transfer_in'`, `'transfer_out'`, `'return_to_supplier'` |
  | `quantity`        | Number | Yes      | Transaction volume (> 0)                                                                                                  |
  | `unit`            | String | Yes      | Enum: `'kg'`, `'liter'`, `'piece'`                                                                                        |
  | `date`            | String | No       | ISO Date string (Default: Current timestamp)                                                                              |
  | `wasteReason`     | String | No       | Enum (Required if `transactionType = 'waste'`)                                                                            |
  | `estimatedCost`   | Number | No       | Financial value of transaction ($\ge 0$)                                                                                  |

- **Response (201 Created)**: Created `StockTransaction` object.

---

### 15.4 Get Stock Transactions (Paginated & Filtered)

- **Method / URL**: `GET /inventory/transactions`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter         | Type            | Default | Description                            |
  | :---------------- | :-------------- | :------ | :------------------------------------- |
  | `page`            | Number / String | `1`     | Page index                             |
  | `limit`           | Number / String | `10`    | Items per page                         |
  | `ingredientId`    | String          | _None_  | Filter by Ingredient ObjectId          |
  | `transactionType` | String          | _None_  | Filter by transaction type             |
  | `startDate`       | ISO Date        | _None_  | Filter transactions starting from date |
  | `endDate`         | ISO Date        | _None_  | Filter transactions up to date         |

---

### 15.5 Create Waste Event

- **Method / URL**: `POST /inventory/waste-events`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field           | Type   | Required | Rules / Description                                                                                                                          |
  | :-------------- | :----- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
  | `ingredientId`  | String | Yes      | MongoId of ingredient                                                                                                                        |
  | `batchId`       | String | No       | Optional MongoId of inventory batch                                                                                                          |
  | `quantity`      | Number | Yes      | Quantity wasted (> 0)                                                                                                                        |
  | `unit`          | String | Yes      | Enum: `'kg'`, `'liter'`, `'piece'`                                                                                                           |
  | `wasteReason`   | String | Yes      | Enum: `'expired'`, `'overproduction'`, `'preparation_loss'`, `'spoiled'`, `'customer_return'`, `'damaged'`, `'incorrect_order'`, `'unknown'` |
  | `estimatedCost` | Number | Yes      | Estimated loss value ($\ge 0$)                                                                                                               |
  | `date`          | String | No       | ISO Date string (Default: Current timestamp)                                                                                                 |

- **Automated Side Effects**:
  - Automatically logs an associated `StockTransaction` of type `'waste'`.
- **Response (201 Created)**: Created `WasteEvent` object.

---

### 15.6 Get Waste Events (Paginated & Filtered)

- **Method / URL**: `GET /inventory/waste-events`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter      | Type            | Default | Description                            |
  | :------------- | :-------------- | :------ | :------------------------------------- |
  | `page`         | Number / String | `1`     | Page index                             |
  | `limit`        | Number / String | `10`    | Items per page                         |
  | `ingredientId` | String          | _None_  | Filter by Ingredient ObjectId          |
  | `wasteReason`  | String          | _None_  | Filter by waste reason enum            |
  | `startDate`    | ISO Date        | _None_  | Filter waste events starting from date |
  | `endDate`      | ISO Date        | _None_  | Filter waste events up to date         |

---

## 16. Daily Production Planning Module (`/predictions/production-plan`)

The Production Planning module provides AI-driven daily meal preparation recommendations based on historical sales data, seasonal demand trends, and waste history.

### 16.1 Get Daily Production Plan

- **Method / URL**: `GET /predictions/production-plan`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter | Type   | Required | Rules / Description                                        |
  | :-------- | :----- | :------- | :--------------------------------------------------------- |
  | `date`    | String | No       | Target date in `YYYY-MM-DD` format (Default: Today's date) |

- **Response (200 OK)**:
  Returns calculated or cached `DailyProductionPlan` entity:
  ```json
  {
    "_id": "669fc9999999999abcdef111",
    "restaurantId": "669fc8888888888abcdef222",
    "date": "2026-07-26",
    "totalRecommendedQty": 120,
    "items": [
      {
        "productId": {
          "_id": "669fc3333333333abcdef444",
          "title": "Margherita Pizza",
          "price": 12.99
        },
        "recommendedQty": 45,
        "lowerBound": 40,
        "upperBound": 50,
        "confidence": "high",
        "source": "ai_model",
        "actualProducedQty": null
      }
    ],
    "isDeleted": false,
    "createdAt": "2026-07-26T00:00:00.000Z",
    "updatedAt": "2026-07-26T00:00:00.000Z"
  }
  ```

---

### 16.2 Record Actual Kitchen Production

- **Method / URL**: `POST /predictions/production-plan/actuals`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field                       | Type   | Required | Rules / Description                                        |
  | :-------------------------- | :----- | :------- | :--------------------------------------------------------- |
  | `date`                      | String | No       | Target date in `YYYY-MM-DD` format (Default: Today's date) |
  | `items`                     | Array  | Yes      | Array of recorded item production numbers                  |
  | `items[].productId`         | String | Yes      | Product ObjectId                                           |
  | `items[].actualProducedQty` | Number | Yes      | Actual quantity prepared ($\ge 0$)                         |

  _Request Example_:

  ```json
  {
    "date": "2026-07-26",
    "items": [
      {
        "productId": "669fc3333333333abcdef444",
        "actualProducedQty": 42
      }
    ]
  }
  ```

- **Response (200 OK)**: Updated `DailyProductionPlan` entity.

---

## 17. Data Ingestion & CSV Import Jobs Module (`/imports`)

The Imports module provides asynchronous bulk ingestion for historical sales, inventory transactions, raw ingredients, menu items, and recipes, featuring AI-assisted header column matching and error reporting.

### 17.1 Create Data Import Job

- **Method / URL**: `POST /imports`
- **Auth Level**: Access Token (`manager`, `admin`)
- **Headers**: `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`
- **Request Body (`multipart/form-data`)**:

  | Field        | Type   | Required | Description                                                                                       |
  | :----------- | :----- | :------- | :------------------------------------------------------------------------------------------------ |
  | `file`       | File   | Yes      | CSV data file upload                                                                              |
  | `importType` | String | Yes      | Enum: `'sales_history'`, `'inventory_transactions'`, `'recipes'`, `'menu_items'`, `'ingredients'` |

- **Response (201 Created)**: Created `ImportJob` instance with parsed column headers and initial validation stats.

---

### 17.2 Preview Import Mapping

- **Method / URL**: `POST /imports/:id/preview`
- **Auth Level**: Access Token (`manager`, `admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field           | Type   | Required | Description                                                     |
  | :-------------- | :----- | :------- | :-------------------------------------------------------------- |
  | `columnMapping` | Object | No       | Key-value mapping of CSV column titles to schema attribute keys |

  _Request Example_:

  ```json
  {
    "columnMapping": {
      "Item Title": "title",
      "Sales Count": "quantitySold",
      "Unit Price": "sellingPrice"
    }
  }
  ```

- **Response (200 OK)**: Detailed preview payload displaying parsed rows, valid/invalid counts, and row-level validation errors.

---

### 17.3 Confirm & Ingest Data Import

- **Method / URL**: `POST /imports/:id/confirm`
- **Auth Level**: Access Token (`manager`, `admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field           | Type   | Required | Description                       |
  | :-------------- | :----- | :------- | :-------------------------------- |
  | `columnMapping` | Object | No       | Key-value column mapping override |

- **Response (200 OK)**: Finalized `ImportJob` object (`status: 'completed'` or `'failed'`).

---

### 17.4 Get Import Jobs (Paginated & Filtered)

- **Method / URL**: `GET /imports`
- **Auth Level**: Access Token (`manager`, `admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter    | Type            | Default | Description                                                                                                  |
  | :----------- | :-------------- | :------ | :----------------------------------------------------------------------------------------------------------- |
  | `page`       | Number / String | `1`     | Page index                                                                                                   |
  | `limit`      | Number / String | `10`    | Items per page                                                                                               |
  | `importType` | String          | _None_  | Filter by import type enum                                                                                   |
  | `status`     | String          | _None_  | Filter by status (`processing`, `validated`, `ai_ingest_pending`, `ai_ingest_failed`, `completed`, `failed`) |

---

### 17.5 Get Import Job Details by ID

- **Method / URL**: `GET /imports/:id`
- **Auth Level**: Access Token (`manager`, `admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Detailed `ImportJob` entity with row metrics and full array of row-level error objects.

---

### 17.6 Retry AI Ingest

- **Method / URL**: `POST /imports/:id/retry-ai-ingest`
- **Auth Level**: Access Token (`manager`, `admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Triggers retry attempt for AI-assisted column matching if initial AI ingest failed or was pending.
- **Response (200 OK)**: Updated `ImportJob` entity.

---

## 18. Dashboard Module (`/dashboard`)

The Dashboard module provides analytics, KPI aggregations, revenue trends, order status distributions, ranked top products/categories/restaurants, fulfillment method distributions, and operational alerts for both System Administrators and Restaurant Managers.

### 18.1 Get Admin Dashboard Analytics

Retrieves high-level platform-wide analytics, metrics, rankings, and operational alerts for system administrators.

- **Method / URL**: `GET /dashboard/admin`
- **Auth Level**: Access Token (`admin`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter   | Type            | Required | Default       | Description                                                           |
  | :---------- | :-------------- | :------- | :------------ | :-------------------------------------------------------------------- |
  | `startDate` | ISO Date String | No       | _7 days ago_  | Start of date range (e.g. `2026-07-17` or `2026-07-17T00:00:00.000Z`) |
  | `endDate`   | ISO Date String | No       | _Now / Today_ | End of date range (e.g. `2026-07-23` or `2026-07-23T23:59:59.999Z`)   |

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
        "previous": 350.0,
        "changePercent": 24.68
      },
      "orders": {
        "current": 15,
        "previous": 12,
        "changePercent": 25.0
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

### 18.2 Get Restaurant Manager Dashboard Analytics

Retrieves analytics, metrics, ranked top products/categories, fulfillment distribution, and operational alerts specifically scoped to the authenticated manager's assigned restaurant.

- **Method / URL**: `GET /dashboard/manager`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter   | Type            | Required | Default       | Description                                                           |
  | :---------- | :-------------- | :------- | :------------ | :-------------------------------------------------------------------- |
  | `startDate` | ISO Date String | No       | _7 days ago_  | Start of date range (e.g. `2026-07-17` or `2026-07-17T00:00:00.000Z`) |
  | `endDate`   | ISO Date String | No       | _Now / Today_ | End of date range (e.g. `2026-07-23` or `2026-07-23T23:59:59.999Z`)   |

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
        "current": 250.0,
        "previous": 200.0,
        "changePercent": 25.0
      },
      "orders": {
        "current": 8,
        "previous": 6,
        "changePercent": 33.33
      },
      "activeOffers": 3,
      "pendingOrders": 1,
      "netProfit": 215.0,
      "taxDeduction": 35.0,
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

## 19. Sales Module (`/sales`)

The Sales Module provides granular sales transaction tracking, historical sales listing, source-based revenue audit trails, and aggregate financial sales statistics for System Administrators and Restaurant Managers.

### 19.1 Get Sales Transactions (Paginated & Filtered)

- **Method / URL**: `GET /sales`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Security Check**: Managers are automatically scoped to their own assigned `restaurantId`. Admin can query across all restaurants or filter by a specific `restaurantId`.
- **Query Parameters**:

  | Parameter      | Type            | Required | Default | Description                                                                        |
  | :------------- | :-------------- | :------- | :------ | :--------------------------------------------------------------------------------- |
  | `restaurantId` | String          | No       | _None_  | Filter by Restaurant ObjectId (Admin only; Managers locked to assigned restaurant) |
  | `productId`    | String          | No       | _None_  | Filter by Product ObjectId                                                         |
  | `startDate`    | ISO Date String | No       | _None_  | Start date filter (`date >= startDate 00:00:00.000Z`)                              |
  | `endDate`      | ISO Date String | No       | _None_  | End date filter (`date <= endDate 23:59:59.999Z`)                                  |
  | `source`       | Enum String     | No       | _None_  | Filter transaction source (`csv_import`, `marketplace_order`, `pos_sync`)          |
  | `page`         | Number          | No       | `1`     | Page number                                                                        |
  | `limit`        | Number          | No       | `10`    | Items per page                                                                     |
  | `sort`         | String          | No       | `date`  | Field to sort by (`date`, `quantitySold`, `sellingPrice`)                          |
  | `order`        | String          | No       | `desc`  | Sort direction (`asc`, `desc`)                                                     |

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

### 19.2 Get Sales Summary Statistics

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
      "totalDiscountsGiven": 109.2,
      "promotionalSalesCount": 42,
      "featuredSalesCount": 42,
      "averageSellingPrice": 10.39
    }
  }
  ```

---

## 20. End-to-End Shopping, Inventory, Production & Order Analytics Workflow

1. **Create Restaurant & Assign Manager** (Admin): `POST /restaurants`, `POST /users` with `role: manager`.
2. **Setup Vendor Suppliers** (Manager):
   - Register suppliers via `POST /suppliers`.
3. **Manage Raw Ingredients & Purchase Stock** (Manager):
   - Create raw material ingredients via `POST /ingredients`.
   - Issue purchase orders to suppliers via `POST /purchase-orders`.
   - Receive vendor orders via `PATCH /purchase-orders/:id/receive`, creating inventory batches and stock transactions.
4. **Define Recipes & Products** (Admin / Manager):
   - Create categories (`POST /categories`) and menu products (`POST /products`).
   - Map ingredient portion recipes via `PUT /products/:productId/recipe`.
5. **Bulk Data Imports** (Admin / Manager):
   - Upload CSV sales/inventory data via `POST /imports`.
   - Preview and confirm AI-assisted column mapping via `POST /imports/:id/preview` and `POST /imports/:id/confirm`.
6. **Kitchen Production Planning & Waste Logging** (Manager):
   - Retrieve AI-recommended production plan via `GET /predictions/production-plan`.
   - Log actual kitchen production via `POST /predictions/production-plan/actuals`.
   - Log ingredient spoilage/waste via `POST /inventory/waste-events`.
7. **Create Promotional Offers** (Manager):
   - Launch offers via `POST /offers` with discount percentage and `availableQuantity`.
8. **Customer Store Browsing & Ordering**:
   - Browse offers via `GET /offers/active` or `GET /offers/recommendations`.
   - Add to cart (`POST /cart`) or favorites (`POST /favorites/:offerId`).
   - Checkout order via `POST /orders`, receiving aggregated `GroupOrder`.
9. **Order Fulfillment & Sales Audit**:
   - Update sub-order status via `PATCH /orders/:id/status`.
   - Marking orders as `Delivered` idempotently logs `SalesTransaction` entries.
   - Audit financial performance via `GET /sales` and `GET /sales/summary`.
10. **Dashboard Monitoring & Analytics**:
    - Admin monitors platform-wide metrics via `GET /dashboard/admin`.
    - Manager tracks restaurant performance via `GET /dashboard/manager`.
