# Yatra Bus v2 — Angular 21 + ASP.NET Core 8 (Clean Architecture)

A rewrite of the Yatra Bus v5 demo (Node + vanilla JS) as a **feature-based Angular 21** frontend and a **.NET 8 Clean Architecture** backend.
The look, animations, moving hero bus, seed data, flows and API responses are the same as v5.

```
yatra-bus-v2/
├─ backend/
│  ├─ YatraBus.sln
│  ├─ src/
│  │  ├─ YatraBus.Domain/          entities and pure business rules (fares, refunds, seat layouts, boarding points, holds)
│  │  ├─ YatraBus.Application/     use-case services (auth, search, trips, seats, bookings, pricing, admin) + interfaces
│  │  ├─ YatraBus.Infrastructure/  EF Core SQLite, seed data, PBKDF2 hasher, in-memory seat holds and admin tokens, clock
│  │  └─ YatraBus.Api/             minimal-API endpoints, cookie session, JSON shape, serves the built Angular app (wwwroot)
│  └─ tests/YatraBus.Tests/        xUnit tests for Domain and Application (35 tests)
└─ frontend/                       Angular 21 standalone components, signals, reactive forms, lazy routes
```

Dependencies point inwards only: Api → Application/Infrastructure → Domain. Domain has no framework references.

## Prerequisites (Windows)

| Tool | Version | Check |
|---|---|---|
| Node.js LTS | 20.19+, 22.12+ or 24.x | `node -v` |
| .NET SDK | 8.0.x | `dotnet --version` |

Downloads: https://nodejs.org (LTS) and https://dotnet.microsoft.com/download/dotnet/8.0 (pick "SDK").

### "npm.ps1 cannot be loaded because running scripts is disabled"
PowerShell blocks `npm.ps1` by default. Either call **`npm.cmd`** instead of `npm` (all commands below do), or allow local scripts once:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Quick start (one server, port 5000)

The zip ships a prebuilt Angular app in `backend\src\YatraBus.Api\wwwroot`, so this is all you need:
```powershell
cd yatra-bus-v2\backend
dotnet run --project src\YatraBus.Api
```
Open **http://localhost:5000**. The first run restores NuGet packages, then creates and seeds `src\YatraBus.Api\yatra.db`.
Swagger: http://localhost:5000/swagger (Development profile only).

## Development (two PowerShell windows)

**Window 1 — API**
```powershell
cd yatra-bus-v2\backend
dotnet run --project src\YatraBus.Api
```

**Window 2 — Angular dev server**
```powershell
cd yatra-bus-v2\frontend
npm.cmd install
npm.cmd start
```
Open **http://localhost:4200**. `proxy.conf.json` forwards `/api/*` to http://localhost:5000, so cookies and sessions behave as in v5.

* Admin console: http://localhost:4200/#/admin (or :5000), password **`admin`**.
* Change it in `backend\src\YatraBus.Api\appsettings.json` (`Yatra:AdminPassword`) or per run:
  `$env:Yatra__AdminPassword="s3cret"; dotnet run --project src\YatraBus.Api`

## Rebuild the Angular app into the API

```powershell
cd yatra-bus-v2\frontend
npm.cmd run build:backend          # writes to ..\backend\src\YatraBus.Api\wwwroot
cd ..\backend
dotnet run --project src\YatraBus.Api --no-launch-profile   # Production environment
```

## Tests

```powershell
cd yatra-bus-v2\backend
dotnet test
```

## Useful bits

* **Reset the data:** stop the API and delete `backend\src\YatraBus.Api\yatra.db*`, or use **Reset demo data** in the admin console (keeps user accounts).
* **Settings** (`backend\src\YatraBus.Api\appsettings.json`): `Yatra:HoldMinutes` (seat hold, default 10), `Yatra:SessionDays` (login cookie, default 30), `ConnectionStrings:Default` (SQLite file), `Urls` (default http://localhost:5000).
* **Port 5000 or 4200 busy?** Close the other app, or change `Urls` and `frontend\proxy.conf.json` together.

## Frontend structure (`frontend/src/app/`)

```
core/       data-access (API clients) · interceptors · layout (header, footer) · models · routing (page transitions,
            sync render after user events) · services (api, modal, toast) · state (session, admin session, booking, meta)
shared/     ui (bus card, seat map, fare breakdown, modal host, toast host, QR, ticket, steps bar, form fields, icons,
            empty state) · directives (reveal-on-scroll, hover tilt, ripple, count-up, password toggle) · pipes
features/   home · search-results · seat-selection · checkout · ticket · manage-booking · auth · account · not-found
            admin/{dashboard, bookings, occupancy, catalog (buses, routes, schedules, operators, coupons)}
```
Each feature owns its page component + template, `*.routes.ts`, `data-access/` (API + store) and `ui/` pieces.
Every page is a real standalone component with an HTML template (no innerHTML views); all routes are lazy-loaded.
Hash URLs (`#/search?…`, `#/admin?tab=…`) are kept, so v5 links still work.
