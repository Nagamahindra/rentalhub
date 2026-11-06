# Rental HUB2 — Rental Management System

A full-stack rental management application using HTML, CSS, JavaScript, Node.js, Express and SQLite.

## Requirements
- Node.js 18 or newer (includes npm)
- VS Code (recommended)

## Run on Windows
1. Extract `RentalManagementSystem.zip`.
2. Open the extracted `RentalManagementSystem` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Install packages:
   ```bash
   npm install
   ```
5. Start the server:
   ```bash
   npm start
   ```
6. Open http://localhost:3000.

The SQLite database and sample products are created automatically in `data/` on first start. You do not need to create the database manually.

## Demo administrator
- Username: `admin`
- Password: `admin123`

For local development, these are the default credentials. To change them, copy `.env.example` to `.env` and set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a private `SESSION_SECRET`.

## Customer access
Select **Customer portal** and create an account using the registration form. After registration you are signed in automatically.

## Included functionality
- Separate customer and administrator interfaces.
- Customer registration and login with bcrypt password hashing.
- Session-based authentication and server-side role checks.
- Product catalogue with search and category filtering: Cars, Bikes, Watches, Electronics and Equipment.
- Customer booking with date validation, inclusive day calculation, server-side price calculation and overlap prevention.
- Customer can view only their own bookings; customers cannot edit or delete bookings.
- Customer dashboard with left-side navigation, My Bookings, My Wishlist, Browse Rentals, My Profile and Change Password.
- Wishlist saved per customer in SQLite.
- Customers and administrators can change passwords after verifying the current password.
- Administrator demo credentials are not displayed on the admin login screen.
- Admin dashboard statistics and customer list.
- Admin booking CRUD (view, add, edit and delete).
- Admin product CRUD. Products with booking history are safely marked unavailable rather than permanently removed.
- SQLite persistence.

## Database
The application creates:
- `customers`
- `items`
- `rentals`

The database file is `data/rental-system.db`. Keep this file to preserve local data. It is excluded from Git by `.gitignore`.

## Notes
- Product photos are remote image URLs; an internet connection is needed to display them.
- This is a local demonstration application. Before public deployment, configure HTTPS, a strong secret, a production-grade session store, rate limiting, CSRF protection, and secure administrator credential management.
- No payment gateway is connected; online payment is listed as future scope.


## Password breach warning (RentalHub5)

When a customer or administrator signs in, RentalHub5 checks whether the password appears in the public Pwned Passwords breach corpus. If a match is found, the app displays a security warning with a **Change password** action. The change-password endpoint also checks the replacement password and rejects it if it is known to be compromised.

**Privacy:** The app never sends the plaintext password to the breach-checking service. It calculates a SHA-1 hash locally and sends only the first five hash characters using the Pwned Passwords range/k-anonymity API. If that service is unavailable, sign-in and password changes continue without a breach result; the app does not falsely label the password safe.

The breach check requires an internet connection. Passwords remain stored locally as bcrypt hashes in the SQLite database.


## RentalHub5 dashboard updates
- Customer sidebar Browse rentals now opens the rental catalogue directly.
- Admin navigation is arranged vertically in a left-side dashboard sidebar (Overview, Bookings, Products, Customers).
- Admin Overview includes a six-month revenue chart. Each month sums the saved `total_cost` values from bookings, grouped by booking creation month.


## RentalHub5
This release combines the password breach warning, customer Browse Rentals navigation fix, left-side admin navigation, and a six-month revenue chart based on saved booking totals.


## Admin login recovery and password visibility
- Default demo administrator username: `admin`
- Default demo administrator password: `admin123`
- If an existing local database rejects these credentials, run `npm run reset-admin` from the project folder. This resets only the administrator password hash; customer accounts, products, wishlists and bookings remain intact.
- Password fields have an eye control to show or hide typed passwords. Login forms do not prefill the administrator username or intentionally display demo credentials. If Chrome still inserts a saved login, clear the saved RentalHub login in Chrome Password Manager or remove the autofilled value.


## RentalHub6 landing page redesign
The public landing page has been redesigned with a polished, Dribbble-inspired rental marketplace layout:
- Hero section with Explore Rentals, Admin Portal, Log in and Get Started actions.
- Clickable category tiles for Cars, Bikes, Watches, Electronics and Equipment.
- Featured products loaded from the existing public products API.
- How It Works steps and Why RentalHub sections.
- Responsive layout for desktop and mobile.
- Navigation links scroll to the matching sections.
- Category tiles prompt customer sign-in and then open Browse Rentals with the selected category.
- Existing customer and admin login, booking, wishlist, profile, product management and revenue modules are retained.


## RentalHub7 updates
- Fixed the missing startup `boot()` function that caused the browser to remain on "Loading RentalHub...".
- Added a timeout fallback so the public landing page still renders if the session check is slow.
- Added a Login flow that first asks the visitor to choose Customer or Admin, then opens the correct email/username and password form.
- Added a common FAQ section with expandable answers and a working FAQ navigation link.
- Existing rental categories, customer dashboard, admin dashboard, bookings, wishlist, password controls and revenue overview are retained.


## RentalHub8 login and account navigation updates
- Landing-page Login opens a clear Customer Login / Admin Login choice.
- Customer Login opens the customer email-and-password form; Create Account is available only from that customer login form.
- Admin Login opens the administrator username-and-password form directly; there is no admin registration link.
- Removed repeated Change Password buttons from dashboard headers, customer navigation and dashboard shortcut cards.
- Customer password changes are available only from My Profile.
- Admin password changes are available from one Account entry in the admin sidebar.


## RentalHub9 login flow
- Clicking Login on the landing page opens the Customer Login form directly.
- The Customer Login form includes a separate Admin Login link beneath it.
- Clicking Admin Login opens the administrator username/password form directly.
- Customer registration remains available from the customer login form.
- The landing page no longer presents a two-card Customer/Admin login choice.
