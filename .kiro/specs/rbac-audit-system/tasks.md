# Implementation Plan

- [x] 1. Install and configure Spatie Permission package




  - Install spatie/laravel-permission via Composer
  - Publish and run permission migrations

  - Configure permission models and relationships


  - _Requirements: 1.1, 1.4_

- [ ] 2. Set up database schema for RBAC and audit system
  - [x] 2.1 Create activity_logs migration with proper indexes


    - Design activity_logs table with user_id, pharmacy_id, subject fields
    - Add JSON columns for properties, old_values, new_values
    - Create database indexes for performance optimization


    - _Requirements: 5.1, 5.2, 5.3, 6.1, 7.1_

  - [x] 2.2 Add audit tracking fields to existing models


    - Add created_by and updated_by fields to medicines, sales, customers, suppliers tables


    - Create migration to modify existing tables
    - _Requirements: 5.1, 5.2, 6.1_

  - [x] 2.3 Create and run database seeders for roles and permissions


    - Create seeder for default roles (super_admin, pharmacy_admin, pharmacist, cashier)
    - Create seeder for permissions (manage_users, manage_medicines, etc.)
    - Assign permissions to roles according to permission matrix
    - _Requirements: 1.1, 2.2, 3.2, 4.2_



- [ ] 3. Implement core RBAC models and services
  - [ ] 3.1 Create ActivityLog model with relationships
    - Implement ActivityLog Eloquent model


    - Define relationships to User, Pharmacy, and polymorphic subject
    - Add JSON casting for properties and values fields

    - _Requirements: 5.4, 6.2, 7.3_



  - [ ] 3.2 Create Auditable trait for model tracking
    - Implement Auditable trait with model event listeners
    - Add automatic logging for created, updated, deleted events


    - Include user context and change tracking
    - _Requirements: 5.1, 5.2, 5.3, 6.1_

  - [x] 3.3 Implement PermissionService class


    - Create service for role assignment and permission checking
    - Implement methods for user role management
    - Add permission validation and user capability methods


    - _Requirements: 1.1, 1.5, 2.4_



  - [ ] 3.4 Implement AuditTrailService class
    - Create service for activity logging and retrieval
    - Implement methods for logging user activities


    - Add filtering and export functionality for audit data
    - _Requirements: 5.4, 6.2, 7.4, 8.1, 8.2_

- [x] 4. Create middleware for permission and audit enforcement


  - [ ] 4.1 Create PermissionMiddleware for route protection
    - Implement middleware to check user permissions before controller access
    - Add role-based redirection for unauthorized access attempts


    - Integrate with Laravel's Gate system for permission checking
    - _Requirements: 1.3, 2.2, 3.2, 4.5_

  - [x] 4.2 Create AuditTrailMiddleware for activity logging


    - Implement middleware to capture all user requests and responses
    - Log user actions, IP addresses, and browser information
    - Track login attempts and access to restricted features
    - _Requirements: 7.1, 7.2, 7.3_



  - [ ] 4.3 Register middleware in bootstrap/app.php
    - Add middleware aliases for permission and audit trail
    - Configure middleware groups for web and API routes

    - Set up global middleware for audit logging
    - _Requirements: 1.3, 7.1_

- [ ] 5. Update User model and authentication system
  - [ ] 5.1 Enhance User model with RBAC integration
    - Add HasRoles and HasPermissions traits from Spatie package
    - Implement role checking methods (isPharmacist, isCashier, etc.)
    - Add relationships for created/updated records tracking
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

  - [ ] 5.2 Update existing models with Auditable trait
    - Add Auditable trait to Medicine, Sale, Customer, Supplier models
    - Configure audit field mappings and excluded attributes
    - Test audit logging for all CRUD operations
    - _Requirements: 5.1, 5.2, 5.3, 6.1_

  - [ ] 5.3 Implement authentication event logging
    - Add event listeners for login, logout, and failed login attempts
    - Log security events with user identification and context
    - Track suspicious activities and multiple failed attempts
    - _Requirements: 7.1, 7.2, 7.5_

- [ ] 6. Update controllers with permission checks and audit integration
  - [ ] 6.1 Add permission gates to MedicineController
    - Implement permission checks for create, update, delete operations
    - Add role-based filtering for medicine data visibility
    - Ensure Cashier users see limited medicine information
    - _Requirements: 2.3, 3.4, 4.3, 4.4_

  - [ ] 6.2 Add permission gates to SaleController
    - Implement permission checks for sales operations
    - Add user attribution to sales records
    - Ensure proper audit logging for all sales transactions
    - _Requirements: 2.3, 3.4, 4.2, 6.1, 6.3_

  - [ ] 6.3 Add permission gates to CustomerController and SupplierController
    - Implement role-based access control for customer and supplier management
    - Add audit logging for customer and supplier record changes
    - Restrict Cashier access to customer lookup only
    - _Requirements: 2.3, 3.4, 4.2, 4.4_

  - [ ] 6.4 Create UserManagementController for admin functions
    - Implement user creation, role assignment, and management features
    - Add permission checks for user management operations
    - Create audit logging for user role changes and account modifications
    - _Requirements: 1.1, 1.5, 2.4, 7.3_

- [ ] 7. Create audit trail and reporting features
  - [ ] 7.1 Create AuditController for audit trail management
    - Implement controller for viewing and filtering audit logs
    - Add methods for exporting audit data in CSV and PDF formats
    - Create admin dashboard for security monitoring
    - _Requirements: 7.4, 8.1, 8.2, 8.3_

  - [ ] 7.2 Implement audit history views for models
    - Create components to display activity history on medicine detail pages
    - Add audit trail sections to sales and customer record views
    - Show user attribution and timestamp information for all changes
    - _Requirements: 5.4, 6.2_

  - [ ] 7.3 Create compliance reporting features
    - Implement filtered audit report generation
    - Add summary statistics and activity trend analysis
    - Create exportable compliance reports with data integrity verification
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [ ] 8. Update frontend components for role-based UI
  - [ ] 8.1 Create role-based navigation component
    - Implement dynamic menu rendering based on user permissions
    - Hide/show navigation items according to role capabilities
    - Add role indicators and user context information
    - _Requirements: 1.2, 2.2, 3.2, 4.2_

  - [ ] 8.2 Update dashboard components for different roles
    - Create role-specific dashboard layouts and widgets
    - Implement permission-based component rendering
    - Add quick access features appropriate for each role
    - _Requirements: 1.2, 2.2, 3.2, 4.2_

  - [ ] 8.3 Create user management interface
    - Implement user creation and role assignment forms
    - Add user listing with role information and management actions
    - Create role change confirmation and audit logging
    - _Requirements: 1.1, 1.5, 2.4_

  - [ ] 8.4 Add audit trail display components
    - Create activity history components for model detail pages
    - Implement audit log filtering and search functionality
    - Add export buttons and compliance reporting interface
    - _Requirements: 5.4, 6.2, 7.4, 8.1_

- [ ] 9. Implement security enhancements and error handling
  - [ ] 9.1 Create permission-based error pages
    - Implement 403 Forbidden pages with role-appropriate messaging
    - Add redirect logic for unauthorized access attempts
    - Create user-friendly error messages explaining access restrictions
    - _Requirements: 1.3, 4.5_

  - [ ] 9.2 Add security monitoring and alerting
    - Implement detection for suspicious login patterns
    - Add automatic account locking for multiple failed attempts
    - Create security event notifications for administrators
    - _Requirements: 7.5_

  - [ ] 9.3 Implement data integrity and backup features
    - Add checksums or digital signatures for audit log integrity
    - Implement automatic cleanup of old audit records
    - Create backup and restore procedures for audit data
    - _Requirements: 8.4_

- [ ] 10. Testing and validation
  - [ ] 10.1 Write unit tests for RBAC functionality
    - Test role assignment and permission checking methods
    - Validate audit trail service and model functionality
    - Test middleware permission enforcement and logging
    - _Requirements: All_

  - [ ] 10.2 Write integration tests for complete workflows
    - Test end-to-end user workflows for each role
    - Validate audit logging across all user interactions
    - Test permission enforcement in controller and API endpoints
    - _Requirements: All_

  - [ ] 10.3 Perform security and performance testing
    - Test permission bypass attempts and security vulnerabilities
    - Validate audit log performance with large datasets
    - Test multi-tenancy isolation and data security
    - _Requirements: All_