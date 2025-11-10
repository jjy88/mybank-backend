-- ================================================================
-- MyBank: full rebuild schema + minimal seed + quick checks (FULL)
-- Compatible with MySQL 8.0+
-- ================================================================

-- 0) Create / select database
DROP DATABASE IF EXISTS mybank;
CREATE DATABASE mybank
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
USE mybank;

-- 1) Drop tables in FK-safe order (only needed for rebuilds)
DROP TABLE IF EXISTS `transaction`;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS teller;
DROP TABLE IF EXISTS admin;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS branch;

-- 2) BRANCH
CREATE TABLE branch (
  branch_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  branch_name   VARCHAR(150) NOT NULL,
  address       VARCHAR(255),
  city          VARCHAR(100),
  province      VARCHAR(100),
  postal_code   VARCHAR(20),
  phone_number  VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) CUSTOMER (matches CustomerEntity + UserEntity fields used by app)
CREATE TABLE customer (
  user_id       BIGINT PRIMARY KEY AUTO_INCREMENT,
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  email         VARCHAR(200) UNIQUE,      -- login identifier
  password      VARCHAR(255),             -- plain text in current codebase
  role          VARCHAR(50),              -- e.g., 'CUSTOMER'
  address       VARCHAR(255),
  phone_number  VARCHAR(50),
  date_of_birth DATE,
  sin           INT,
  branch_id     BIGINT,
  CONSTRAINT fk_customer_branch
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) TELLER
CREATE TABLE teller (
  user_id       BIGINT PRIMARY KEY AUTO_INCREMENT,
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  email         VARCHAR(200) UNIQUE,
  password      VARCHAR(255),
  role          VARCHAR(50),              -- e.g., 'TELLER'
  branch_name   VARCHAR(200),
  branch_id     BIGINT,
  CONSTRAINT fk_teller_branch
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) ADMIN
CREATE TABLE admin (
  user_id       BIGINT PRIMARY KEY AUTO_INCREMENT,
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  email         VARCHAR(200) UNIQUE,
  password      VARCHAR(255),
  role          VARCHAR(50),              -- e.g., 'ADMIN'
  admin_level   VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6) ACCOUNT (matches AccountEntity)
CREATE TABLE account (
  account_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id       BIGINT,                   -- FK to customer.user_id
  account_type  VARCHAR(50),              -- 'CHECKING' / 'SAVINGS'...
  balance       DECIMAL(19,4),
  CONSTRAINT fk_account_user
    FOREIGN KEY (user_id) REFERENCES customer(user_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7) TRANSACTION (keyword-safe name with backticks)
CREATE TABLE `transaction` (
  transaction_id  BIGINT PRIMARY KEY AUTO_INCREMENT,
  from_account_id BIGINT,
  to_account_id   BIGINT,
  amount          DECIMAL(19,4),
  timestamp       DATETIME,
  type            VARCHAR(50),            -- 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER'
  description     VARCHAR(255),
  CONSTRAINT fk_tx_from_account
    FOREIGN KEY (from_account_id) REFERENCES account(account_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_tx_to_account
    FOREIGN KEY (to_account_id) REFERENCES account(account_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8) Indexes
CREATE INDEX idx_customer_email  ON customer(email);
CREATE INDEX idx_teller_email    ON teller(email);
CREATE INDEX idx_account_user    ON account(user_id);
CREATE INDEX idx_tx_from_to      ON `transaction`(from_account_id, to_account_id);

-- ================================================================
-- Seed data so the app can be used immediately from the UI
-- Login email/password: alice@bank.ca / pass1234
-- ================================================================
START TRANSACTION;

-- Branch
INSERT INTO branch (branch_name, address, city, province, postal_code, phone_number)
VALUES ('Downtown Montreal', '123 Demo St', 'Montreal', 'QC', 'H1A 1A1', '514-555-0000');
SET @branch_id := LAST_INSERT_ID();

-- Customer (ensure no duplicate email)
SET @email := 'alice@bank.ca';
DELETE FROM customer WHERE email = @email;

INSERT INTO customer
  (first_name, last_name, email, password, role, address, phone_number, date_of_birth, sin, branch_id)
VALUES
  ('Alice', 'Wong', @email, 'pass1234', 'CUSTOMER',
   '123 Demo St, Montreal', '5145550000', '1995-07-15', 123456789, @branch_id);

SET @uid := LAST_INSERT_ID();

-- Account
INSERT INTO account (user_id, account_type, balance)
VALUES (@uid, 'CHECKING', 5000.00);
SET @acc := LAST_INSERT_ID();

-- Sample transactions
INSERT INTO `transaction` (from_account_id, to_account_id, amount, timestamp, type, description)
VALUES
  (NULL, @acc, 1000.00, NOW() - INTERVAL 5 DAY, 'DEPOSIT',  'Initial deposit'),
  (@acc, NULL,  150.00,  NOW() - INTERVAL 2 DAY, 'WITHDRAW', 'ATM withdrawal');

COMMIT;

-- ================================================================
-- Quick checks (these select statements verify the seed)
-- ================================================================
SELECT user_id, first_name, last_name, email, role
FROM customer
WHERE email = 'alice@bank.ca';

SELECT account_id, user_id, account_type, balance
FROM account
WHERE user_id = @uid;

SELECT transaction_id, from_account_id, to_account_id, amount, type, timestamp
FROM `transaction`
WHERE from_account_id = @acc OR to_account_id = @acc
ORDER BY timestamp DESC;
