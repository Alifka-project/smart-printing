# Database Setup Documentation

## Overview

The Smart Printing system now uses a **SQLite database** with **Prisma ORM** for local data persistence. All synthetic/dummy data has been migrated to the database, and localStorage usage has been completely removed.

## Database Schema

### Core Models

#### User
- `id`: Unique identifier
- `email`: User email (unique)
- `name`: User full name
- `role`: User role (admin, user, manager)
- `profilePicture`: Optional profile picture URL
- `createdAt`, `updatedAt`: Timestamps

#### Client
- `id`: Unique identifier
- `clientType`: Company or Individual
- `companyName`: Company name (optional for individuals)
- `contactPerson`: Primary contact person
- `email`: Contact email
- `phone`: Contact phone
- `countryCode`: Phone country code
- `role`: Contact role in organization
- `userId`: Associated user (optional)
- `createdAt`, `updatedAt`: Timestamps

#### Quote
- `id`: Unique identifier
- `quoteId`: Human-readable quote ID (e.g., QT-2024-0718-001)
- `date`: Quote creation date
- `status`: Quote status (Pending, Approved, Rejected, Completed)
- `clientId`: Associated client
- `userId`: Associated user (optional)
- `product`: Product/service name
- `quantity`: Order quantity
- `sides`: Number of sides
- `printing`: Printing method
- `createdAt`, `updatedAt`: Timestamps

#### Paper
- `id`: Unique identifier
- `name`: Paper name
- `gsm`: Paper weight
- `quoteId`: Associated quote

#### Finishing
- `id`: Unique identifier
- `name`: Finishing option name
- `quoteId`: Associated quote

#### QuoteAmount
- `id`: Unique identifier
- `base`: Base amount
- `vat`: VAT amount
- `total`: Total amount
- `quoteId`: Associated quote

#### SearchHistory
- `id`: Unique identifier
- `query`: Search query
- `timestamp`: Search timestamp
- `userId`: Associated user (optional)

#### SearchAnalytics
- `id`: Unique identifier
- `query`: Search query
- `timestamp`: Search timestamp
- `userId`: Associated user (optional)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install prisma @prisma/client sqlite3
```

### 2. Initialize Prisma
```bash
npx prisma init --datasource-provider sqlite
```

### 3. Configure Environment
Create `.env` file with:
```
DATABASE_URL="file:./dev.db"
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Create Database
```bash
npx prisma db push
```

### 6. Migrate Initial Data
```bash
npx tsx lib/migrate-data.ts
```

## Database Service

The `DatabaseService` class provides a clean interface for all database operations:

### User Operations
- `createUser()`
- `getUserByEmail()`
- `getUserById()`

### Client Operations
- `createClient()`
- `getClientById()`
- `getClientByEmail()`
- `getAllClients()`
- `updateClient()`
- `deleteClient()`

### Quote Operations
- `createQuote()`
- `getQuoteById()`
- `getQuoteByQuoteId()`
- `getAllQuotes()`
- `getQuotesByStatus()`
- `updateQuoteStatus()`
- `updateQuote()`
- `deleteQuote()`

### Search Operations
- `saveSearchHistory()`
- `getSearchHistory()`
- `saveSearchAnalytics()`
- `getSearchAnalytics()`

### Statistics
- `getQuoteStats()`
- `getClientStats()`

## Migration from Dummy Data

The system automatically migrates existing dummy data to the database:

1. **Default Admin User**: Created automatically
2. **Clients**: Migrated from dummy data
3. **Quotes**: Migrated with all details (papers, finishing, amounts)
4. **Relationships**: Properly established between entities

## Testing

Test the database connection:
```bash
npx tsx lib/test-db.ts
```

Expected output:
```
Testing database connection...
Found 10 quotes in database
Found 10 clients in database
Quote stats: { total: 10, pending: 2, approved: 7, rejected: 1, completed: 0 }
Client stats: { total: 10, companies: 10, individuals: 0 }
Database test completed successfully!
```

## Benefits of New System

1. **Data Persistence**: All data is stored locally and persists between sessions
2. **No More Dummy Data**: All synthetic data has been replaced with real database records
3. **Better Performance**: Efficient queries and relationships
4. **Data Integrity**: Proper constraints and relationships
5. **Scalability**: Easy to extend with new features
6. **Backup**: Database file can be backed up and restored

## File Locations

- **Database Schema**: `prisma/schema.prisma`
- **Database Service**: `lib/database.ts`
- **Migration Script**: `lib/migrate-data.ts`
- **Database File**: `dev.db` (SQLite file)
- **Environment**: `.env`

## Next Steps

1. **User Authentication**: Implement proper user authentication system
2. **API Endpoints**: Create REST API endpoints for external access
3. **Data Export**: Add data export functionality
4. **Backup System**: Implement automated backup system
5. **User Management**: Add user management interface
6. **Audit Logging**: Track all data changes

## Troubleshooting

### Database Connection Issues
- Ensure `.env` file exists with correct `DATABASE_URL`
- Check that `dev.db` file exists in project root
- Verify Prisma client is generated: `npx prisma generate`

### Migration Issues
- Clear database: `npx prisma db push --force-reset`
- Re-run migration: `npx tsx lib/migrate-data.ts`

### Performance Issues
- Database file is stored locally, performance should be excellent
- Consider adding indexes for large datasets
- Monitor database file size

