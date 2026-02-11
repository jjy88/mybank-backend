package com.mybank.app.service.teller;

import com.mybank.app.model.*;
import com.mybank.app.repository.*;
import com.mybank.app.repository.BranchRepository;
import com.mybank.app.util.Validator;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TellerService {
    @Autowired
    private TellerRepository tellerRepo;
    @Autowired
    private AccountRepository accountRepo;
    @Autowired
    private TransactionRepository transactionRepo;
    @Autowired
    private com.mybank.app.repository.CustomerRepository customerRepository;
    @Autowired
    private BranchRepository branchRepository;

    public Optional<TellerEntity> login(String email, String password) {
        return tellerRepo.findByEmailAndPassword(email, password);
    }

    public List<CustomerEntity> getAllCustomers() {
        return customerRepository.findAll();
    }


    public TransactionEntity tellerWithdraw(Long accountId, BigDecimal amount, Long tellerId) {
        if (!Validator.isPositiveNumber(amount)) {
            throw new RuntimeException("Amount must be positive");
        }
        AccountEntity acc = accountRepo.findById(accountId).orElseThrow(() -> new RuntimeException("Account not found"));
        if (!Validator.isSufficientFunds(acc.getBalance(), amount)) {
            throw new RuntimeException("Insufficient funds");
        }
        acc.setBalance(acc.getBalance().subtract(amount));
        accountRepo.save(acc);
        TransactionEntity tx = new TransactionEntity();
        tx.setFromAccountId(accountId);
        tx.setToAccountId(null);
        tx.setAmount(amount);
        tx.setTimestamp(LocalDateTime.now());
        tx.setType("WITHDRAW");
        tx.setDescription("Teller withdraw");
        tx.setTellerId(tellerId);
        return transactionRepo.save(tx);
    }

    public TransactionEntity tellerDeposit(Long accountId, BigDecimal amount, Long tellerId) {
        if (!Validator.isPositiveNumber(amount)) {
            throw new RuntimeException("Amount must be positive");
        }
        AccountEntity acc = accountRepo.findById(accountId).orElseThrow(() -> new RuntimeException("Account not found"));
        acc.setBalance(acc.getBalance().add(amount));
        accountRepo.save(acc);
        TransactionEntity tx = new TransactionEntity();
        tx.setFromAccountId(null);
        tx.setToAccountId(accountId);
        tx.setAmount(amount);
        tx.setTimestamp(LocalDateTime.now());
        tx.setType("DEPOSIT");
        tx.setDescription("Teller deposit");
        tx.setTellerId(tellerId);
        return transactionRepo.save(tx);
    }

    public CustomerEntity createCustomer(
            String firstName, String lastName, String email, String password,
            String phoneNumber, String address, LocalDate dateOfBirth, Integer sin, Long branchId) {
        
        // Validation
        if (Validator.isNullOrEmpty(firstName) || !Validator.isAlphabetic(firstName)) {
            throw new RuntimeException("Valid first name is required");
        }
        if (Validator.isNullOrEmpty(lastName) || !Validator.isAlphabetic(lastName)) {
            throw new RuntimeException("Valid last name is required");
        }
        if (!Validator.isValidEmail(email)) {
            throw new RuntimeException("Valid email is required");
        }
        if (!Validator.isValidPassword(password)) {
            throw new RuntimeException("Password must be at least 6 characters");
        }
        if (dateOfBirth != null && !Validator.isAgeAtLeast18(dateOfBirth)) {
            throw new RuntimeException("Customer must be at least 18 years old");
        }
        if (sin != null && !Validator.isValidSIN(String.valueOf(sin))) {
            throw new RuntimeException("SIN must be 9 digits");
        }
        
        // Check email uniqueness
        if (customerRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        
        // Validate branch exists if provided
        if (branchId != null && !branchRepository.findById(branchId).isPresent()) {
            throw new RuntimeException("Branch not found");
        }
        
        // Create customer
        CustomerEntity customer = new CustomerEntity();
        customer.setFirstName(firstName);
        customer.setLastName(lastName);
        customer.setEmail(email);
        customer.setPassword(password);
        customer.setRole("CUSTOMER");
        customer.setPhoneNumber(phoneNumber);
        customer.setAddress(address);
        customer.setDateOfBirth(dateOfBirth);
        customer.setSin(sin);
        customer.setBranchId(branchId);
        
        CustomerEntity savedCustomer = customerRepository.save(customer);

        // Automatically create a default CHECKING account for the new customer
        createAccount(savedCustomer.getUserId(), "CHECKING", BigDecimal.ZERO);

        return savedCustomer;
    }

    public AccountEntity createAccount(Long customerId, String accountType, BigDecimal initialDeposit) {
        // Validate customer exists
        CustomerEntity customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        // Validate account type
        if (Validator.isNullOrEmpty(accountType)) {
            throw new RuntimeException("Account type is required");
        }
        if (!accountType.equalsIgnoreCase("CHECKING") && 
            !accountType.equalsIgnoreCase("SAVINGS") &&
            !accountType.equalsIgnoreCase("CHEQUING") &&
            !accountType.equalsIgnoreCase("STUDENT") &&
            !accountType.equalsIgnoreCase("BUSINESS")) {
            throw new RuntimeException("Invalid account type");
        }
        
        // Create account
        AccountEntity account = new AccountEntity();
        account.setUserId(customerId);
        account.setAccountType(accountType.toUpperCase());
        account.setBalance(initialDeposit != null && initialDeposit.compareTo(BigDecimal.ZERO) > 0 
                ? initialDeposit : BigDecimal.ZERO);
        
        AccountEntity savedAccount = accountRepo.save(account);
        
        // Create initial deposit transaction if amount > 0
        if (initialDeposit != null && initialDeposit.compareTo(BigDecimal.ZERO) > 0) {
            TransactionEntity tx = new TransactionEntity();
            tx.setFromAccountId(null);
            tx.setToAccountId(savedAccount.getAccountId());
            tx.setAmount(initialDeposit);
            tx.setTimestamp(LocalDateTime.now());
            tx.setType("DEPOSIT");
            tx.setDescription("Initial deposit - Account creation");
            transactionRepo.save(tx);
        }
        
        return savedAccount;
    }

    public TransactionEntity tellerTransfer(Long fromAccountId, Long toAccountId, BigDecimal amount, String description, Long tellerId) {
        if (!Validator.isPositiveNumber(amount)) {
            throw new RuntimeException("Amount must be positive");
        }
        if (fromAccountId.equals(toAccountId)) {
            throw new RuntimeException("Cannot transfer to the same account");
        }
        AccountEntity from = accountRepo.findById(fromAccountId)
                .orElseThrow(() -> new RuntimeException("From account not found"));
        AccountEntity to = accountRepo.findById(toAccountId)
                .orElseThrow(() -> new RuntimeException("To account not found"));
        if (!Validator.isSufficientFunds(from.getBalance(), amount)) {
            throw new RuntimeException("Insufficient funds");
        }
        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));
        accountRepo.save(from);
        accountRepo.save(to);
        TransactionEntity tx = new TransactionEntity();
        tx.setFromAccountId(fromAccountId);
        tx.setToAccountId(toAccountId);
        tx.setAmount(amount);
        tx.setTimestamp(LocalDateTime.now());
        tx.setType("TRANSFER");
        tx.setDescription(description != null ? description : "Teller transfer");
        tx.setTellerId(tellerId);
        return transactionRepo.save(tx);
    }

    public List<BranchEntity> getAllBranches() {
        return branchRepository.findAll();
    }

    public CustomerEntity updateCustomer(Long customerId, String firstName, String lastName, String email,
                                         String phoneNumber, String address, LocalDate dateOfBirth, Integer sin, Long branchId) {
        CustomerEntity customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        if (firstName != null) customer.setFirstName(firstName);
        if (lastName != null) customer.setLastName(lastName);
        if (email != null) {
            Optional<CustomerEntity> existing = customerRepository.findByEmail(email);
            if (existing.isPresent() && !existing.get().getUserId().equals(customerId)) {
                throw new RuntimeException("Email already taken by another customer");
            }
            customer.setEmail(email);
        }
        if (phoneNumber != null) customer.setPhoneNumber(phoneNumber);
        if (address != null) customer.setAddress(address);
        if (dateOfBirth != null) customer.setDateOfBirth(dateOfBirth);
        if (sin != null) customer.setSin(sin);
        if (branchId != null) {
            if (!branchRepository.findById(branchId).isPresent()) {
                throw new RuntimeException("Branch not found");
            }
            customer.setBranchId(branchId);
        }
        
        return customerRepository.save(customer);
    }

    public List<CustomerEntity> searchCustomers(String searchTerm, Long branchId, Long accountId) {
        List<CustomerEntity> all = customerRepository.findAll();
        
        // 1. Text search (name, email, address)
        if (!Validator.isNullOrEmpty(searchTerm)) {
            String lowerSearch = searchTerm.toLowerCase();
            all = all.stream()
                    .filter(c -> 
                        (c.getFirstName() != null && c.getFirstName().toLowerCase().contains(lowerSearch)) ||
                        (c.getLastName() != null && c.getLastName().toLowerCase().contains(lowerSearch)) ||
                        (c.getEmail() != null && c.getEmail().toLowerCase().contains(lowerSearch)) ||
                        (c.getAddress() != null && c.getAddress().toLowerCase().contains(lowerSearch))
                    )
                    .collect(java.util.stream.Collectors.toList());
        }
        
        // 2. Branch filter
        if (branchId != null) {
            all = all.stream()
                    .filter(c -> c.getBranchId() != null && c.getBranchId().equals(branchId))
                    .collect(java.util.stream.Collectors.toList());
        }
        
        // 3. Smart ID Search (Matches either Account ID OR User ID)
        if (accountId != null) {
            // Step A: Find users who own the account with this ID (e.g., input 100 -> finds John)
            List<Long> targetUserIds = accountRepo.findAll().stream()
                    .filter(acc -> acc.getAccountId().equals(accountId))
                    .map(AccountEntity::getUserId)
                    .collect(java.util.stream.Collectors.toList());
            
            // Step B: Also treat the input as a User ID (e.g., input 3 -> finds John)
            // Since Account IDs start at 100 and User IDs start at 1, they won't conflict.
            targetUserIds.add(accountId);
            
            // Step C: Filter the customer list
            all = all.stream()
                    .filter(c -> targetUserIds.contains(c.getUserId()))
                    .collect(java.util.stream.Collectors.toList());
        }
        
        return all;
    }

    public List<CustomerEntity> filterCustomersByBranch(Long branchId) {
        if (branchId == null) {
            return customerRepository.findAll();
        }
        List<CustomerEntity> all = customerRepository.findAll();
        return all.stream()
                .filter(c -> c.getBranchId() != null && c.getBranchId().equals(branchId))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<TransactionEntity> getTransactionsByTellerId(Long tellerId) {
        if (tellerId == null) {
            return List.of();
        }
        return transactionRepo.findByTellerIdOrderByTimestampDesc(tellerId);
    }
}
