# Requirements Document

## Introduction

A Personal Finance & Expense Manager application built with the PERN stack (PostgreSQL, Express.js, React.js, Node.js) that enables users to track their income and expenses, categorize transactions, and view spending summaries with filtering capabilities.

## Glossary

- **Finance_Manager**: The complete PERN stack application system
- **Authentication_Service**: JWT-based user authentication and authorization component
- **Transaction_Service**: Service handling financial transaction operations
- **Database_Service**: PostgreSQL database management component
- **Frontend_App**: React.js user interface application
- **Backend_API**: Express.js REST API server
- **User**: Registered application user with authentication credentials
- **Admin**: User with administrative privileges for user management
- **Transaction**: Financial record with amount, category, date, description, and notes
- **Category**: Classification for transactions (Food, Rent, Salary, etc.)
- **Role**: User permission level (admin or user)
- **JWT_Token**: JSON Web Token for user session authentication
- **Protected_Route**: API endpoint requiring valid JWT authentication
- **User_Status**: Active or inactive state of user account
- **RBAC_Service**: Role-Based Access Control service for authorization

## Requirements

### Requirement 1: User Authentication and Role-Based Access Control

**User Story:** As a user, I want to create an account with role-based permissions and securely log in, so that I can access my personal financial data with appropriate access levels.

#### Acceptance Criteria

1. WHEN a user provides valid registration data, THE Authentication_Service SHALL create a new user account with bcrypt-hashed password
2. WHEN a user provides valid login credentials, THE Authentication_Service SHALL return a JWT_Token containing user role information
3. WHEN a user provides invalid credentials, THE Authentication_Service SHALL return an authentication error
4. THE Database_Service SHALL store user credentials in a users table with columns: id, email, password, roleid, status
5. THE Database_Service SHALL store roles in a roles table with columns: id, name
6. THE Database_Service SHALL seed two roles: admin and user
7. THE Database_Service SHALL set the default user role to admin in the seed file
8. THE Database_Service SHALL set user status to active by default
9. THE Authentication_Service SHALL hash passwords using bcrypt before database storage
10. THE RBAC_Service SHALL enforce role-based access to protected endpoints

### Requirement 2: Enhanced Transaction Management

**User Story:** As a user, I want to add, view, and manage my financial transactions with detailed notes, so that I can track my income and expenses with context.

#### Acceptance Criteria

1. WHEN an authenticated user submits transaction data, THE Transaction_Service SHALL store it in the transactions table
2. THE Database_Service SHALL link transactions to users via foreign key relationship to user_id
3. THE Database_Service SHALL store transaction amounts using high-precision numeric data type
4. THE Database_Service SHALL include a notes column in the transactions table for expense reasons
5. WHEN an authenticated user requests their transactions, THE Transaction_Service SHALL return only their own transaction records
6. THE Transaction_Service SHALL support transaction categories including Food, Rent, Salary, and custom categories

### Requirement 3: Protected API Access

**User Story:** As a system administrator, I want all financial data endpoints to be secured, so that users can only access their own data.

#### Acceptance Criteria

1. WHEN a request is made to a protected endpoint, THE Backend_API SHALL verify the JWT_Token from the Authorization header
2. IF no valid JWT_Token is provided, THEN THE Backend_API SHALL return an unauthorized error
3. WHEN a valid JWT_Token is verified, THE Backend_API SHALL extract the user_id and allow access to user-specific data
4. THE Protected_Route middleware SHALL be applied to all transaction-related endpoints

### Requirement 4: Spending Summary and Analytics

**User Story:** As a user, I want to see my spending totals by category, so that I can understand my financial patterns.

#### Acceptance Criteria

1. WHEN an authenticated user requests spending summary, THE Transaction_Service SHALL execute SQL queries using SUM() and GROUP BY to aggregate totals by category
2. THE Frontend_App SHALL display a Summary Card component showing category totals
3. WHEN new transactions are added, THE Summary Card SHALL automatically recalculate and update totals
4. THE Transaction_Service SHALL provide separate totals for income and expense categories

### Requirement 5: Transaction History Filtering

**User Story:** As a user, I want to filter my transaction history by date range, so that I can analyze specific time periods.

#### Acceptance Criteria

1. WHEN a user provides startDate and endDate parameters, THE Backend_API SHALL filter transactions within the specified date range
2. THE Backend_API SHALL accept startDate and endDate as query parameters in GET requests
3. WHEN no date parameters are provided, THE Backend_API SHALL return all user transactions
4. THE Frontend_App SHALL provide date picker controls for filtering transaction history

### Requirement 6: Frontend-Backend Communication

**User Story:** As a developer, I want reliable API communication between frontend and backend, so that data flows correctly through the application.

#### Acceptance Criteria

1. THE Frontend_App SHALL use Axios library for all HTTP requests to the Backend_API
2. WHEN API requests are made, THE Frontend_App SHALL include JWT_Token in Authorization headers for protected endpoints
3. THE Frontend_App SHALL handle API response errors and display appropriate user feedback
4. THE Backend_API SHALL return consistent JSON response formats for all endpoints

### Requirement 7: Project Structure and Architecture

**User Story:** As a developer, I want a well-organized codebase, so that the application is maintainable and scalable.

#### Acceptance Criteria

1. THE Finance_Manager SHALL organize code into separate 'ui' folder for React frontend and 'node' folder for Express backend
2. THE Frontend_App SHALL use React Functional Components and Hooks exclusively
3. THE Database_Service SHALL implement PostgreSQL schema with proper relationships and constraints
4. THE Backend_API SHALL follow RESTful API design principles for all endpoints

### Requirement 8: Data Persistence and Integrity

**User Story:** As a user, I want my financial data to be safely stored and accurately maintained, so that I can trust the application with my financial information.

#### Acceptance Criteria

1. THE Database_Service SHALL ensure transaction amounts maintain precision for financial calculations
2. THE Database_Service SHALL enforce referential integrity between users and transactions tables
3. WHEN database operations fail, THE Backend_API SHALL return appropriate error responses
4. THE Database_Service SHALL support concurrent user access without data corruption

### Requirement 9: Administrative User Management

**User Story:** As an admin, I want to manage all users in the system, so that I can maintain user accounts and control access.

#### Acceptance Criteria

1. WHEN an admin requests user list, THE Backend_API SHALL return all users in the database
2. WHEN an admin submits user information changes, THE Backend_API SHALL update the user record
3. WHEN an admin changes user status, THE Backend_API SHALL update the user status to active or inactive
4. WHERE a user has admin role, THE Frontend_App SHALL provide access to the users management page
5. THE RBAC_Service SHALL restrict user management endpoints to admin role only
6. WHEN an admin creates a new user, THE Backend_API SHALL add the user to the database with specified role

### Requirement 10: User Search and Management Interface

**User Story:** As an admin, I want to search and filter users, so that I can efficiently manage large numbers of user accounts.

#### Acceptance Criteria

1. WHEN an admin enters search criteria, THE Backend_API SHALL filter users by name, email, or status
2. THE Frontend_App SHALL provide a search input field on the users management page
3. WHEN search results are returned, THE Frontend_App SHALL display matching users in a table format
4. THE Frontend_App SHALL provide controls for editing user information and changing user status
5. WHEN no search criteria are provided, THE Frontend_App SHALL display all users

### Requirement 11: Enhanced User Experience Flow

**User Story:** As a user, I want a streamlined login experience that directs me to the appropriate page, so that I can quickly access my financial data.

#### Acceptance Criteria

1. WHEN a user first visits the application, THE Frontend_App SHALL display the signin/signup page
2. WHEN a user successfully logs in, THE Frontend_App SHALL redirect to the transaction page
3. WHERE a user has admin role, THE Frontend_App SHALL provide navigation to the users management page
4. THE Frontend_App SHALL maintain user session state across page navigation
5. WHEN a user logs out, THE Frontend_App SHALL redirect to the signin/signup page

### Requirement 12: Database Configuration and Setup

**User Story:** As a developer, I want standardized database configuration, so that the application connects reliably to the PostgreSQL database.

#### Acceptance Criteria

1. THE Database_Service SHALL connect to database named "helpdb"
2. THE Database_Service SHALL use port 5432 for database connections
3. THE Database_Service SHALL connect to localhost as the database host
4. THE Database_Service SHALL authenticate using password "Secure@123"
5. THE Database_Service SHALL handle connection errors gracefully and provide meaningful error messages
