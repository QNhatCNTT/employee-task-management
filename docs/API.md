# Employee Task Management API Documentation

## Overview

Base URL: `http://localhost:3001/api`

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication

### Manager Login

**POST** `/auth/manager/login`

Request OTP for manager login.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:** `200 OK`
```json
{
  "message": "OTP sent successfully",
  "sessionId": "session_abc123"
}
```

---

### Verify OTP (Manager)

**POST** `/auth/manager/verify`

Verify OTP and receive JWT token.

**Request Body:**
```json
{
  "sessionId": "session_abc123",
  "otp": "123456"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "manager_001",
    "role": "manager",
    "phoneNumber": "+1234567890"
  }
}
```

---

### Employee Login

**POST** `/auth/employee/login`

Request OTP for employee login via email.

**Request Body:**
```json
{
  "email": "employee@company.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "OTP sent to email",
  "sessionId": "session_xyz789"
}
```

---

### Verify OTP (Employee)

**POST** `/auth/employee/verify`

**Request Body:**
```json
{
  "sessionId": "session_xyz789",
  "otp": "654321"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "emp_001",
    "role": "employee",
    "email": "employee@company.com"
  },
  "requiresSetup": true
}
```

---

## Employees

> **Note:** All employee endpoints require Manager authentication.

### List Employees

**GET** `/employees`

**Response:** `200 OK`
```json
[
  {
    "id": "emp_001",
    "name": "John Doe",
    "email": "john@company.com",
    "phone": "+1234567890",
    "department": "Engineering",
    "role": "Developer",
    "setupCompleted": true,
    "schedule": {
      "workDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "startTime": "09:00",
      "endTime": "17:00"
    },
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
]
```

---

### Create Employee

**POST** `/employees`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "phone": "+1987654321",
  "department": "Marketing",
  "role": "Manager",
  "schedule": {
    "workDays": ["Monday", "Tuesday", "Wednesday"],
    "startTime": "10:00",
    "endTime": "18:00"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "emp_002",
  "name": "Jane Smith",
  "email": "jane@company.com",
  "setupCompleted": false,
  ...
}
```

---

### Update Employee

**PUT** `/employees/:id`

**Request Body:** (partial update supported)
```json
{
  "department": "Sales",
  "role": "Senior Manager"
}
```

**Response:** `200 OK`
```json
{
  "id": "emp_002",
  "name": "Jane Smith",
  "department": "Sales",
  "role": "Senior Manager",
  ...
}
```

---

### Delete Employee

**DELETE** `/employees/:id`

**Response:** `204 No Content`

---

## Profile

> **Note:** Employee authentication required.

### Get My Profile

**GET** `/profile`

**Response:** `200 OK`
```json
{
  "id": "emp_001",
  "name": "John Doe",
  "email": "john@company.com",
  "phone": "+1234567890",
  "department": "Engineering",
  "role": "Developer",
  "schedule": {
    "workDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "startTime": "09:00",
    "endTime": "17:00"
  }
}
```

---

### Update My Profile

**PUT** `/profile`

**Request Body:**
```json
{
  "phone": "+1555555555",
  "schedule": {
    "workDays": ["Monday", "Tuesday", "Wednesday", "Thursday"],
    "startTime": "08:00",
    "endTime": "16:00"
  }
}
```

**Response:** `200 OK`

---

## Real-time Chat (Socket.io)

### Connection

Connect to `http://localhost:3001` with Socket.io client.

**Auth:**
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
```

### Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join-chat` | Client → Server | `{ chatId }` | Join a chat room |
| `leave-chat` | Client → Server | `{ chatId }` | Leave a chat room |
| `send-message` | Client → Server | `{ chatId, content }` | Send a message |
| `receive-message` | Server → Client | `Message` | Receive new message |
| `message-history` | Server → Client | `Message[]` | Initial message history |
| `typing` | Client → Server | `{ chatId }` | Start typing indicator |
| `stop-typing` | Client → Server | `{ chatId }` | Stop typing indicator |
| `user-typing` | Server → Client | `{ userId, name }` | User is typing |
| `user-stop-typing` | Server → Client | `{ userId }` | User stopped typing |
| `message-read` | Client → Server | `{ chatId }` | Mark messages as read |
| `messages-read` | Server → Client | `{}` | Messages were read |
| `load-more` | Client → Server | `{ chatId, beforeTimestamp }` | Load older messages |
| `more-messages` | Server → Client | `Message[]` | Older messages |
| `error` | Server → Client | `{ message }` | Error occurred |

### Message Object

```json
{
  "id": "msg_001",
  "chatId": "chat_manager_emp001",
  "senderId": "manager_001",
  "senderName": "Manager",
  "content": "Hello!",
  "timestamp": "2026-01-15T10:30:00Z",
  "read": false
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
