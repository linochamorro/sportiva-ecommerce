# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Sportiva E-commerce** is a full-stack sports equipment e-commerce platform built as an academic project (UTP Integrador I). The architecture follows MVC pattern with DAO for backend, implementing SOLID principles. The frontend is vanilla HTML/CSS/JavaScript, and the backend is Node.js/Express with MySQL/MariaDB.

## Development Commands

### Backend (Node.js/Express)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Development mode (with nodemon)
npm run dev

# Production mode
npm start

# Run tests with coverage
npm test

# Watch mode for tests
npm run test:watch
```

### Frontend (Static HTML)

The frontend is served via Live Server or similar static server. Open `frontend/public/index.html` in a browser or use VS Code Live Server extension on port 5500.

### Database Setup

```bash
# Connect to MySQL/MariaDB
mysql -u root -p

# Initialize database and schema
mysql -u root -p < backend/scripts/sportiva_db.sql

# Load sample data
mysql -u root -p sportiva_db < backend/scripts/sportiva_data.sql
```

### Environment Configuration

1. Copy `.env.example` to `.env` in the backend directory
2. Configure database credentials and JWT secrets
3. Default port: 3000 (backend), 5500 (frontend via Live Server)

## Architecture Overview

### Backend Structure (MVC + DAO Pattern)

```
backend/src/
├── config/           # Database pool, JWT config, constants
├── controllers/      # HTTP request handlers (thin layer)
├── services/         # Business logic (SOLID principles)
├── models/           # DAO pattern - data access layer
│   └── BaseModel.js  # Inherited by all models for CRUD ops
├── routes/           # Express route definitions
├── middlewares/      # Auth, validation, error handling, rate limiting
├── validators/       # Express-validator schemas
└── utils/            # Logger, Excel/PDF generators
```

### Key Architectural Patterns

**1. DAO Pattern with BaseModel Inheritance**
- `BaseModel.js` provides generic CRUD operations
- All models (Cliente, Producto, Carrito, Pedido, Pago) extend BaseModel
- Models override `findById()` and add domain-specific methods
- Uses MySQL connection pool from `config/database.js`

**2. Service Layer (SOLID)**
- Services contain business logic, not controllers
- Controllers are thin wrappers that handle HTTP concerns
- Example: `authService.js` handles authentication, token generation, password hashing
- Services instantiate and use models

**3. JWT Authentication Flow**
- Frontend stores token in localStorage (`sportiva_token`)
- `apiConfig.js` attaches token to all requests via Authorization header
- `authMiddleware.js` verifies JWT on protected routes
- Automatic token refresh mechanism in frontend if near expiration

**4. Database Schema**
- Primary tables: CLIENTE, PRODUCTO, CATEGORIA, CARRITO, PEDIDO, PAGO
- Products support tallas (sizes) via TALLA_PRODUCTO junction table
- Carrito system: CARRITO → DETALLE_CARRITO → TALLA_PRODUCTO → PRODUCTO
- All foreign keys use ON DELETE CASCADE/RESTRICT appropriately

### Frontend Architecture

**Single Page Application (SPA-like) with vanilla JavaScript:**

```
frontend/
├── public/          # HTML pages (index, catalogo, carrito, checkout, etc.)
└── assets/
    ├── js/
    │   ├── apiConfig.js     # API client, JWT manager, HTTP interceptor
    │   ├── authService.js   # Login/register logic
    │   ├── carrito.js       # Cart page logic
    │   ├── catalogo.js      # Product listing
    │   ├── checkout.js      # Order creation
    │   └── main.js          # Global utilities, toast, navbar
    ├── css/
    └── images/
```

**API Integration Pattern:**
- All API calls go through `apiConfig.js` which provides:
  - `apiGet()`, `apiPost()`, `apiPut()`, `apiDelete()` methods
  - Automatic JWT token attachment
  - Token refresh on 401 responses
  - Global error handling and redirects

**Example API Call:**
```javascript
const productos = await apiGet(ENDPOINTS.PRODUCTOS.LISTAR, { categoria: 'Calzado' });
```

## Common Development Workflows

### Adding a New API Endpoint

1. **Model**: Add method to appropriate model in `backend/src/models/`
2. **Service**: Add business logic in `backend/src/services/`
3. **Validator**: Create validation schema in `backend/src/validators/`
4. **Controller**: Add controller method in `backend/src/controllers/`
5. **Route**: Register route in `backend/src/routes/`
6. **Frontend**: Add endpoint to `ENDPOINTS` in `frontend/assets/js/apiConfig.js`

### Database Schema Changes

1. Modify `backend/scripts/sportiva_db.sql`
2. Drop and recreate database (development only)
3. Update corresponding model classes
4. Update related services/controllers

### Testing

- Test files located in `backend/tests/`
- Jest is configured but minimal tests exist
- Test coverage report generated with `npm test`

## Important Implementation Details

### Authentication & Authorization

- Password hashing via bcryptjs (10 salt rounds)
- JWT token expires in 24h (configurable via `.env`)
- No role-based access control (all authenticated users are customers)
- Auth middleware validates JWT and attaches `req.cliente` to requests

### Cart System

- Each authenticated user has one active cart (`estado_carrito: 'Activo'`)
- Cart persists across sessions (database-backed, not session storage)
- Cart items link to TALLA_PRODUCTO, not directly to products
- When adding same talla, quantity increments instead of creating duplicate

### Error Handling

- Global error handler middleware in `middlewares/errorHandler.js`
- Logging via Winston (`utils/logger.js`) to console and file (`logs/`)
- API responses follow consistent format: `{ success: boolean, message: string, data?: any }`

### Rate Limiting

- General limiter: 100 requests per 15 minutes per IP
- Applied via `middlewares/rateLimiter.js`
- Configurable via `.env` variables

### CORS Configuration

- Allowed origins defined in `server.js`
- Development: allows localhost:5500, 127.0.0.1:5500, localhost:3000
- Credentials enabled for JWT cookies (though currently using localStorage)

## Project-Specific Conventions

- Database table names in UPPERCASE (CLIENTE, PRODUCTO, CARRITO)
- Primary keys follow pattern: `id_<table_name>` (e.g., `id_cliente`)
- Frontend uses Spanish for UI, code comments, and variables
- Backend uses Spanish for model names, English for technical terms
- Timestamps: Use MySQL `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- Enum values in Spanish: 'Activo', 'Inactivo', 'Pendiente', etc.

## Known Configuration Requirements

- **Node.js**: >=18.0.0, npm >=9.0.0 (specified in package.json)
- **Database**: MariaDB 10.4+ (XAMPP compatible)
- **CORS**: Frontend must run on port 5500 for default config
- **JWT_SECRET**: Must be set in `.env` for production

## Business Logic Constants

Located in `backend/.env.example`:
- IGV (Tax): 18%
- Shipping Lima: S/ 15.00
- Shipping Provincias: S/ 25.00
- Free shipping minimum: S/ 200.00
- Currency: S/ (Peruvian Sol)
