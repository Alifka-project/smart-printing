# PostgreSQL Database Setup for SmartPrint System

## Overview
Your SmartPrint system has been successfully migrated from SQLite to PostgreSQL. This provides better performance, scalability, and reliability for production use.

## What Was Fixed
- ✅ Migrated from SQLite to PostgreSQL
- ✅ Created proper database schema with Prisma
- ✅ Fixed foreign key constraint errors
- ✅ Populated database with initial seed data
- ✅ Created management scripts for easy database operations

## Database Configuration
- **Database Name**: `smartprint_db`
- **Username**: `postgres`
- **Password**: `password`
- **Host**: `localhost`
- **Port**: `5432`
- **Connection String**: `postgresql://postgres:password@localhost:5432/smartprint_db?schema=public`

## Quick Start

### 1. Start the Database
```bash
./setup-db.sh start
```

### 2. Check Database Status
```bash
./setup-db.sh status
```

### 3. Start Development Server
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/smartprint_db?schema=public"
npm run dev
```

### 4. Seed Database (if needed)
```bash
./setup-db.sh seed
```

## Available Commands

### Setup Script (`./setup-db.sh`)
- `./setup-db.sh start` - Start PostgreSQL service
- `./setup-db.sh setup` - Complete database setup
- `./setup-db.sh migrate` - Run database migrations
- `./setup-db.sh seed` - Seed database with initial data
- `./setup-db.sh status` - Check database status
- `./setup-db.sh help` - Show help message

### Manual Commands
```bash
# Start PostgreSQL
brew services start postgresql@14

# Connect to database
psql -d smartprint_db -U postgres

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# View database in Prisma Studio
npx prisma studio
```

## Environment Variables
Set this environment variable before running your application:
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/smartprint_db?schema=public"
```

## Database Schema
The following tables are available:
- **User** - System users and administrators
- **Client** - Customer information
- **Quote** - Print job quotations
- **Paper** - Paper specifications for quotes
- **Finishing** - Finishing options for quotes
- **QuoteAmount** - Pricing information
- **Supplier** - Material suppliers
- **Material** - Available materials
- **SearchHistory** - User search queries
- **SearchAnalytics** - Search analytics data

## Troubleshooting

### Common Issues

1. **PostgreSQL not running**
   ```bash
   brew services start postgresql@14
   ```

2. **Permission denied**
   ```bash
   # Create user if needed
   psql -d postgres -c "CREATE USER postgres WITH SUPERUSER PASSWORD 'password';"
   ```

3. **Database connection failed**
   - Check if PostgreSQL is running
   - Verify connection string
   - Ensure database exists

4. **Foreign key constraint errors**
   - Run seed script to populate initial data
   - Check if related records exist before creating quotes

### Reset Database
If you need to completely reset the database:
```bash
# Drop and recreate database
dropdb smartprint_db
createdb smartprint_db

# Run migrations
npx prisma migrate deploy

# Seed with initial data
./setup-db.sh seed
```

## Production Deployment
For production deployment:
1. Use a managed PostgreSQL service (e.g., AWS RDS, Google Cloud SQL)
2. Set strong passwords
3. Configure connection pooling
4. Enable SSL connections
5. Set up automated backups

## Support
If you encounter any issues:
1. Check the database status: `./setup-db.sh status`
2. Verify PostgreSQL is running: `brew services list | grep postgresql`
3. Check connection: `psql -d smartprint_db -U postgres`
4. Review Prisma logs for detailed error messages

## Next Steps
Your database is now properly configured! You should be able to:
- ✅ Create and manage quotes without foreign key errors
- ✅ Add new clients and users
- ✅ Manage suppliers and materials
- ✅ Use all the SmartPrint features

Start your development server and test the quote creation functionality!
