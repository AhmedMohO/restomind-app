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

### Cart Item Schema

```typescript
interface CartItem {
  product: {
    _id: string;
    title: string;
    description: string;
    price: number;
    discountedPrice: number;
    image: Image;
    isAvailable: boolean;
  };
  quantity: number;
  unitPrice: number;
  discountedPrice: number;
  totalItemPrice: number;       // quantity * discountedPrice
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

### Order Schema

```typescript
interface OrderItem {
  productId: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
}

interface DeliveryAddress {
  addressId?: string;
  street: string;
  city: string;
  country: string;
}

interface Order {
  _id: string;
  userId: string;
  restaurantId: Restaurant;         // Associated Restaurant ObjectId
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

### Offer Schema

```typescript
interface Offer {
  _id: string;                      // ObjectId
  productId: string | Product;      // Associated Product ID or populated Product
  restaurantId: string | Restaurant; // Associated Restaurant ID or populated Restaurant
  discountPercentage: number;       // Discount % (1 - 100)
  startDate: string;                // ISO Date String
  endDate: string;                  // ISO Date String
  status: 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled';
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
  _Returns the newly created user object (excluding password)._
  ```json
  {
    "_id": "64b0f9f36f6d5c001cfef2b8",
    "firstName": "John",
    "lastName": "Doe",
    "email": "johndoe@example.com",
    "role": "customer",
    "gender": "male",
    "phone": "+1234567890",
    "isEmailVerified": false,
    "DOB": "1995-10-15T00:00:00.000Z",
    "isDeleted": false,
    "createdAt": "2026-07-17T18:40:00.000Z",
    "updatedAt": "2026-07-17T18:40:00.000Z"
  }
  ```

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

  _Request Example_:

  ```json
  {
    "email": "johndoe@example.com",
    "password": "securepassword123"
  }
  ```

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
- **Auth Level**: Access Token (`admin` or `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  _Returns the active user object._
  ```json
  {
    "_id": "64b0f9f36f6d5c001cfef2b8",
    "firstName": "John",
    "lastName": "Doe",
    "email": "johndoe@example.com",
    "role": "customer",
    "gender": "male",
    "phone": "+1234567890",
    "isEmailVerified": true,
    "DOB": "1995-10-15T00:00:00.000Z",
    "addresses": [],
    "isDeleted": false,
    "createdAt": "2026-07-17T18:40:00.000Z",
    "updatedAt": "2026-07-17T18:45:00.000Z"
  }
  ```

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

  _Request Example_:

  ```json
  {
    "email": "johndoe@example.com",
    "otp": "857201"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "message": "Email confirmed successfully"
  }
  ```

---

### 3.5 Log Out

Blacklists the current access token.

- **Method / URL**: `POST /auth/logout`
- **Auth Level**: Access Token (`admin` or `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "message": "Logout successfully"
  }
  ```

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

  _Request Example_:

  ```json
  {
    "email": "johndoe@example.com",
    "type": "confirmation"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "message": "OTP sent successfully"
  }
  ```

---

### 3.7 Forgot Password

Generates password reset OTP code and emails it to the user.

- **Method / URL**: `POST /auth/forgot-password`
- **Auth Level**: Public
- **Request Body (`application/json`)**:

  | Field   | Type   | Required | Description           |
  | :------ | :----- | :------- | :-------------------- |
  | `email` | String | Yes      | Account email address |

  _Request Example_:

  ```json
  {
    "email": "johndoe@example.com"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "message": "OTP sent successfully"
  }
  ```

---

### 3.8 Generate Access Token (Token Refresh)

Uses a valid refresh token to get a new short-lived access token.

- **Method / URL**: `POST /auth/generate-access-token`
- **Auth Level**: Refresh Token (`admin`, `customer`, `manager`)
- **Headers**: `Authorization: Bearer <refreshToken>`
- **Response (200 OK)**:
  ```json
  {
    "accessToken": "newAccessTokeneyJhbGciOiJIUzI1NiIsInR5c..."
  }
  ```

---

### 3.9 Confirm Reset OTP

Verifies the password reset OTP and returns a temporary `resetToken`.

- **Method / URL**: `PATCH /auth/confirm-reset-otp`
- **Auth Level**: Public
- **Request Body (`application/json`)**:

  | Field   | Type   | Required | Description           |
  | :------ | :----- | :------- | :-------------------- |
  | `email` | String | Yes      | Account email address |
  | `otp`   | String | Yes      | 6-digit OTP code      |

  _Request Example_:

  ```json
  {
    "email": "johndoe@example.com",
    "otp": "459012"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "message": "OTP verified successfully",
    "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

### 3.10 Reset Password

Updates the password for the user using the `resetToken` received from OTP verification.

- **Method / URL**: `PATCH /auth/reset-password`
- **Auth Level**: Reset Token
- **Headers**: `Authorization: Bearer <resetToken>`
- **Request Body (`application/json`)**:

  | Field             | Type   | Required | Rules        | Description           |
  | :---------------- | :----- | :------- | :----------- | :-------------------- |
  | `password`        | String | Yes      | Min length 6 | New password          |
  | `confirmPassword` | String | Yes      | Min length 6 | Must match `password` |

  _Request Example_:

  ```json
  {
    "password": "newSecurePassword123",
    "confirmPassword": "newSecurePassword123"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "message": "Password reset successfully, Now login again"
  }
  ```

---

### 3.11 Update Me

Updates the active user's details and/or uploads a profile photo.

- **Method / URL**: `PATCH /auth/update-me`
- **Auth Level**: Access Token (`admin` or `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**:

  | Field       | Type   | Required | Rules                       | Description               |
  | :---------- | :----- | :------- | :-------------------------- | :------------------------ |
  | `firstName` | String | No       | Min length 3, max length 20 | Updated first name        |
  | `lastName`  | String | No       | Min length 3, max length 20 | Updated last name         |
  | `phone`     | String | No       | Valid phone number          | Updated phone number      |
  | `gender`    | String | No       | `'male'` or `'female'`      | Updated gender            |
  | `DOB`       | String | No       | Date format                 | Updated Date of Birth     |
  | `image`     | File   | No       | Image mimetype format       | Profile photo file upload |

- **Response (200 OK)**:
  _Returns the updated user object._

---

### 3.12 Add Delivery Address

Saves a new delivery address to the logged-in user's profile.

- **Method / URL**: `POST /auth/addresses`
- **Auth Level**: Access Token (`admin` or `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field         | Type    | Required | Rules              | Description                             |
  | :------------ | :------ | :------- | :----------------- | :-------------------------------------- |
  | `label`       | String  | No       | None               | Address label (e.g. `'Home'`, `'Work'`) |
  | `fullName`    | String  | No       | None               | Recipient name (defaults to user name)  |
  | `phoneNumber` | String  | Yes      | Valid phone number | Contact phone number                    |
  | `street`      | String  | Yes      | Non-empty string   | Street address                          |
  | `city`        | String  | Yes      | Non-empty string   | City                                    |
  | `country`     | String  | No       | None               | Country                                 |
  | `isDefault`   | Boolean | No       | Boolean            | Set as default address                  |

  _Request Example_:

  ```json
  {
    "label": "Home",
    "phoneNumber": "+1234567890",
    "street": "12 Nile St",
    "city": "Cairo",
    "country": "Egypt",
    "isDefault": true
  }
  ```

- **Response (201 Created)**:
  _Returns the newly added address object._

---

### 3.13 Get My Saved Addresses

Retrieves all delivery addresses saved in the user's profile.

- **Method / URL**: `GET /auth/addresses`
- **Auth Level**: Access Token (`admin` or `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  _Returns an array of `UserAddress` objects._

---

### 3.14 Update Saved Address

Updates an existing saved delivery address.

- **Method / URL**: `PATCH /auth/addresses/:addressId`
- **Auth Level**: Access Token (`admin` or `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: Accepts optional fields from `Add Delivery Address`.

- **Response (200 OK)**:
  _Returns the updated address object._

---

### 3.15 Delete Saved Address

Deletes a saved address from the user's profile.

- **Method / URL**: `DELETE /auth/addresses/:addressId`
- **Auth Level**: Access Token (`admin` or `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "message": "Address deleted successfully"
  }
  ```

---

### 3.16 Set Address as Default

Sets the specified address as the default delivery address for the user.

- **Method / URL**: `PATCH /auth/addresses/:addressId/default`
- **Auth Level**: Access Token (`admin` or `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  _Returns the updated address list._

---

## 4. User Management Module (`/users`)

### 4.1 Create User (Admin / Manager)

- **Method / URL**: `POST /users`
- **Auth Level**: Access Token (`admin` or `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field          | Type   | Required | Rules                                | Description                        |
  | :------------- | :----- | :------- | :----------------------------------- | :--------------------------------- |
  | `firstName`    | String | Yes      | Min length 3, max length 20          | First name                         |
  | `lastName`     | String | Yes      | Min length 3, max length 20          | Last name                          |
  | `email`        | String | Yes      | Valid email                          | Unique email                       |
  | `password`     | String | Yes      | Min length 6                         | Password                           |
  | `phone`        | String | Yes      | Valid phone number                   | Mobile number                      |
  | `role`         | String | No       | `'admin' \| 'customer' \| 'manager'` | Default is `'customer'`            |
  | `gender`       | String | No       | `'male' \| 'female'`                 | Gender                             |
  | `DOB`          | String | No       | ISO Date string                      | Date of Birth                      |
  | `restaurantId` | String | No       | Valid Restaurant ObjectId            | Assigned restaurant (for managers) |

  _Request Example_:

  ```json
  {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "janedoe@example.com",
    "password": "securepassword456",
    "phone": "+1555555555",
    "role": "manager",
    "gender": "female",
    "restaurantId": "64b0f9f36f6d5c001cfef2b8"
  }
  ```

- **Response (201 Created)**:
  ```json
  {
    "data": {
      "_id": "64b0fc086f6d5c001cfef2c2",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "janedoe@example.com",
      "role": "manager",
      "gender": "female",
      "phone": "+1555555555",
      "restaurantId": "64b0f9f36f6d5c001cfef2b8",
      "isEmailVerified": false,
      "isDeleted": false,
      "createdAt": "2026-07-17T18:55:00.000Z",
      "updatedAt": "2026-07-17T18:55:00.000Z"
    }
  }
  ```

---

### 4.2 Find All Users (Paginated)

- **Method / URL**: `GET /users`
- **Auth Level**: Access Token (`admin` or `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter | Type   | Required | Default     | Description                                       |
  | :-------- | :----- | :------- | :---------- | :------------------------------------------------ |
  | `page`    | String | No       | `1`         | Page number                                       |
  | `limit`   | String | No       | `10`        | Size of page result                               |
  | `search`  | String | No       | _None_      | Match first/last name or email (case-insensitive) |
  | `role`    | String | No       | _None_      | Filter by role                                    |
  | `sort`    | String | No       | _None_      | Sort field name (e.g. `'createdAt'`)              |
  | `order`   | String | No       | `'asc'`     | Sort direction (`'asc'` or `'desc'`)              |

- **Response (200 OK)**:
  Standard paginated response with `items`, `page`, `limit`, and `totalPages`.

---

### 4.3 Find User by ID

- **Method / URL**: `GET /users/:id`
- **Auth Level**: Access Token (`admin` or `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Single user object wrapped in `data`.

---

### 4.4 Update User by ID

- **Method / URL**: `PATCH /users/:id`
- **Auth Level**: Access Token (`admin` or `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: Accepts optional fields from `Create User` (including `restaurantId`).

- **Response (200 OK)**: Updated user object wrapped in `data`.

---

### 4.5 Soft Delete User

- **Method / URL**: `DELETE /users/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "message": "User deleted successfully"
  }
  ```

---

## 5. Categories Module (`/categories`)

### 5.1 Create Category

- **Method / URL**: `POST /categories`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**:

  | Field         | Type   | Required | Rules                         | Description                |
  | :------------ | :----- | :------- | :---------------------------- | :------------------------- |
  | `name`        | String | Yes      | Unique category name          | Category title             |
  | `description` | String | Yes      | None                          | Category explanation       |
  | `image`       | File   | Yes      | Image format (png, jpg, etc.) | Category icon / photo file |

- **Response (201 Created)**: Created category entity wrapped in `data`.

---

### 5.2 Update Category

- **Method / URL**: `PATCH /categories/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**: Accepts optional `name`, `description`, and `image` file.

- **Response (200 OK)**: Updated category object wrapped in `data`.

---

### 5.3 Delete Category (Soft Delete)

- **Method / URL**: `DELETE /categories/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Success message.

---

### 5.4 View All Categories

- **Method / URL**: `GET /categories`
- **Auth Level**: Public
- **Response (200 OK)**: Array of category entities wrapped in `data`.

---

### 5.5 Get Category by ID

- **Method / URL**: `GET /categories/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Single category entity wrapped in `data`.

---

## 6. Products Module (`/products`)

### 6.1 Create Product

- **Method / URL**: `POST /products`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**:

  | Field             | Type            | Required | Rules                                           | Description                                          |
  | :---------------- | :-------------- | :------- | :---------------------------------------------- | :--------------------------------------------------- |
  | `title`           | String          | Yes      | None                                            | Product title                                        |
  | `description`     | String          | Yes      | None                                            | Brief product description                            |
  | `longDescription` | String          | Yes      | None                                            | Full detail product info                             |
  | `price`           | Number          | Yes      | Min 0                                           | Default selling price                                |
  | `discountedPrice` | Number          | No       | Min 0, Must be <= `price`                       | Discount price. Defaults to `price` if omitted.      |
  | `category`        | String          | Yes      | Valid Category ObjectId                         | Associated category                                  |
  | `restaurantId`    | String          | Yes      | Valid Restaurant ObjectId                       | Associated restaurant ID                             |
  | `freshnessWindow` | Number          | Yes      | Min 0                                           | Duration (in days) the product stays fresh           |
  | `tags`            | String or Array | No       | String containing comma-separated tags or array | Tags for searches (e.g. `'organic, green, spinach'`) |
  | `isBestseller`    | Boolean         | No       | Converts string `'true'` / `'false'`            | Bestseller flag                                      |
  | `isAvailable`     | Boolean         | No       | Converts string `'true'` / `'false'`            | Availability flag                                    |
  | `image`           | File            | Yes      | Image mimetype                                  | Product photograph                                   |

- **Response (201 Created)**: Created product object wrapped in `data`.

---

### 6.2 Update Product

- **Method / URL**: `PATCH /products/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**: Accepts all fields from `Create Product` as optional values, plus an optional replacement `image` file.

- **Response (200 OK)**: Updated product object wrapped in `data`.

---

### 6.3 Delete Product (Soft Delete)

- **Method / URL**: `DELETE /products/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Success message.

---

### 6.4 Change Availability

Directly toggle availability state of a product.

- **Method / URL**: `PATCH /products/:id/availability`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: `{ "isAvailable": boolean }`
- **Response (200 OK)**: Updated product object wrapped in `data`.

---

### 6.5 Update Discount

Sets the discounted price and/or sale end date of a product.

- **Method / URL**: `PATCH /products/:id/discount`
- **Auth Level**: Access Token (`admin` or `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field             | Type   | Required | Rules                 | Description                              |
  | :---------------- | :----- | :------- | :-------------------- | :--------------------------------------- |
  | `discountedPrice` | Number | No       | Min 0                 | Discounted price value                   |
  | `endDate`         | String | No       | Valid ISO Date string | Expiration date for the discount pricing |

  _Request Example_:

  ```json
  {
    "discountedPrice": 15.99,
    "endDate": "2026-08-01T00:00:00.000Z"
  }
  ```

- **Response (200 OK)**: Updated product object wrapped in `data`.

---

### 6.6 Get All Products (Filtered & Paginated)

- **Method / URL**: `GET /products`
- **Auth Level**: Public
- **Query Parameters**:

  | Parameter      | Type   | Required | Default     | Description                   |
  | :------------- | :----- | :------- | :---------- | :---------------------------- |
  | `page`         | String | No       | `1`         | Page index                    |
  | `limit`        | String | No       | `10`        | Items count per page          |
  | `category`     | String | No       | _None_      | Filter by Category ObjectId   |
  | `restaurantId` | String | No       | _None_      | Filter by Restaurant ObjectId |
  | `search`       | String | No       | _None_      | Partial title match           |
  | `tag`          | String | No       | _None_      | Tag keyword match             |
  | `sort`         | String | No       | `createdAt` | Sort attribute                |
  | `order`        | String | No       | `desc`      | `'asc'` or `'desc'`           |

- **Response (200 OK)**: Paginated product schema with populated category object.

---

### 6.7 Get Recommended Discounted Products

Gets a list of products that currently have an active discount.

- **Method / URL**: `GET /products/recommendations`
- **Auth Level**: Public
- **Query Parameters**: `page`, `limit`
- **Response (200 OK)**: Paginated product list.

---

### 6.8 Get Product Details

- **Method / URL**: `GET /products/:id`
- **Auth Level**: Public
- **Response (200 OK)**: Product object populated with Category object.

---

## 7. Favorites Module (`/favorites`)

### 7.1 Add Product to Favorites

- **Method / URL**: `POST /favorites/:productId`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (201 Created)**: Favorite record wrapped in `data`.

---

### 7.2 Remove Product from Favorites

- **Method / URL**: `DELETE /favorites/:productId`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Success message.

---

### 7.3 Get All Favorite Products

- **Method / URL**: `GET /favorites`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Array of populated product objects wrapped in `data`.

---

### 7.4 Check If Product is Favorite

- **Method / URL**: `GET /favorites/:productId/status`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: `{ "isFavorite": boolean }`

---

## 8. Cart Module (`/cart`)

### 8.1 Get Current Cart

Gets or initializes an active cart for the authenticated customer.

- **Method / URL**: `GET /cart`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Cart object wrapped in `data`.

---

### 8.2 Add Product to Cart

Adds or increments quantity of a product in the cart.

- **Method / URL**: `POST /cart`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: `{ "productId": string, "quantity": number }`
- **Response (200 OK)**: Updated cart object wrapped in `data`.

---

### 8.3 Remove Product from Cart

- **Method / URL**: `DELETE /cart/:productId`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Updated cart object wrapped in `data`.

---

### 8.4 Update Item Quantity in Cart

Directly overwrites the quantity of a product in the cart.

- **Method / URL**: `PATCH /cart/:productId`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: `{ "quantity": number }`
- **Response (200 OK)**: Updated cart object wrapped in `data`.

---

### 8.5 Clear Entire Cart

Removes all items from the cart.

- **Method / URL**: `DELETE /cart`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Success message.

---

## 9. Orders Module (`/orders`)

### 9.1 Create Order from Cart

Converts active cart items into pending order(s), locks price details, and empties the cart.
_Note: If the cart contains products from multiple restaurants, the system automatically splits checkout into separate Order documents (one per `restaurantId`) and returns an array of orders._

- **Method / URL**: `POST /orders`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field                       | Type    | Required    | Rules                                                               | Description                                |
  | :-------------------------- | :------ | :---------- | :------------------------------------------------------------------ | :----------------------------------------- |
  | `deliveryMethod`            | String  | Yes         | Enum: `'Home Delivery'` \| `'Store Pickup'`                         | Delivery preference                        |
  | `deliveryAddress`           | Object  | Conditional | Required if `Home Delivery`, must be omitted/null if `Store Pickup` | Delivery address details                   |
  | `deliveryAddress.addressId` | String  | Optional    | Valid User Address Mongo ID                                         | Use an existing saved address from profile |
  | `deliveryAddress.street`    | String  | Conditional | Required if `addressId` is not provided                             | Street address                             |
  | `deliveryAddress.city`      | String  | Conditional | Required if `addressId` is not provided                             | City                                       |
  | `deliveryAddress.country`   | String  | Conditional | Required if `addressId` is not provided                             | Country                                    |
  | `specialNotes`              | String  | No          | None                                                                | Special delivery/pickup instructions       |
  | `paymentMethod`             | String  | Yes         | Enum: `'Cash on Delivery'`                                          | Payment method                             |
  | `saveAddress`               | Boolean | No          | Boolean                                                             | Save new inline address to user profile    |

  _Request Example 1 (Home Delivery with inline address)_:

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

  _Request Example 2 (Home Delivery using saved profile `addressId`)_:

  ```json
  {
    "deliveryMethod": "Home Delivery",
    "deliveryAddress": {
      "addressId": "64b108506f6d5c001cfef310"
    },
    "specialNotes": "Leave at front door",
    "paymentMethod": "Cash on Delivery"
  }
  ```

  _Request Example 3 (Store Pickup)_:

  ```json
  {
    "deliveryMethod": "Store Pickup",
    "specialNotes": "Prepare it extra hot",
    "paymentMethod": "Cash on Delivery"
  }
  ```

- **Response (201 Created)**:
  ```json
  {
    "data": {
      "_id": "64b10dff6f6d5c001cfef35a",
      "userId": "64b0f9f36f6d5c001cfef2b8",
      "restaurantId": "64b0f9f36f6d5c001cfef2b0",
      "items": [
        {
          "productId": "64b100996f6d5c001cfef2ea",
          "title": "Fresh Organic Spinach",
          "price": 12,
          "discountedPrice": 7,
          "quantity": 2
        }
      ],
      "totalOriginalPrice": 24,
      "totalDiscount": 10,
      "finalTotalPrice": 14,
      "totalQuantity": 2,
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
      "paymentMethod": "Cash on Delivery",
      "status": "Pending",
      "createdAt": "2026-07-17T20:30:00.000Z",
      "updatedAt": "2026-07-17T20:30:00.000Z"
    }
  }
  ```

---

### 9.2 Get My Orders

Retrieves history list of orders placed by the active user.

- **Method / URL**: `GET /orders/me`
- **Auth Level**: Access Token (`customer`, `admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter      | Type   | Required | Description                          |
  | :------------- | :----- | :------- | :----------------------------------- |
  | `restaurantId` | String | No       | Filter orders by Restaurant ObjectId |

- **Response (200 OK)**: Array of order objects wrapped in `data`.

---

### 9.3 Get My Order Details

- **Method / URL**: `GET /orders/me/:id`
- **Auth Level**: Access Token (`customer`, `admin`, `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Single order object wrapped in `data`.

---

### 9.4 Get All Orders (Admin Only)

- **Method / URL**: `GET /orders`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter      | Type   | Required | Description                          |
  | :------------- | :----- | :------- | :----------------------------------- |
  | `restaurantId` | String | No       | Filter orders by Restaurant ObjectId |

- **Response (200 OK)**: Array of all order objects wrapped in `data`.

---

### 9.5 Get Restaurant Orders (Admin / Manager)

Retrieves orders associated with a specific restaurant. Managers can only query their own assigned `restaurantId`.

- **Method / URL**: `GET /orders/restaurant/:restaurantId`
- **Auth Level**: Access Token (`admin` or `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Array of restaurant order objects wrapped in `data`.

---

### 9.6 Update Order Status (Admin Only)

Updates the lifecycle state of an order. Finalized orders (`Delivered` or `Cancelled`) can no longer have their status modified.

- **Method / URL**: `PATCH /orders/:id/status`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field    | Type   | Required | Rules                                                                                               | Description              |
  | :------- | :----- | :------- | :-------------------------------------------------------------------------------------------------- | :----------------------- |
  | `status` | String | Yes      | Enum: `'Pending' \| 'Confirmed' \| 'Preparing' \| 'Out For Delivery' \| 'Delivered' \| 'Cancelled'` | New status for the order |

  _Request Example_:

  ```json
  {
    "status": "Confirmed"
  }
  ```

- **Response (200 OK)**: Updated order object wrapped in `data`.

---

## 10. Restaurant Module (`/restaurants`)

### 10.1 Create Restaurant

Creates a new restaurant record and assigns an owner manager user.

- **Method / URL**: `POST /restaurants`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field         | Type   | Required | Description                                    |
  | :------------ | :----- | :------- | :--------------------------------------------- |
  | `name`        | String | Yes      | Restaurant name                                |
  | `ownerUserId` | String | Yes      | User ObjectId of the manager/owner             |
  | `description` | String | No       | Brief description                              |
  | `phone`       | String | No       | Restaurant contact number                      |
  | `address`     | Object | No       | Location address (`street`, `city`, `country`) |

  _Request Example_:

  ```json
  {
    "name": "Bella Italia",
    "ownerUserId": "64b0fc086f6d5c001cfef2c2",
    "description": "Authentic Italian restaurant",
    "phone": "+1122334455",
    "address": {
      "street": "15 Roma St",
      "city": "Cairo",
      "country": "Egypt"
    }
  }
  ```

- **Response (201 Created)**:
  ```json
  {
    "data": {
      "_id": "64b0f9f36f6d5c001cfef2b0",
      "name": "Bella Italia",
      "ownerUserId": "64b0fc086f6d5c001cfef2c2",
      "description": "Authentic Italian restaurant",
      "phone": "+1122334455",
      "address": {
        "street": "15 Roma St",
        "city": "Cairo",
        "country": "Egypt"
      },
      "isActive": true,
      "isDeleted": false,
      "createdAt": "2026-07-18T19:50:00.000Z",
      "updatedAt": "2026-07-18T19:50:00.000Z"
    }
  }
  ```

---

### 10.2 Get All Restaurants (Paginated)

- **Method / URL**: `GET /restaurants`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter | Type   | Required | Default | Description                  |
  | :-------- | :----- | :------- | :------ | :--------------------------- |
  | `page`    | String | No       | `1`     | Page number                  |
  | `limit`   | String | No       | `10`    | Page size                    |
  | `search`  | String | No       | _None_  | Restaurant name search query |

- **Response (200 OK)**: Paginated restaurant list wrapped in `data`.

---

### 10.3 Get My Restaurant

Returns the restaurant details linked to the authenticated manager's `restaurantId`.

- **Method / URL**: `GET /restaurants/me`
- **Auth Level**: Access Token (`manager` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Single restaurant object wrapped in `data`.

---

### 10.4 Get Restaurant by ID

- **Method / URL**: `GET /restaurants/:id`
- **Auth Level**: Access Level: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Single restaurant object wrapped in `data`.

---

### 10.5 Update Restaurant

Updates restaurant details. Managers can only update their own assigned restaurant.

- **Method / URL**: `PATCH /restaurants/:id`
- **Auth Level**: Access Token (`admin`, or `manager` for own restaurant)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: Accepts optional fields (`name`, `description`, `phone`, `address`, `isActive`, `logoUrl`).

- **Response (200 OK)**: Updated restaurant object wrapped in `data`.

---

### 10.6 Delete Restaurant (Soft Delete)

- **Method / URL**: `DELETE /restaurants/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "message": "Restaurant deleted successfully"
  }
  ```

---

---

## 11. Offers Module (`/offers`)

### 11.1 Create Offer

Creates a new product offer / discount promotion for a restaurant.

- **Method / URL**: `POST /offers`
- **Auth Level**: Access Token (`manager` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:

  | Field                | Type    | Required | Rules                          | Description                      |
  | :------------------- | :------ | :------- | :----------------------------- | :------------------------------- |
  | `productId`          | String  | Yes      | Valid Product ObjectId         | Target product                   |
  | `discountPercentage` | Number  | Yes      | Min 1, Max 100                 | Percentage discount rate         |
  | `startDate`          | String  | Yes      | Valid ISO Date or `YYYY-MM-DD` | Start date of offer promotion    |
  | `endDate`            | String  | Yes      | Valid ISO Date or `YYYY-MM-DD` | Expiration date of offer         |
  | `featured`           | Boolean | No       | Boolean                        | Set as featured promotional item |

  _Request Example_:

  ```json
  {
    "productId": "64b100996f6d5c001cfef2ea",
    "discountPercentage": 25,
    "startDate": "2026-07-20T00:00:00.000Z",
    "endDate": "2026-07-27T23:59:59.000Z",
    "featured": true
  }
  ```

- **Response (201 Created)**: Created offer object wrapped in `data`.

---

### 11.2 Get Active Offers (Public)

Retrieves a paginated list of currently active promotional offers.

- **Method / URL**: `GET /offers/active`
- **Auth Level**: Public
- **Query Parameters**:

  | Parameter | Type   | Required | Default | Description |
  | :-------- | :----- | :------- | :------ | :---------- |
  | `page`    | String | No       | `1`     | Page number |
  | `limit`   | String | No       | `10`    | Page size   |

- **Response (200 OK)**: Paginated active offers list wrapped in `data`.

---

### 11.3 Get Active Offer by ID (Public)

- **Method / URL**: `GET /offers/active/:id`
- **Auth Level**: Public
- **Response (200 OK)**: Single active offer details wrapped in `data`.

---

### 11.4 Get Restaurant Offers (Manager)

Retrieves all promotional offers created for the logged-in manager's restaurant.

- **Method / URL**: `GET /offers`
- **Auth Level**: Access Token (`manager` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**:

  | Parameter   | Type   | Required | Default | Description                                                     |
  | :---------- | :----- | :------- | :------ | :-------------------------------------------------------------- |
  | `status`    | String | No       | _None_  | `'draft' \| 'scheduled' \| 'active' \| 'expired' \| 'cancelled'`|
  | `productId` | String | No       | _None_  | Filter by Product ObjectId                                      |
  | `source`    | String | No       | _None_  | `'manual' \| 'ai_recommendation'`                               |
  | `page`      | String | No       | `1`     | Page number                                                     |
  | `limit`     | String | No       | `10`    | Page size                                                       |

- **Response (200 OK)**: Paginated offers list wrapped in `data`.

---

### 11.5 Get Offer Details by ID (Manager)

- **Method / URL**: `GET /offers/:id`
- **Auth Level**: Access Token (`manager` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Single offer object wrapped in `data`.

---

### 11.6 Update Offer (Manager)

Updates an existing offer's attributes or status.

- **Method / URL**: `PATCH /offers/:id`
- **Auth Level**: Access Token (`manager` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**: Accepts optional fields (`productId`, `discountPercentage`, `startDate`, `endDate`, `featured`, `status`).

- **Response (200 OK)**: Updated offer object wrapped in `data`.

---

### 11.7 Cancel Offer (Manager)

Cancels an active or scheduled offer.

- **Method / URL**: `PATCH /offers/:id/cancel`
- **Auth Level**: Access Token (`manager` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Updated offer object with status set to `'cancelled'`.

---

## 12. End-to-End Shopping & Order Workflow

To execute a complete shopping & ordering lifecycle, follow this sequence:

1. **Create Restaurant** (Admin):
   - Call `POST /restaurants` to create a new Restaurant and assign a manager `ownerUserId`.
2. **Create Category & Product** (Admin):
   - Create categories using `POST /categories`.
   - Create products using `POST /products`, passing the required `restaurantId`.
3. **Create Promotional Offers** (Manager):
   - Restaurant managers create active discounts or promotions using `POST /offers` or update product discount prices via `PATCH /products/:id/discount`.
4. **Manage Saved Delivery Addresses** (Customer):
   - Add delivery addresses via `POST /auth/addresses` to build up user address profile.
5. **Add Products to Cart** (Customer):
   - Call `POST /cart` with `{ "productId": "<productId>", "quantity": 2 }`.
6. **Verify Cart Totals** (Customer):
   - Call `GET /cart` to see itemized and calculated cart summary.
7. **Place Order** (Customer):
   - Call `POST /orders` providing `deliveryMethod`, `deliveryAddress` (inline or `addressId`), `paymentMethod` (`"Cash on Delivery"`), and optional `saveAddress`.
   - _If cart contains products from multiple restaurants, the API automatically creates separate Order documents per `restaurantId`._
8. **Retrieve Orders**:
   - Customer: View orders via `GET /orders/me`.
   - Manager: View restaurant-specific orders via `GET /orders/restaurant/:restaurantId` or `GET /restaurants/me`.
   - Admin: View all orders via `GET /orders` or filter by `restaurantId`.
9. **Update Order Status** (Admin):
   - Admin updates lifecycle state via `PATCH /orders/:id/status`. Finalized orders (`Delivered` or `Cancelled`) can no longer be updated.
