# 🏦 MyBank - Banking Management System

A full-stack banking management system built with **Spring Boot** and **MySQL**, developed as a group project. This RESTful API backend provides comprehensive banking operations for customers, tellers, and administrators.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Contributors](#-contributors)

## ✨ Features

### 👥 Customer Portal
- Account registration and authentication
- View account details and balance
- View transaction history
- Transfer funds between accounts
- Deposit and withdrawal operations

### 💼 Teller Portal
- Customer account management
- Process deposits and withdrawals
- View customer information
- Transaction processing
- Branch-specific operations

### 🔐 Admin Portal
- User management (customers, tellers, admins)
- Branch management
- System-wide transaction oversight
- Account creation and management
- Generate reports and statistics

## 🛠 Tech Stack

- **Backend Framework**: Spring Boot 3.2.4
- **Language**: Java 17
- **Database**: MySQL 8.0+
- **ORM**: Spring Data JPA / Hibernate
- **Build Tool**: Maven
- **API**: RESTful API with JSON responses

## 📁 Project Structure

```
mybank-backend-mysql-v12/
├── src/
│   └── main/
│       ├── java/com/mybank/app/
│       │   ├── controller/      # REST API controllers
│       │   │   ├── admin/       # Admin endpoints
│       │   │   ├── customer/    # Customer endpoints
│       │   │   └── teller/      # Teller endpoints
│       │   ├── model/           # JPA entities
│       │   ├── repository/      # Data access layer
│       │   ├── service/         # Business logic
│       │   ├── dto/             # Data transfer objects
│       │   ├── util/            # Utilities & validators
│       │   └── config/          # Configuration classes
│       └── resources/
│           ├── application.properties  # Database config
│           └── static/          # Frontend files (HTML/CSS/JS)
├── mybank_schema.sql            # Database schema & seed data
└── pom.xml                      # Maven dependencies
```

## 🚀 Getting Started

### Prerequisites

- Java 17 or higher
- MySQL 8.0+
- Maven 3.6+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jjy88/mybank-backend.git
   cd mybank-backend
   ```

2. **Set up the database**
   ```bash
   # Log into MySQL
   mysql -u root -p

   # Execute the schema file
   source mybank_schema.sql
   ```

3. **Configure database credentials**

   Edit `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/mybank
   spring.datasource.username=YOUR_USERNAME
   spring.datasource.password=YOUR_PASSWORD
   ```

4. **Build and run**
   ```bash
   # Clean and build
   mvn clean package

   # Run the application
   mvn spring-boot:run
   ```

5. **Access the application**

   Backend API: `http://localhost:8080`

## 🔌 API Endpoints

### Customer Endpoints
```
POST   /customer/register      # Register new customer
POST   /customer/login         # Customer login
GET    /customer/account/{id}  # Get account details
GET    /customer/transactions  # Get transaction history
POST   /customer/transfer      # Transfer funds
POST   /customer/deposit       # Deposit money
POST   /customer/withdraw      # Withdraw money
```

### Teller Endpoints
```
POST   /teller/login           # Teller login
GET    /teller/customers       # View all customers
POST   /teller/deposit         # Process deposit
POST   /teller/withdraw        # Process withdrawal
GET    /teller/customer/{id}   # Get customer details
```

### Admin Endpoints
```
POST   /admin/login            # Admin login
GET    /admin/users            # Get all users
POST   /admin/create-account   # Create new account
GET    /admin/branches         # Get all branches
POST   /admin/create-branch    # Create new branch
GET    /admin/transactions     # View all transactions
DELETE /admin/user/{id}        # Delete user
```

## 🗃 Database Schema

### Main Tables

- **branch**: Bank branch information
- **customer**: Customer accounts and details
- **teller**: Teller accounts linked to branches
- **admin**: Administrative accounts
- **account**: Banking accounts (savings, checking)
- **transaction**: Financial transaction records

### Relationships

- Customers → Branch (Many-to-One)
- Tellers → Branch (Many-to-One)
- Accounts → Customer (Many-to-One)
- Transactions → Account (Many-to-One)

See `mybank_schema.sql` for complete schema definition.

## 🧪 Testing

Run the application and test endpoints using:
- **Postman**: Import the API collection
- **cURL**: Command-line testing
- **Browser**: Access static frontend files

Example cURL request:
```bash
curl -X POST http://localhost:8080/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

## 📝 Configuration

### Application Properties

Key configurations in `application.properties`:

```properties
# Server port
server.port=8080

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/mybank
spring.jpa.hibernate.ddl-auto=update

# Logging
logging.level.com.mybank=DEBUG
```

## 🔒 Security Notes

⚠️ **Important**: This is an academic project. For production use, implement:
- Password encryption (BCrypt)
- JWT authentication
- Input validation & sanitization
- SQL injection prevention
- HTTPS encryption
- Rate limiting

## 🤝 Contributors

This project was developed as a group assignment for [Course Name/Number] at [University Name], Fall 2024.

**Team Members:**
- [Your Name] - Backend Development
- [Team Member 2] - Database Design
- [Team Member 3] - Frontend Development
- [Team Member 4] - API Integration

## 📄 License

This project is for educational purposes only.

## 🙏 Acknowledgments

- Course instructor: [Instructor Name]
- Spring Boot Documentation
- MySQL Documentation

---

**Built with ❤️ by the MyBank Team**

