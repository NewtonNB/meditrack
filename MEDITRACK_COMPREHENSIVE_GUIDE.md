# MediTrack Pharmacy Management System - Comprehensive Guide

**Version:** 2.0  
**Last Updated:** March 2, 2026  
**System Status:** Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Core Features](#core-features)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Key Modules](#key-modules)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Development Workflow](#development-workflow)
9. [Testing Guide](#testing-guide)
10. [Deployment](#deployment)
11. [System Monitoring](#system-monitoring)
12. [Currency Standard](#currency-standard)

---

## System Overview

MediTrack is a comprehensive pharmacy management system built with Laravel 11, React 18, and Inertia.js. It provides complete inventory management, point-of-sale operations, automated notifications, AI-powered insights, and robust security features.

### Technology Stack

- **Backend:** Laravel 11, PHP 8.2+
- **Frontend:** React 18, Inertia.js, Tailwind CSS
- **Database:** MySQL 8.0+
- **Real-time:** Laravel Echo, Pusher
- **AI Service:** Python Flask (optional)
- **Build Tool:** Vite

### Key Capabilities

- Multi-pharmacy support with tenant isolation
- Role-based access control (RBAC)
- Real-time notifications and updates
- Automated inventory management
- AI-powered demand forecasting
- Comprehensive audit logging
- Advanced reporting and analytics
- Point-of-sale system with multiple payment methods
- Unit conversion system (strips, packs, bulk)
- Expiry tracking and automated alerts

---

## Quick Start

### Prerequisites

```bash
- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- MySQL 8.0+
- Git
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd meditrack

# Install PHP dependencies
composer install

# Install JavaScript dependencies
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate --seed

# Build assets
npm run build

# Start development server
php artisan serve
```

### Default Credentials

**Super Admin:**
- Email: admin@meditrack.com
- Password: password

**Pharmacy Admin:**
- Email: pharmacy@example.com
- Password: password

**Pharmacist:**
- Email: pharmacist@example.com
- Password: password

---

## Architecture

### Directory Structure

```
meditrack/
├── app/
│   ├── Console/Commands/      # Artisan commands
│   ├── Http/Controllers/      # Request handlers
│   ├── Models/                # Eloquent models
│   ├── Services/              # Business logic
│   └── Events/                # Event classes
├── database/
│   ├── migrations/            # Database migrations
│   └── seeders/               # Data seeders
├── resources/
│   ├── js/
│   │   ├── Components/        # React components
│   │   ├── Pages/             # Inertia pages
│   │   ├── Hooks/             # Custom React hooks
│   │   └── Utils/             # Utility functions
│   └── css/                   # Stylesheets
├── routes/
│   ├── web.php                # Web routes
│   └── api.php                # API routes
└── public/                    # Public assets
```

### Design Patterns

- **Service Layer:** Business logic separated from controllers
- **Repository Pattern:** Data access abstraction
- **Event-Driven:** Laravel events for decoupled operations
- **Component-Based UI:** Reusable React components
- **Custom Hooks:** Shared React logic

---

## Core Features

### 1. Inventory Management

- Real-time stock tracking
- Batch and expiry management
- Automated reorder suggestions
- Multi-unit system (strips, packs, bulk)
- Stock movement history
- Low stock alerts
- Expiry notifications

### 2. Point of Sale (POS)

- Fast medicine search
- Barcode scanning support
- Multiple payment methods
- Customer management
- Receipt generation
- Sales history
- Refund processing

### 3. Purchase Management

- Supplier management
- Purchase order creation
- Automatic stock updates
- Batch tracking
- Purchase history
- Supplier performance analytics

### 4. Notification System

- Real-time notifications
- Email notifications
- Customizable preferences
- Priority-based alerts
- Auto-cleanup of old notifications
- Notification categories:
  - Low stock alerts
  - Expiry warnings
  - Purchase confirmations
  - System notifications

### 5. AI-Powered Features

- Demand forecasting
- Anomaly detection
- Intelligent reorder suggestions
- Sales trend analysis
- Chatbot assistance
- Predictive analytics

### 6. Reporting & Analytics

- Sales reports (daily, weekly, monthly)
- Stock reports
- Expiry reports
- Financial analytics
- Export to PDF/Excel
- Custom date ranges
- Visual dashboards

### 7. Security & Compliance

- Role-based access control
- Audit trail logging
- Data encryption
- CSRF protection
- XSS prevention
- SQL injection protection
- Session management
- Password policies

---

## User Roles & Permissions

### Super Admin
- Full system access
- Pharmacy management
- User management across pharmacies
- System configuration
- Global reports

### Pharmacy Admin
- Pharmacy-level management
- User management (within pharmacy)
- All module access
- Reports and analytics
- Settings configuration

### Pharmacist
- Medicine management
- Sales operations
- Purchase management
- Inventory updates
- Customer management

### Cashier
- POS operations
- Sales processing
- Customer lookup
- Receipt printing

### Inventory Manager
- Stock management
- Purchase orders
- Supplier management
- Stock movements
- Inventory reports

---

## Key Modules

### Dashboard

**Location:** `resources/js/Pages/Dashboard.jsx`

Features:
- Real-time statistics
- Quick actions
- Recent activities
- Low stock alerts
- Expiry warnings
- Sales trends
- Auto-refresh every 30 seconds

### Medicines

**Location:** `resources/js/Pages/Medicines.jsx`

Features:
- Medicine CRUD operations
- Batch management
- Unit conversion
- Pricing management
- Stock tracking
- Search and filtering
- Bulk operations
- Image upload

### Sales

**Location:** `resources/js/Pages/Sales.jsx`

Features:
- Sales history
- Invoice generation
- Refund processing
- Customer information
- Payment details
- Sales analytics
- Export functionality

### Purchases

**Location:** `resources/js/Pages/Purchases.jsx`

Features:
- Purchase order creation
- Supplier selection
- Batch entry
- Automatic stock updates
- Purchase history
- Supplier management

### Notifications

**Location:** `resources/js/Pages/Notifications/Index.jsx`

Features:
- Notification center
- Real-time updates
- Mark as read/unread
- Filter by category
- Priority sorting
- Bulk actions
- Preferences management

### Settings

**Location:** `resources/js/Pages/Settings.jsx`

Features:
- Profile management
- Notification preferences
- System configuration
- Theme settings
- Language selection
- Timezone configuration

---

## Common Issues & Solutions

### 1. Inertia JSON Response Error

**Error:** "All Inertia requests must receive a valid Inertia response, however a plain JSON response was received"

**Solution:**
- Ensure API routes are outside Inertia middleware group
- Use separate middleware for JSON API endpoints
- Check `routes/web.php` and `bootstrap/app.php` configuration

**Files:**
- `routes/web.php`
- `bootstrap/app.php`
- `app/Http/Controllers/NotificationController.php`

### 2. React Error #130 (Minified React Error)

**Error:** Blank screen or "Minified React error #130"

**Cause:** Undefined or null data being rendered

**Solution:**
- Use safe data extraction with `?.` operators
- Provide fallback values for all props
- Implement proper null checking
- Use ErrorBoundary components

**Example:**
```javascript
const data = props.data?.items ?? [];
const user = props.auth?.user ?? {};
```

### 3. Settings Page Corruption

**Issue:** Settings.jsx file becomes 0 bytes

**Solution:**
- Use PowerShell `Out-File` command for file creation
- Verify file size after write operations
- Rebuild assets with `npm run build`
- Check build manifest for component inclusion

### 4. Notification 500 Errors

**Causes:**
- CSRF token mismatch
- Authentication issues
- Database connection problems

**Solutions:**
- Ensure CSRF token is included in requests
- Check authentication middleware
- Verify database connections
- Review error logs

### 5. Dashboard Loading Issues

**Symptoms:**
- Blank dashboard
- Undefined data errors
- Component not rendering

**Solutions:**
- Check DashboardController data structure
- Verify all required data is passed
- Use safe rendering patterns
- Check browser console for errors

### 6. Build Errors

**Common Issues:**
- Missing dependencies
- Syntax errors
- Import path issues

**Solutions:**
```bash
# Clear cache
npm run build
php artisan optimize:clear

# Reinstall dependencies
rm -rf node_modules
npm install
npm run build
```

### 7. Database Migration Issues

**Solutions:**
```bash
# Reset database
php artisan migrate:fresh --seed

# Check migration status
php artisan migrate:status

# Rollback specific migration
php artisan migrate:rollback --step=1
```

---

## Development Workflow

### 1. Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
# Edit files...

# Build assets
npm run dev  # Development
npm run build  # Production

# Test changes
php artisan test
npm run test

# Commit changes
git add .
git commit -m "Description of changes"
git push origin feature/your-feature
```

### 2. Adding New Features

1. **Backend:**
   - Create migration if needed
   - Create/update model
   - Create/update controller
   - Add routes
   - Create service class if complex logic

2. **Frontend:**
   - Create React component
   - Add to appropriate page
   - Implement hooks if needed
   - Style with Tailwind CSS
   - Test responsiveness

3. **Testing:**
   - Write unit tests
   - Test manually
   - Check browser console
   - Verify database changes

### 3. Code Standards

**PHP:**
- Follow PSR-12 coding standard
- Use type hints
- Document complex logic
- Keep controllers thin

**JavaScript/React:**
- Use functional components
- Implement custom hooks for reusable logic
- Use PropTypes or TypeScript
- Follow React best practices

**CSS:**
- Use Tailwind utility classes
- Avoid custom CSS when possible
- Keep styles consistent
- Use design system colors

---

## Testing Guide

### Artisan Test Commands

```bash
# Test entire system
php artisan test

# Test specific modules
php artisan test:dashboard
php artisan test:notifications
php artisan test:inventory
php artisan test:pos
php artisan test:sales
php artisan test:purchases

# System health check
php artisan system:health-check

# Test AI system
php artisan test:ai-system

# Test automation
php artisan test:automation-system
```

### Manual Testing Checklist

**Authentication:**
- [ ] Login with different roles
- [ ] Logout functionality
- [ ] Password reset
- [ ] Session management

**Dashboard:**
- [ ] Statistics display correctly
- [ ] Real-time updates work
- [ ] Quick actions functional
- [ ] Charts render properly

**Medicines:**
- [ ] Create new medicine
- [ ] Edit existing medicine
- [ ] Delete medicine
- [ ] Search and filter
- [ ] Batch management
- [ ] Unit conversion

**Sales:**
- [ ] Create sale
- [ ] Process payment
- [ ] Generate invoice
- [ ] Process refund
- [ ] View sales history

**Purchases:**
- [ ] Create purchase order
- [ ] Select supplier
- [ ] Add items
- [ ] Submit order
- [ ] Verify stock update

**Notifications:**
- [ ] Receive notifications
- [ ] Mark as read
- [ ] Filter notifications
- [ ] Update preferences
- [ ] Real-time updates

---

## Deployment

### Production Checklist

```bash
# 1. Environment Configuration
cp .env.example .env
# Edit .env with production values

# 2. Install Dependencies
composer install --optimize-autoloader --no-dev
npm install --production

# 3. Build Assets
npm run build

# 4. Database Setup
php artisan migrate --force
php artisan db:seed --class=ProductionSeeder

# 5. Optimize Application
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# 6. Set Permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# 7. Queue Workers (if using)
php artisan queue:restart

# 8. Schedule Tasks
# Add to crontab:
# * * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

### Environment Variables

```env
APP_NAME=MediTrack
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=meditrack
DB_USERNAME=your_username
DB_PASSWORD=your_password

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null

PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1
```

### Server Requirements

- PHP 8.2+
- MySQL 8.0+
- Nginx or Apache
- SSL Certificate
- Composer
- Node.js (for builds)

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/meditrack/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

---

## System Monitoring

### Health Checks

```bash
# Run system health check
php artisan system:health-check

# Check specific components
php artisan system:check-database
php artisan system:check-cache
php artisan system:check-storage
```

### Logs

**Location:** `storage/logs/laravel.log`

**Monitor:**
- Application errors
- Database queries
- API requests
- Authentication attempts
- Security events

### Performance Monitoring

- Database query optimization
- Cache hit rates
- Response times
- Memory usage
- Queue processing

### Backup Strategy

```bash
# Database backup
php artisan backup:run

# Schedule daily backups
# Add to scheduler in app/Console/Kernel.php
$schedule->command('backup:run')->daily();
```

---

## Currency Standard

**System Currency:** UGX (Ugandan Shilling)

All prices, costs, and financial calculations use UGX. No currency symbols ($, €, etc.) are displayed in the UI. All monetary values are shown as plain numbers with "UGX" label where needed.

**Example:**
- ✅ Correct: "5,000 UGX" or "5,000"
- ❌ Incorrect: "$5,000" or "€5,000"

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor error logs
- Check notification system
- Verify backup completion

**Weekly:**
- Review system performance
- Check disk space
- Update dependencies (if needed)
- Review security logs

**Monthly:**
- Database optimization
- Clear old logs
- Review user access
- Update documentation

### Getting Help

1. Check this guide first
2. Review error logs
3. Check Laravel documentation
4. Check React/Inertia documentation
5. Contact system administrator

---

## Conclusion

MediTrack is a robust, production-ready pharmacy management system with comprehensive features for inventory management, sales operations, and business analytics. This guide covers the essential aspects of the system. For specific technical details, refer to the code documentation and inline comments.

**System Status:** ✅ Production Ready  
**Last Major Update:** Settings page fix and notification system enhancement  
**Next Recommended Updates:** AI service integration, mobile app development

---

*End of Comprehensive Guide*
