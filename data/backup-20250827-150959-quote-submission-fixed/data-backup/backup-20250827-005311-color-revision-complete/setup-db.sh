#!/bin/bash

# PostgreSQL Database Setup Script for SmartPrint System
# This script helps manage the PostgreSQL database

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="smartprint_db"
DB_USER="postgres"
DB_PASSWORD="password"
DB_HOST="localhost"
DB_PORT="5432"

# Export environment variable
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

echo -e "${GREEN}SmartPrint Database Setup Script${NC}"
echo "=================================="

# Function to check if PostgreSQL is running
check_postgres() {
    if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is running${NC}"
        return 0
    else
        echo -e "${RED}✗ PostgreSQL is not running${NC}"
        return 1
    fi
}

# Function to start PostgreSQL
start_postgres() {
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql@14
    sleep 3
    if check_postgres; then
        echo -e "${GREEN}PostgreSQL started successfully${NC}"
    else
        echo -e "${RED}Failed to start PostgreSQL${NC}"
        exit 1
    fi
}

# Function to create database
create_database() {
    echo -e "${YELLOW}Creating database...${NC}"
    export PATH="/usr/local/opt/postgresql@14/bin:$PATH"
    createdb -U $DB_USER $DB_NAME 2>/dev/null || echo "Database already exists"
    echo -e "${GREEN}Database ready${NC}"
}

# Function to run migrations
run_migrations() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    npx prisma migrate deploy
    echo -e "${GREEN}Migrations completed${NC}"
}

# Function to seed database
seed_database() {
    echo -e "${YELLOW}Seeding database...${NC}"
    curl -X POST http://localhost:3000/api/seed > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Database seeded successfully${NC}"
    else
        echo -e "${YELLOW}Note: Seed API requires the development server to be running${NC}"
    fi
}

# Function to check database status
check_database() {
    echo -e "${YELLOW}Checking database status...${NC}"
    export PATH="/usr/local/opt/postgresql@14/bin:$PATH"
    psql -d $DB_NAME -U $DB_USER -c "SELECT COUNT(*) as user_count FROM \"User\"; SELECT COUNT(*) as client_count FROM \"Client\";" 2>/dev/null
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     - Start PostgreSQL service"
    echo "  setup     - Complete database setup (start, create, migrate)"
    echo "  migrate   - Run database migrations"
    echo "  seed      - Seed database with initial data"
    echo "  status    - Check database status"
    echo "  help      - Show this help message"
    echo ""
    echo "Environment:"
    echo "  DATABASE_URL is automatically set to: $DATABASE_URL"
}

# Main script logic
case "${1:-setup}" in
    "start")
        start_postgres
        ;;
    "setup")
        start_postgres
        create_database
        run_migrations
        echo -e "${GREEN}Database setup completed!${NC}"
        echo -e "${YELLOW}To seed the database, run: $0 seed${NC}"
        ;;
    "migrate")
        check_postgres || start_postgres
        run_migrations
        ;;
    "seed")
        check_postgres || start_postgres
        seed_database
        ;;
    "status")
        check_postgres || start_postgres
        check_database
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo -e "To start development server: npm run dev"
echo -e "Database URL: $DATABASE_URL"
