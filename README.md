# Sports Academy Management Application (Academy Desk)

A clean, maintainable web application foundation for sports academy management built with Next.js App Router, Tailwind CSS, and MongoDB with Mongoose.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication**: Password hashing (`bcryptjs`), HMAC-SHA256 signed sessions stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies
- **Testing**: Built-in Node test runner (`node:test`)

## Architecture & Authentication

### 1. Data Models (`models/`)
- **User (`models/User.ts`)**: Supports `player`, `coach`, and `scout` roles. Includes unique indexed email, validated password hash (hidden by default on queries with `select: false`), and timestamps.
- **Player (`models/Player.ts`)**: Linked to User via `userId` (unique index), storing sport, position, jersey number, active status, and player bio.

### 2. Role Model & Security Boundaries
- **Player**: Self-registered account. Public registration is locked strictly to `player` accounts. Players can only inspect and modify their own records.
- **Coach**: Provisioned via secure server-side process (`lib/provision.ts` / `/api/auth/provision`). Coaches have academy-wide oversight across all athlete records.
- **Scout**: Provisioned via secure server-side process. Scouts have read-only inspection access across athlete profiles.

### 3. Server-Side Authentication & Session Flow
- **Signed Sessions (`lib/auth.ts`)**: Sessions are signed with an HMAC-SHA256 signature using `SESSION_SECRET` and stored in an `HttpOnly`, `SameSite=Lax`, `Secure` (production) cookie named `academy_session`.
- **Tamper Protection**: Tampered payloads or altered signatures fail cryptographic verification.
- **Ownership Enforcement**: `checkOwnership(session, resourceOwnerUserId, isWriteOperation)` guarantees players cannot access or mutate records belonging to other athletes.

## API Endpoints

| Route | Method | Access | Description |
|---|---|---|---|
| `/api/auth/register` | POST | Public | Creates Player account and Player profile (role locked to `player`) |
| `/api/auth/login` | POST | Public | Authenticates credentials and sets `HttpOnly` session cookie |
| `/api/auth/logout` | POST | Authenticated | Clears session cookie immediately |
| `/api/auth/me` | GET | Authenticated | Returns current session user and linked player profile |
| `/api/auth/provision` | POST | Coach / Secret | Provisions Coach or Scout account via server-side verification |
| `/api/players/[id]` | GET | Authenticated | Retrieves player record (ownership checks enforced) |
| `/api/players/[id]` | PATCH | Authenticated | Updates player record (ownership and role checks enforced) |

## Project Structure

```text
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts       # Login API handler
│   │   │   ├── logout/route.ts      # Logout API handler
│   │   │   ├── me/route.ts          # Current session profile handler
│   │   │   ├── provision/route.ts   # Staff account provisioning handler
│   │   │   └── register/route.ts    # Player registration handler
│   │   └── players/[id]/route.ts    # Player record API with ownership checks
│   ├── dashboard/page.tsx           # Role-protected dashboard view
│   ├── login/page.tsx               # Sign in page
│   ├── register/page.tsx            # Player registration page
│   ├── globals.css                  # Tailwind CSS root imports and theme
│   ├── layout.tsx                   # Global root layout with responsive shell
│   └── page.tsx                     # Academy management overview
├── components/
│   ├── footer.tsx                   # Layout footer
│   ├── navbar.tsx                   # Responsive navigation header
│   └── ui/
│       ├── badge.tsx                # Status badge component
│       ├── button.tsx               # Reusable button with variants
│       └── card.tsx                 # Modular card containers
├── lib/
│   ├── auth.ts                      # Session token signing, hashing, and ownership helpers
│   ├── env.ts                       # Environment variable validation
│   ├── mongodb.ts                   # Mongoose connection utility with caching
│   └── provision.ts                 # Server-side Coach/Scout provisioning process
├── models/
│   ├── Player.ts                    # Athlete profile schema and indexes
│   └── User.ts                      # User schema with roles and indexes
├── tests/
│   ├── auth.test.mjs                # Authentication, role restriction, and ownership tests
│   └── mongodb.test.mjs             # Connection caching test suite
├── .env.example                     # Environment variable template
└── package.json                     # Scripts and dependencies
```

## Local Setup Instructions

### 1. Prerequisites

- **Node.js**: `v20.x` or later (tested on Node v25)
- **MongoDB**: A running local MongoDB instance or a MongoDB Atlas connection URI

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env.local` based on `.env.example`:

```bash
cp .env.example .env.local
```

Required variables:
- `MONGODB_URI`: MongoDB connection string.
- `SESSION_SECRET`: Secret key for HMAC-SHA256 session signing (minimum 32 characters in production).
- `STAFF_PROVISIONING_SECRET`: Secret key used for server-side provisioning of Coach and Scout accounts.

### 4. Provision Coach and Scout Accounts (Manual)

Public registration (`/register`) exclusively provisions Player accounts. Coach and Scout accounts cannot be self-registered and must be provisioned manually:

1. **Seed Standard Hackathon Staff Accounts**:
   ```bash
   npm run seed:staff
   ```
   Provisions:
   - **Coach**: `coach@apexacademy.demo` / `DemoPassword123!`
   - **Scout**: `scout@apexacademy.demo` / `DemoPassword123!`

2. **Provision Custom Coach or Scout Accounts**:
   ```bash
   node --env-file=.env.local scripts/create-staff.mjs coach <email> <password> "<name>"
   node --env-file=.env.local scripts/create-staff.mjs scout <email> <password> "<name>"
   ```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Verification Checks

Run the test suite (8 tests covering caching, password hashing, token verification, tampering, role permissions, and ownership checks):
```bash
npm test
```

Run ESLint:
```bash
npm run lint
```

Run production build:
```bash
npm run build
```
