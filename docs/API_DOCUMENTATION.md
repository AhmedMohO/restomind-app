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
*Note: For single errors, `"message"` is a string instead of an array of strings.*

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

### User Schema
```typescript
interface User {
  _id: string;                  // ObjectId
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'customer' | 'manager';
  gender: 'male' | 'female';    // Optional
  phone: string;                // Encrypted on DB, plain string on API boundaries
  isEmailVerified: boolean;
  DOB?: string;                 // ISO Date String
  image?: Image;                // Profile picture object
  isDeleted: boolean;
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

interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalOriginalPrice: number;
  totalDiscount: number;
  finalTotalPrice: number;
  totalQuantity: number;
  paymentMethod: 'CASH';
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
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
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `firstName` | String | Yes | Min length 3, max length 20 | User's first name |
  | `lastName` | String | Yes | Min length 3, max length 20 | User's last name |
  | `email` | String | Yes | Must be valid email format | Unique email address |
  | `password` | String | Yes | Min length 6 | Security password |
  | `phone` | String | No | Valid phone number format | Contact number |
  | `gender` | String | No | Must be `'male'` or `'female'` | User's gender |
  | `DOB` | String | No | ISO Date format (`YYYY-MM-DD`) | Date of birth |
  | `role` | String | No | Must be one of `RolesEnum` | Default is `'customer'` |

  *Request Example*:
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
  *Returns the newly created user object (excluding password).*
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
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `email` | String | Yes | Valid email format | User's email |
  | `password` | String | Yes | Min length 6 | User's password |

  *Request Example*:
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
  *Returns the active user object.*
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
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `email` | String | Yes | Verified email address |
  | `otp` | String | Yes | 6-digit OTP code |

  *Request Example*:
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
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `email` | String | Yes | Valid email | Target email |
  | `type` | String | Yes | `'confirmation'` or `'forgetPassword'` | Type of OTP flow |

  *Request Example*:
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

### 3.7 Forget Password
Generates password reset OTP code and emails it to the user.
- **Method / URL**: `POST /auth/forget-password`
- **Auth Level**: Public
- **Request Body (`application/json`)**:
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `email` | String | Yes | Account email address |

  *Request Example*:
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
Verifies the password reset OTP.
- **Method / URL**: `PATCH /auth/confirm-reset-otp`
- **Auth Level**: Access Token (`admin` or `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `otp` | String | Yes | 6-digit OTP code |

  *Request Example*:
  ```json
  {
    "otp": "459012"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "message": "Reset OTP confirmed successfully"
  }
  ```

---

### 3.10 Reset Password
Updates the password for the user. (Revokes all previous session tokens on completion).
- **Method / URL**: `PATCH /auth/reset-password`
- **Auth Level**: Access Token (`admin` or `customer`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `password` | String | Yes | Min length 6 | New password |
  | `confirmPassword`| String | Yes | Min length 6 | Must match `password` |

  *Request Example*:
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
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `firstName` | String | No | Min length 3, max length 20 | Updated first name |
  | `lastName` | String | No | Min length 3, max length 20 | Updated last name |
  | `phone` | String | No | Valid phone number | Updated phone number |
  | `gender` | String | No | `'male'` or `'female'` | Updated gender |
  | `DOB` | String | No | Date format | Updated Date of Birth |
  | `image` | File | No | Image mimetype format | Profile photo file upload |

- **Response (200 OK)**:
  *Returns the updated user object.*
  ```json
  {
    "_id": "64b0f9f36f6d5c001cfef2b8",
    "firstName": "Johnny",
    "lastName": "Doey",
    "email": "johndoe@example.com",
    "role": "customer",
    "gender": "male",
    "phone": "+1987654321",
    "isEmailVerified": true,
    "image": {
      "public_id": "restomind/users/64b0f9f36f6d5c001cfef2b8/avatar",
      "secure_url": "https://res.cloudinary.com/demo/image/upload/v12345/restomind/users/avatar.jpg"
    },
    "isDeleted": false,
    "createdAt": "2026-07-17T18:40:00.000Z",
    "updatedAt": "2026-07-17T18:50:00.000Z"
  }
  ```

---

## 4. User Management Module (`/users`)

### 4.1 Create User (Admin / Manager)
- **Method / URL**: `POST /users`
- **Auth Level**: Access Token (`admin` or `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `firstName` | String | Yes | Min length 3, max length 20 | First name |
  | `lastName` | String | Yes | Min length 3, max length 20 | Last name |
  | `email` | String | Yes | Valid email | Unique email |
  | `password` | String | Yes | Min length 6 | Password |
  | `phone` | String | Yes | Valid phone number | Mobile number |
  | `role` | String | No | `'admin' \| 'customer' \| 'manager'` | Default is `'customer'` |
  | `gender` | String | No | `'male' \| 'female'` | Gender |
  | `DOB` | String | No | ISO Date string | Date of Birth |

  *Request Example*:
  ```json
  {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "janedoe@example.com",
    "password": "securepassword456",
    "phone": "+1555555555",
    "role": "manager",
    "gender": "female"
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
  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `page` | String | No | `1` | Page number |
  | `limit` | String | No | `10` | Size of page result |
  | `search` | String | No | *None* | Match first/last name or email (case-insensitive) |
  | `role` | String | No | *None* | Filter by role |
  | `sort` | String | No | `createdAt` | Sort attribute |
  | `order` | String | No | `desc` | `'asc'` or `'desc'` |

- **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "_id": "64b0f9f36f6d5c001cfef2b8",
        "firstName": "John",
        "lastName": "Doe",
        "email": "johndoe@example.com",
        "role": "customer",
        "gender": "male",
        "phone": "+1234567890",
        "isEmailVerified": true,
        "isDeleted": false,
        "createdAt": "2026-07-17T18:40:00.000Z",
        "updatedAt": "2026-07-17T18:45:00.000Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
  ```

---

### 4.3 Find User by ID
- **Method / URL**: `GET /users/:id`
- **Auth Level**: Access Token (`admin` or `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "data": {
      "_id": "64b0f9f36f6d5c001cfef2b8",
      "firstName": "John",
      "lastName": "Doe",
      "email": "johndoe@example.com",
      "role": "customer",
      "gender": "male",
      "phone": "+1234567890",
      "isEmailVerified": true,
      "isDeleted": false,
      "createdAt": "2026-07-17T18:40:00.000Z",
      "updatedAt": "2026-07-17T18:45:00.000Z"
    }
  }
  ```

---

### 4.4 Update User by ID
- **Method / URL**: `PATCH /users/:id`
- **Auth Level**: Access Token (`admin` or `manager`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `firstName` | String | No | First name |
  | `lastName` | String | No | Last name |
  | `phone` | String | No | Phone number |
  | `gender` | String | No | `'male' \| 'female'` |
  | `DOB` | String | No | ISO Date String |
  | `role` | String | No | `'admin' \| 'customer' \| 'manager'` |

  *Request Example*:
  ```json
  {
    "firstName": "Jane Modified",
    "phone": "+1444444444"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "data": {
      "_id": "64b0fc086f6d5c001cfef2c2",
      "firstName": "Jane Modified",
      "lastName": "Doe",
      "email": "janedoe@example.com",
      "role": "manager",
      "gender": "female",
      "phone": "+1444444444",
      "isEmailVerified": false,
      "isDeleted": false,
      "createdAt": "2026-07-17T18:55:00.000Z",
      "updatedAt": "2026-07-17T19:00:00.000Z"
    }
  }
  ```

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
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `name` | String | Yes | Unique category name | Category title |
  | `description` | String | Yes | None | Category explanation |
  | `image` | File | Yes | Image format (png, jpg, etc.) | Category icon / photo file |

- **Response (201 Created)**:
  ```json
  {
    "data": {
      "_id": "64b0feaa6f6d5c001cfef2d0",
      "name": "Fresh Vegetables",
      "description": "Organic farm-fresh green vegetables and herbs.",
      "image": {
        "public_id": "restomind/categories/64b0feaa6f6d5c001cfef2d0/icon",
        "secure_url": "https://res.cloudinary.com/demo/image/upload/v123/categories/veg.jpg"
      },
      "isDeleted": false,
      "createdAt": "2026-07-17T19:10:00.000Z",
      "updatedAt": "2026-07-17T19:10:00.000Z"
    }
  }
  ```

---

### 5.2 Update Category
- **Method / URL**: `PATCH /categories/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**:
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `name` | String | No | Updated category name |
  | `description`| String | No | Updated category description |
  | `image` | File | No | New image file replacing old image |

- **Response (200 OK)**:
  ```json
  {
    "data": {
      "_id": "64b0feaa6f6d5c001cfef2d0",
      "name": "Organic Farm Vegetables",
      "description": "100% organic farm-fresh greens.",
      "image": {
        "public_id": "restomind/categories/64b0feaa6f6d5c001cfef2d0/icon",
        "secure_url": "https://res.cloudinary.com/demo/image/upload/v456/categories/veg_new.jpg"
      },
      "isDeleted": false,
      "createdAt": "2026-07-17T19:10:00.000Z",
      "updatedAt": "2026-07-17T19:15:00.000Z"
    }
  }
  ```

---

### 5.3 Delete Category (Soft Delete)
Deletes the category metadata and its remote file assets.
- **Method / URL**: `DELETE /categories/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "message": "Category deleted successfully"
  }
  ```

---

### 5.4 View All Categories
- **Method / URL**: `GET /categories`
- **Auth Level**: Public (No auth headers required)
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "_id": "64b0feaa6f6d5c001cfef2d0",
        "name": "Organic Farm Vegetables",
        "description": "100% organic farm-fresh greens.",
        "image": {
          "public_id": "restomind/categories/64b0feaa6f6d5c001cfef2d0/icon",
          "secure_url": "https://res.cloudinary.com/demo/image/upload/v456/categories/veg_new.jpg"
        },
        "isDeleted": false,
        "createdAt": "2026-07-17T19:10:00.000Z",
        "updatedAt": "2026-07-17T19:15:00.000Z"
      }
    ]
  }
  ```

---

### 5.5 Get Category by ID
- **Method / URL**: `GET /categories/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "data": {
      "_id": "64b0feaa6f6d5c001cfef2d0",
      "name": "Organic Farm Vegetables",
      "description": "100% organic farm-fresh greens.",
      "image": {
        "public_id": "restomind/categories/64b0feaa6f6d5c001cfef2d0/icon",
        "secure_url": "https://res.cloudinary.com/demo/image/upload/v456/categories/veg_new.jpg"
      },
      "isDeleted": false,
      "createdAt": "2026-07-17T19:10:00.000Z",
      "updatedAt": "2026-07-17T19:15:00.000Z"
    }
  }
  ```

---

## 6. Products Module (`/products`)

### 6.1 Create Product
- **Method / URL**: `POST /products`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**:
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `title` | String | Yes | None | Product title |
  | `description` | String | Yes | None | Brief product description |
  | `longDescription` | String | Yes | None | Full detail product info |
  | `price` | Number | Yes | Min 0 | Default selling price |
  | `discountedPrice` | Number | No | Min 0, Must be <= `price` | Discount price. Defaults to `price` if omitted. |
  | `category` | String | Yes | Valid Category ObjectId | Associated category |
  | `freshnessWindow` | Number | Yes | Min 0 | Duration (in days) the product stays fresh |
  | `tags` | String or Array | No | String containing comma-separated tags or array | Tags for searches (e.g. `'organic, green, spinach'`) |
  | `isBestseller` | Boolean | No | Converts string `'true'` / `'false'` | Bestseller flag |
  | `isAvailable` | Boolean | No | Converts string `'true'` / `'false'` | Availability flag |
  | `image` | File | Yes | Image mimetype | Product photograph |

- **Response (201 Created)**:
  ```json
  {
    "data": {
      "_id": "64b100996f6d5c001cfef2ea",
      "title": "Fresh Organic Spinach",
      "description": "Rich in iron, fresh green spinach leaves.",
      "longDescription": "Harvested early in the morning and delivered straight to your door. Great for salads and cooking.",
      "price": 10,
      "discountedPrice": 8.5,
      "rating": 0,
      "reviewsCount": 0,
      "isBestseller": true,
      "isAvailable": true,
      "image": {
        "public_id": "restomind/products/64b100996f6d5c001cfef2ea/photo",
        "secure_url": "https://res.cloudinary.com/demo/image/upload/v1/products/spinach.jpg"
      },
      "category": "64b0feaa6f6d5c001cfef2d0",
      "freshnessWindow": 5,
      "tags": ["organic", "green", "spinach"],
      "isDeleted": false,
      "createdAt": "2026-07-17T19:30:00.000Z",
      "updatedAt": "2026-07-17T19:30:00.000Z"
    }
  }
  ```

---

### 6.2 Update Product
- **Method / URL**: `PATCH /products/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`multipart/form-data`)**:
  *Accepts all fields from "Create Product" as optional values, plus an optional replacement image file.*

- **Response (200 OK)**:
  ```json
  {
    "data": {
      "_id": "64b100996f6d5c001cfef2ea",
      "title": "Fresh Organic Spinach",
      "description": "Rich in iron, fresh green spinach leaves.",
      "longDescription": "Harvested early in the morning and delivered straight to your door.",
      "price": 12,
      "discountedPrice": 10,
      "rating": 4.5,
      "reviewsCount": 12,
      "isBestseller": true,
      "isAvailable": true,
      "image": {
        "public_id": "restomind/products/64b100996f6d5c001cfef2ea/photo",
        "secure_url": "https://res.cloudinary.com/demo/image/upload/v2/products/spinach_new.jpg"
      },
      "category": "64b0feaa6f6d5c001cfef2d0",
      "freshnessWindow": 5,
      "tags": ["organic", "green", "spinach"],
      "isDeleted": false,
      "createdAt": "2026-07-17T19:30:00.000Z",
      "updatedAt": "2026-07-17T19:40:00.000Z"
    }
  }
  ```

---

### 6.3 Delete Product (Soft Delete)
- **Method / URL**: `DELETE /products/:id`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "message": "Product deleted successfully"
  }
  ```

---

### 6.4 Change Availability
Directly toggle availability state of a product.
- **Method / URL**: `PATCH /products/:id/availability`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `isAvailable` | Boolean | Yes | Availability state flag |

  *Request Example*:
  ```json
  {
    "isAvailable": false
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "data": {
      "_id": "64b100996f6d5c001cfef2ea",
      "title": "Fresh Organic Spinach",
      "isAvailable": false,
      "price": 12,
      "discountedPrice": 10
      // ...other fields
    }
  }
  ```

---

### 6.5 Update Discount
Sets the discounted price of a product.
- **Method / URL**: `PATCH /products/:id/discount`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `discountedPrice` | Number | Yes | Min 0, <= product price | New discounted price |

  *Request Example*:
  ```json
  {
    "discountedPrice": 7.00
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "data": {
      "_id": "64b100996f6d5c001cfef2ea",
      "price": 12,
      "discountedPrice": 7,
      "isAvailable": false
      // ...other fields
    }
  }
  ```

---

### 6.6 Get All Products (Filtered & Paginated)
- **Method / URL**: `GET /products`
- **Auth Level**: Public
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `page` | String | No | `1` | Page index |
  | `limit` | String | No | `10` | Items count per page |
  | `category` | String | No | *None* | Filter by Category ObjectId |
  | `search` | String | No | *None* | Partial title match |
  | `tag` | String | No | *None* | Tag keyword match |
  | `sort` | String | No | `createdAt` | Sort attribute |
  | `order` | String | No | `desc` | `'asc'` or `'desc'` |

- **Response (200 OK)**:
  *Returns items array where category field is populated as Category object.*
  ```json
  {
    "items": [
      {
        "_id": "64b100996f6d5c001cfef2ea",
        "title": "Fresh Organic Spinach",
        "description": "Rich in iron, fresh green spinach leaves.",
        "longDescription": "Harvested early in the morning and delivered straight to your door.",
        "price": 12,
        "discountedPrice": 7,
        "rating": 4.5,
        "reviewsCount": 12,
        "isBestseller": true,
        "isAvailable": true,
        "image": {
          "public_id": "restomind/products/spinach/photo",
          "secure_url": "https://res.cloudinary.com/demo/image/upload/v1/spinach.jpg"
        },
        "category": {
          "_id": "64b0feaa6f6d5c001cfef2d0",
          "name": "Organic Farm Vegetables",
          "description": "100% organic farm-fresh greens.",
          "image": {
            "public_id": "restomind/categories/veg",
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v1/veg.jpg"
          }
        },
        "freshnessWindow": 5,
        "tags": ["organic", "green", "spinach"],
        "isDeleted": false,
        "createdAt": "2026-07-17T19:30:00.000Z",
        "updatedAt": "2026-07-17T19:40:00.000Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
  ```

---

### 6.7 Get Recommended Discounted Products
Gets a list of products that currently have an active discount (where `discountedPrice < price`).
- **Method / URL**: `GET /products/recommendations`
- **Auth Level**: Public
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `page` | String | No | `1` | Page index |
  | `limit` | String | No | `10` | Items count per page |

- **Response (200 OK)**:
  *Returns standard paginated schema with populated category object.*
  ```json
  {
    "items": [
      {
        "_id": "64b100996f6d5c001cfef2ea",
        "title": "Fresh Organic Spinach",
        "price": 12,
        "discountedPrice": 7,
        "category": {
          "_id": "64b0feaa6f6d5c001cfef2d0",
          "name": "Organic Farm Vegetables"
          // ...other category fields
        }
        // ...other product fields
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
  ```

---

### 6.8 Get Product Details
- **Method / URL**: `GET /products/:id`
- **Auth Level**: Public
- **Response (200 OK)**:
  *Returns the product populated with its Category object.*
  ```json
  {
    "data": {
      "_id": "64b100996f6d5c001cfef2ea",
      "title": "Fresh Organic Spinach",
      "price": 12,
      "discountedPrice": 7,
      "category": {
        "_id": "64b0feaa6f6d5c001cfef2d0",
        "name": "Organic Farm Vegetables",
        "description": "100% organic farm-fresh greens.",
        "image": {
          "public_id": "restomind/categories/veg",
          "secure_url": "https://res.cloudinary.com/demo/image/upload/v1/veg.jpg"
        }
      },
      "freshnessWindow": 5,
      "tags": ["organic", "green", "spinach"]
      // ...other fields
    }
  }
  ```

---

## 7. Favorites Module (`/favorites`)

### 7.1 Add Product to Favorites
- **Method / URL**: `POST /favorites/:productId`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (201 Created)**:
  ```json
  {
    "data": {
      "_id": "64b104996f6d5c001cfef2fb",
      "userId": "64b0f9f36f6d5c001cfef2b8",
      "productId": "64b100996f6d5c001cfef2ea",
      "createdAt": "2026-07-17T20:00:00.000Z",
      "updatedAt": "2026-07-17T20:00:00.000Z"
    }
  }
  ```

---

### 7.2 Remove Product from Favorites
- **Method / URL**: `DELETE /favorites/:productId`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "message": "Product removed from favorites"
  }
  ```

---

### 7.3 Get All Favorite Products
- **Method / URL**: `GET /favorites`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  *Returns an array of populated product details within data field (removes any deleted product associations).*
  ```json
  {
    "data": [
      {
        "_id": "64b100996f6d5c001cfef2ea",
        "title": "Fresh Organic Spinach",
        "price": 12,
        "discountedPrice": 7,
        "category": {
          "_id": "64b0feaa6f6d5c001cfef2d0",
          "name": "Organic Farm Vegetables"
        }
        // ...other product fields
      }
    ]
  }
  ```

---

### 7.4 Check If Product is Favorite
- **Method / URL**: `GET /favorites/:productId/status`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "isFavorite": true
  }
  ```

---

## 8. Cart Module (`/cart`)

### 8.1 Get Current Cart
Gets or initializes an active cart for the authenticated customer. Returns item-level calculations and overall cart summary totals.
- **Method / URL**: `GET /cart`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "data": {
      "_id": "64b108506f6d5c001cfef310",
      "userId": "64b0f9f36f6d5c001cfef2b8",
      "items": [
        {
          "product": {
            "_id": "64b100996f6d5c001cfef2ea",
            "title": "Fresh Organic Spinach",
            "description": "Rich in iron, fresh green spinach leaves.",
            "price": 12,
            "discountedPrice": 7,
            "image": {
              "public_id": "restomind/products/spinach/photo",
              "secure_url": "https://res.cloudinary.com/demo/image/upload/v1/spinach.jpg"
            },
            "isAvailable": true
          },
          "quantity": 2,
          "unitPrice": 12,
          "discountedPrice": 7,
          "totalItemPrice": 14
        }
      ],
      "totalQuantity": 2,
      "totalOriginalPrice": 24,
      "totalDiscount": 10,
      "finalTotalPrice": 14
    }
  }
  ```

---

### 8.2 Add Product to Cart
Adds or increments quantity of a product in the cart.
- **Method / URL**: `POST /cart`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `productId` | String | Yes | Valid Product ObjectId | Product to add |
  | `quantity` | Number | Yes | Min 1 integer | Quantity to append |

  *Request Example*:
  ```json
  {
    "productId": "64b100996f6d5c001cfef2ea",
    "quantity": 2
  }
  ```

- **Response (200 OK)**:
  *Returns the updated cart object.*
  *(Matches the response format in `GET /cart`)*

---

### 8.3 Remove Product from Cart
- **Method / URL**: `DELETE /cart/:productId`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  *Returns the updated cart object.*
  *(Matches the response format in `GET /cart`)*

---

### 8.4 Update Item Quantity in Cart
Directly overwrites the quantity of a product in the cart.
- **Method / URL**: `PATCH /cart/:productId`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `quantity` | Number | Yes | Min 1 integer | Absolute target quantity |

  *Request Example*:
  ```json
  {
    "quantity": 5
  }
  ```

- **Response (200 OK)**:
  *Returns the updated cart object.*
  *(Matches the response format in `GET /cart`)*

---

### 8.5 Clear Entire Cart
Removes all items from the cart.
- **Method / URL**: `DELETE /cart`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "message": "Cart cleared successfully"
  }
  ```

---

## 9. Orders Module (`/orders`)

### 9.1 Create Order from Cart
Converts active cart items into a pending order, locks price details, and empties the cart.
- **Method / URL**: `POST /orders`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**: *None (Send empty object `{}`)*
- **Response (201 Created)**:
  ```json
  {
    "data": {
      "_id": "64b10dff6f6d5c001cfef35a",
      "userId": "64b0f9f36f6d5c001cfef2b8",
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
      "paymentMethod": "CASH",
      "status": "Pending",
      "createdAt": "2026-07-17T20:30:00.000Z",
      "updatedAt": "2026-07-17T20:30:00.000Z"
    }
  }
  ```

---

### 9.2 Get My Orders
Retrieves history list of orders placed by the active customer.
- **Method / URL**: `GET /orders/me`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "_id": "64b10dff6f6d5c001cfef35a",
        "userId": "64b0f9f36f6d5c001cfef2b8",
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
        "paymentMethod": "CASH",
        "status": "Pending",
        "createdAt": "2026-07-17T20:30:00.000Z",
        "updatedAt": "2026-07-17T20:30:00.000Z"
      }
    ]
  }
  ```

---

### 9.3 Get My Order Details
- **Method / URL**: `GET /orders/me/:id`
- **Auth Level**: Access Token (`customer` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  *Returns single order object (matches format in `GET /orders/me`).*

---

### 9.4 Get All Orders (Admin Only)
- **Method / URL**: `GET /orders`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "_id": "64b10dff6f6d5c001cfef35a",
        "userId": "64b0f9f36f6d5c001cfef2b8",
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
        "paymentMethod": "CASH",
        "status": "Pending",
        "createdAt": "2026-07-17T20:30:00.000Z",
        "updatedAt": "2026-07-17T20:30:00.000Z"
      }
    ]
  }
  ```

---

### 9.5 Update Order Status (Admin Only)
Updates the lifecycle state of an order. Finalized orders (`Delivered` or `Cancelled`) can no longer have their status modified.
- **Method / URL**: `PATCH /orders/:id/status`
- **Auth Level**: Access Token (`admin` only)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body (`application/json`)**:
  | Field | Type | Required | Rules | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `status` | String | Yes | Enum: `'Pending' \| 'Confirmed' \| 'Preparing' \| 'Out For Delivery' \| 'Delivered' \| 'Cancelled'` | New status for the order |

  *Request Example*:
  ```json
  {
    "status": "Confirmed"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "data": {
      "_id": "64b10dff6f6d5c001cfef35a",
      "status": "Confirmed",
      "totalOriginalPrice": 24,
      "totalDiscount": 10,
      "finalTotalPrice": 14
      // ...other order fields
    }
  }
  ```
