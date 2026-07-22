# RestoMind API Documentation

This documentation provides comprehensive details for integrating with the **RestoMind API**. It is designed specifically for frontend developers, detailing base configurations, request/response formats, authorization levels, parameters, validations, and response schemas.

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
  role: 'admin' | 'customer' | 'manager';
  gender?: 'male' | 'female';
  phone: string;                // Encrypted on DB, plain string on API boundaries
  isEmailVerified: boolean;
  DOB?: string;                 // ISO Date String
  image?: Image;                // Profile picture object
  restaurantId?: string;        // Associated Restaurant ObjectId (for manager role)
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
  shelfLifeDays: number;
  minimumStock: number;
  safetyStock: number;
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
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
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
  overallStatus: 'Pending' | 'Confirmed' | 'Preparing' | 'Out For Delivery' | 'Delivered' | 'Cancelled' | 'Partially Delivered' | 'Partially Cancelled' | 'Processing';
  createdAt: string;
  updatedAt: string;
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
  | `type`  | String | Yes      | `'confirmation'` or `'reset-password'` | Type of OTP flow |

- **Response (200 OK)**: `{ "message": "OTP sent successfully" }`

---

### 3.7 Forgot Password

Generates password reset OTP code and emails it to the user.

- **Method / URL**: `POST /auth/forgot-password`
- **Auth Level**: Public
- **Request Body (`application/json`)**: `{ "email": "johndoe@example.com" }`
- **Response (200 OK)**: `{ "message": "OTP sent successfully" }`

---

### 3.8 Generate Access Token (Token Refresh)

Uses a valid refresh token to get a new short-lived access token.

- **Method / URL**: `POST /auth/generate-access-token`
- **Auth Level**: Refresh Token (`admin`, `customer`, `manager`)
- **Headers**: `Authorization: Bearer <refreshToken>`
- **Request Body (`application/json`)**: `{ "token": "<refreshToken>" }`
- **Response (200 OK)**: `{ "accessToken": "newAccessToken..." }`

---

### 3.9 Confirm Reset OTP

Verifies the password reset OTP and returns a temporary `resetToken`.

- **Method / URL**: `PATCH /auth/confirm-reset-otp`
- **Auth Level**: Public
- **Request Body (`application/json`)**: `{ "email": "johndoe@example.com", "otp": "459012" }`
- **Response (200 OK)**: `{ "message": "OTP verified successfully", "resetToken": "ey..." }`

---

### 3.10 Reset Password

Updates the password for the user using the `resetToken` received from OTP verification.

- **Method / URL**: `PATCH /auth/reset-password`
- **Auth Level**: Reset Token
- **Headers**: `Authorization: Bearer <resetToken>`
- **Request Body (`application/json`)**: `{ "password": "newPassword123", "confirmPassword": "newPassword123" }`
- **Response (200 OK)**: `{ "message": "Password reset successfully, Now login again" }`

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

- `POST /users` — Create User (Admin / Manager)
- `GET /users` — Find All Users (Paginated, filtered by `search`, `role`)
- `GET /users/:id` — Find User by ID
- `PATCH /users/:id` — Update User by ID
- `DELETE /users/:id` — Soft Delete User (Admin only)

---

## 5. Categories Module (`/categories`)

- `POST /categories` — Create Category (`multipart/form-data`: `name`, `description`, `image` file) (Admin only)
- `PATCH /categories/:id` — Update Category (Admin only)
- `DELETE /categories/:id` — Soft Delete Category (Admin only)
- `GET /categories` — View All Categories (Public)
- `GET /categories/:id` — Get Category by ID (Admin only)

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
- **Auth Level**: Access Token (`admin`, `manager`)
- **Query Parameters**: `page`, `limit`, `category`, `restaurantId`, `search`, `tag`, `sort`, `order`.

---

### 6.6 Get Product Details

- **Method / URL**: `GET /products/:id`
- **Auth Level**: Access Token (`admin`, `manager`)

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
    "deliveryMethod": "Home Delivery",
    "deliveryAddress": {
      "street": "12 Nile St",
      "city": "Cairo",
      "country": "Egypt"
    },
    "specialNotes": "Ring the bell twice",
    "paymentMethod": "Cash on Delivery",
    "saveAddress": true
  }
  ```

- **Response (201 Created)**: Aggregated `GroupOrder` structure containing customer info, overall status, total prices, and an array of restaurant sub-orders.

---

### 9.2 Get My Orders (Order History)

- **Method / URL**: `GET /orders/me`
- **Auth Level**: Access Token (`customer`, `admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**: `restaurantId` (optional)
- **Response (200 OK)**: Array of `GroupOrder` objects.

---

### 9.3 Get Checkout / Group Order Details

- **Method / URL**: `GET /orders/me/:id`, `GET /orders/group/:id`, or `GET /order-groups/:id`
- **Auth Level**: Access Token (`customer`, `admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Accepts either `groupOrderId` or sub-order `orderId` and returns the unified `GroupOrder` object.

---

### 9.4 Get All Orders (Admin Only)

- **Method / URL**: `GET /orders`
- **Auth Level**: Access Token (`admin`)
- **Query Parameters**: `restaurantId` (optional)

---

### 9.5 Get Restaurant Orders (Admin / Manager)

- **Method / URL**: `GET /orders/restaurant/:restaurantId`
- **Auth Level**: Access Token (`admin`, `manager`)
- **Description**: Returns sub-orders for a specific restaurant. Managers can only query their assigned `restaurantId`.

---

### 9.6 Update Order Status (Admin Only)

- **Method / URL**: `PATCH /orders/:id/status`
- **Auth Level**: Access Token (`admin`)
- **Request Body (`application/json`)**:
  ```json
  {
    "status": "Confirmed"
  }
  ```
  _Statuses: `"Pending"`, `"Confirmed"`, `"Preparing"`, `"Out For Delivery"`, `"Delivered"`, `"Cancelled"`_

---

## 10. Restaurant Module (`/restaurants`)

- `POST /restaurants` — Create Restaurant (Admin)
- `GET /restaurants` — Get All Restaurants (Paginated) (Admin)
- `GET /restaurants/me` — Get My Restaurant (Manager)
- `GET /restaurants/:id` — Get Restaurant by ID (Admin)
- `PATCH /restaurants/:id` — Update Restaurant (Admin, Manager - own only)
- `DELETE /restaurants/:id` — Soft Delete Restaurant (Admin)

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
    "featured": true
  }
  ```
  _Note: `availableQuantity` is required ($\ge 1$). `remainingQuantity` is managed automatically by the backend._

---

### 11.2 Get Active Offers (Public Customer Store)

Returns currently active promotional offers (`status = active` and `endDate >= now`).

- **Method / URL**: `GET /offers/active`
- **Auth Level**: Public
- **Query Parameters**:
  - `restaurantId` (string)
  - `categoryId` (string)
  - `productId` (string)
  - `search` (string, searches product title/description)
  - `featured` (boolean)
  - `minPrice` (number)
  - `maxPrice` (number)
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
- **Query Parameters**: `status` (`active`, `scheduled`, `draft`, `expired`, `cancelled`, `sold_out`), `productId`, `categoryId`, `source`, `featured`, `minPrice`, `maxPrice`, `search`, `sortBy`, `sortOrder`, `page`, `limit`.

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
    "ingredientCode": "ING-FLOUR-01",
    "name": "Wheat Flour",
    "unit": "kg",
    "shelfLifeDays": 30,
    "minimumStock": 10,
    "safetyStock": 5
  }
  ```
  _Note: `unit` must be one of `"kg"`, `"liter"`, or `"piece"`._

---

### 12.2 Get All Ingredients

- **Method / URL**: `GET /ingredients`
- **Auth Level**: Access Token (`manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**: `page` (Default: `1`), `limit` (Default: `10`), `search` (searches `name` and `ingredientCode`).

---

### 12.3 Get Ingredient by ID

- **Method / URL**: `GET /ingredients/:id`
- **Auth Level**: Access Token (`manager`)

---

### 12.4 Update Ingredient

- **Method / URL**: `PATCH /ingredients/:id`
- **Auth Level**: Access Token (`manager`)
- **Request Body (`application/json`)**: Accepts optional `name`, `unit`, `shelfLifeDays`, `minimumStock`, `safetyStock`.

---

### 12.5 Delete Ingredient (Soft Delete)

- **Method / URL**: `DELETE /ingredients/:id`
- **Auth Level**: Access Token (`manager`)
- **Description**: Soft deletes ingredient. Returns `400 Bad Request` if ingredient is used in an active product recipe.

---

## 13. End-to-End Shopping & Order Workflow

1. **Create Restaurant** (Admin): `POST /restaurants`
2. **Create Ingredients & Recipe** (Manager):
   - Add ingredients via `POST /ingredients`.
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
8. **Order Tracking**:
   - Customer checks `GET /orders/me`.
   - Manager checks `GET /orders/restaurant/:restaurantId`.
   - Admin checks `GET /orders` and updates status via `PATCH /orders/:id/status`.

