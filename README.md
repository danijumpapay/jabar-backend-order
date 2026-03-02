# jabar-backend-order

REST API backend untuk sistem order management **Kang Pajak** — layanan pengurusan pajak kendaraan bermotor berbasis web di Jawa Barat.

---

## Tech Stack

| Teknologi | Versi | Fungsi |
|---|---|---|
| Node.js | ≥ 18 | Runtime |
| TypeScript | ^5.0 | Language |
| Express.js | ^4.18 | HTTP Framework |
| Knex.js | 3.1.0 | Query Builder |
| Objection.js | 3.1.4 | ORM |
| PostgreSQL | - | Database |
| @jumpapay/jumpapay-models | ^8.3.0 | DB Models |
| Joi | ^17.9 | Request Validation |
| Pino | ^10.1 | Logger |
| Multer | ^1.4 | File Upload |
| JWT | ^9.0 | Auth |

---

## Struktur Project

```
jabar-backend-order/
├── index.ts                          # Entry point
├── knexfile.ts                       # Konfigurasi database
├── .env.example                      # Template environment variables
├── jabar-backend-order.postman_collection.json  # Postman collection
└── src/
    ├── config/
    │   ├── auth.ts                   # JWT secret
    │   ├── connection.ts             # Knex DB instance
    │   ├── integration.ts            # Axios instance (Sambara API)
    │   └── logger.ts                 # Pino logger
    ├── controllers/
    │   ├── catalog/                  # Services & Promos
    │   ├── document/                 # Upload dokumen
    │   ├── order/                    # CRUD order
    │   ├── vehicle/                  # Cek kendaraan
    │   └── voucher/                  # Validasi voucher
    ├── services/
    │   ├── order/                    # Business logic order
    │   ├── sambara/                  # Integrasi Sambara API
    │   ├── upload/                   # Object storage upload
    │   └── voucher/                  # Business logic voucher
    ├── routes/v1/
    │   ├── index.ts                  # Main router
    │   ├── orderRoutes.ts
    │   ├── voucherRoutes.ts
    │   ├── vehicleRoutes.ts
    │   ├── serviceRoutes.ts
    │   └── promoRoutes.ts
    ├── middlewares/
    │   ├── authMiddleware.ts         # JWT auth guard
    │   └── validationMiddleware.ts   # Joi validation
    ├── dataTypes/order/              # TypeScript interfaces
    └── utils/
        └── response.ts              # Helper response format
```

---

## API Endpoints

Base URL: `http://localhost:3001`

### Health Check
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Cek status server |

### Vehicle
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/v1/vehicle/check` | Cek info pajak kendaraan via Sambara |

### Vouchers
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/v1/vouchers/validate` | Validasi kode voucher |

### Services & Promos
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/services` | Daftar layanan aktif |
| `GET` | `/api/v1/promos` | Daftar promo aktif |

### Orders
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/v1/orders` | Buat order baru |
| `GET` | `/api/v1/orders/:bookingId` | Tracking order by bookingId |
| `GET` | `/api/v1/orders/:orderId/payment-status` | Cek status pembayaran |
| `PATCH` | `/api/v1/orders/:orderId/cancel` | Batalkan order |
| `POST` | `/api/v1/orders/:orderId/refund` | Ajukan refund |
| `POST` | `/api/v1/orders/:orderId/documents` | Upload KTP, STNK, BPKB |

---

## Instalasi & Menjalankan

### 1. Clone & Install

```bash
git clone git@github.com:danijumpapay/jabar-backend-order.git
cd jabar-backend-order
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` dan isi nilai berikut:

```env
PORT=3001

DB_HOST=127.0.0.1
DB_NAME=jumpapay
DB_USER=postgres
DB_PASSWORD=

JWTSECRET=your_jwt_secret

INTEGRATION_BASE_URL=https://your-integration-api.com

OBJECT_STORAGE_ACCESS_KEY_ID=
OBJECT_STORAGE_ACCESS_KEY_SECRET=
OBJECT_STORAGE_END_POINT=
OBJECT_STORAGE_PUBLIC_END_POINT=
OBJECT_STORAGE_BUCKET=

COMPANY_ID=your_company_id

LOG_LEVEL=info
```

### 3. Jalankan Development Server

```bash
pnpm dev
```

Server berjalan di: `http://localhost:3001`

### 4. Build Production

```bash
pnpm build
pnpm prod:start
```

---

## Testing dengan Postman

File collection sudah tersedia di root project:

```
jabar-backend-order.postman_collection.json
```

**Cara import:**
1. Buka Postman
2. Klik **Import**
3. Pilih file `jabar-backend-order.postman_collection.json`
4. Jalankan request sesuai urutan

> **Tip:** Request **Buat Order** sudah dilengkapi script otomatis yang menyimpan `orderId` dan `bookingId` ke Collection Variable — request selanjutnya langsung bisa digunakan tanpa copy-paste manual.

---

## Contoh Request & Response

### POST `/api/v1/orders`

**Request:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@email.com",
  "whatsapp": "081234567890",
  "nik": "3201234567890001",
  "plateNumber": "D1234ABC",
  "no_rangka": "MHFXX123456789",
  "serviceId": "1",
  "deliveryFee": 50000,
  "finalTotal": 350000,
  "address": "Jl. Sudirman No.1, Bandung",
  "paymentMethod": "BRI"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order berhasil dibuat",
  "results": {
    "orderId": "uuid-xxx-xxx",
    "bookingId": "KP20260302XXXX"
  }
}
```

---

### POST `/api/v1/orders/:orderId/documents`

Upload menggunakan `multipart/form-data`:

| Field | Tipe | Deskripsi |
|---|---|---|
| `ktp` | File | Foto KTP (JPG/PNG/PDF, max 10MB) |
| `stnk` | File | Foto STNK (JPG/PNG/PDF, max 10MB) |
| `bpkb` | File | Foto BPKB (JPG/PNG/PDF, max 10MB) |

---

## Format Response

Semua endpoint menggunakan format response yang konsisten:

**Success:**
```json
{
  "success": true,
  "message": "...",
  "results": { }
}
```

**Error:**
```json
{
  "success": false,
  "message": "...",
  "errors": [ ]
}
```

---

## Database Migration

```bash
# Jalankan semua migration
pnpm migrate

# Rollback migration terakhir
pnpm migrate:rollback

# Buat migration baru
pnpm migrate:make --name=nama_migration
```

> Database menggunakan schema yang sama dengan `jabar-bot-b2c` (shared DB via `@jumpapay/jumpapay-models`).

---

## Environment Variables

| Variable | Wajib | Deskripsi |
|---|---|---|
| `PORT` | ✅ | Port server (default: 3001) |
| `DB_HOST` | ✅ | Host PostgreSQL |
| `DB_NAME` | ✅ | Nama database |
| `DB_USER` | ✅ | Username database |
| `DB_PASSWORD` | ✅ | Password database |
| `JWTSECRET` | ✅ | Secret key JWT |
| `INTEGRATION_BASE_URL` | ✅ | Base URL integrasi (Sambara, Flip, dll) |
| `COMPANY_ID` | ✅ | ID company di Jumpapay |
| `OBJECT_STORAGE_*` | ⚠️ | Diperlukan untuk fitur upload dokumen |
| `LOG_LEVEL` | ❌ | Level log pino (default: info) |
