package com.mybank.app.service.customer;

import com.mybank.app.model.*;
import com.mybank.app.repository.*;
import com.mybank.app.util.Validator;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CustomerService {
    @Autowired
    private CustomerRepository customerRepo;
    @Autowired
    private AccountRepository accountRepo;
    @Autowired
    private TransactionRepository transactionRepo;
    @Autowired
    private TellerRepository tellerRepo;

    public Optional<CustomerEntity> login(String email, String password) {
        return customerRepo.findByEmailAndPassword(email, password);
    }

    public Optional<CustomerEntity> getProfile(Long id) {
        return customerRepo.findById(id);
    }

    public Optional<CustomerEntity> findByEmail(String email) {
        return customerRepo.findByEmail(email);
    }

    public Optional<CustomerEntity> findByPhoneNumber(String phoneNumber) {
        return customerRepo.findByPhoneNumber(phoneNumber);
    }

    public Optional<CustomerEntity> updateProfile(Long id, CustomerEntity updated) {
        return customerRepo.findById(id).map(existing -> {
            updated.setUserId(id);
            return customerRepo.save(updated);
        });
    }

    public List<Map<String, Object>> getTransactionHistory(Long userId, Long accountId) {
        // Fetch all accounts for this user
        Optional<List<AccountEntity>> accounts = accountRepo.findByUserId(userId);
        if (accounts.isEmpty()) {
            return List.of();
        }

        // Get all account IDs linked to this user
        List<Long> accountIds = accounts.get().stream()
                .map(AccountEntity::getAccountId)
                .collect(Collectors.toList());

        // Verify that the requested account belongs to this user
        if (!accountIds.contains(accountId)) {
            return List.of();
        }

        // Get all transactions involving any of this user's accounts
        List<TransactionEntity> transactions = transactionRepo.findByFromAccountIdInOrToAccountIdIn(accountIds, accountIds);

        // Filter only the ones that match the selected accountId and enrich with teller name
        return transactions.stream()
                .filter(tx -> Objects.equals(tx.getFromAccountId(), accountId) || Objects.equals(tx.getToAccountId(), accountId))
                .sorted(Comparator.comparing(TransactionEntity::getTimestamp).reversed())
                .map(tx -> {
                    Map<String, Object> txMap = new HashMap<>();
                    txMap.put("transactionId", tx.getTransactionId());
                    txMap.put("fromAccountId", tx.getFromAccountId());
                    txMap.put("toAccountId", tx.getToAccountId());
                    txMap.put("amount", tx.getAmount());
                    txMap.put("timestamp", tx.getTimestamp());
                    txMap.put("type", tx.getType());
                    txMap.put("description", tx.getDescription());
                    txMap.put("tellerId", tx.getTellerId());
                    
                    // Fetch teller name if tellerId exists
                    if (tx.getTellerId() != null) {
                        tellerRepo.findById(tx.getTellerId()).ifPresent(teller -> {
                            String tellerName = (teller.getFirstName() != null ? teller.getFirstName() : "") + 
                                              (teller.getLastName() != null ? " " + teller.getLastName() : "");
                            txMap.put("tellerName", tellerName.trim().isEmpty() ? null : tellerName.trim());
                        });
                    } else {
                        txMap.put("tellerName", null);
                    }
                    
                    return txMap;
                })
                .collect(Collectors.toList());
    }

    public Optional<List<AccountEntity>> getAccountDetails(Long userId) {
        return accountRepo.findByUserId(userId);
    }

    public Optional<BigDecimal> getBalance(Long userId, Long accountId) {
        return getAccountDetails(userId).flatMap(accounts -> 
            accounts.stream()
                    .filter(acc -> acc.getAccountId().equals(accountId))
                    .findFirst()
                    .map(AccountEntity::getBalance)
        );
        // return getAccountDetails(userId).map(AccountEntity::getBalance);
    }

    public TransactionEntity deposit(Long accountId, BigDecimal amount) {
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
        tx.setDescription("Deposit");
        return transactionRepo.save(tx);
    }

    public TransactionEntity withdraw(Long accountId, BigDecimal amount) {
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
        tx.setDescription("Withdraw");
        return transactionRepo.save(tx);
    }

    public TransactionEntity transfer(Long fromAccountId, Long toAccountId, BigDecimal amount, String description) {
        if (!Validator.isPositiveNumber(amount)) {
            throw new RuntimeException("Amount must be positive");
        }
        if (fromAccountId.equals(toAccountId)) {
            throw new RuntimeException("Cannot transfer to the same account");
        }
        AccountEntity from = accountRepo.findById(fromAccountId).orElseThrow(() -> new RuntimeException("From account not found"));
        AccountEntity to = accountRepo.findById(toAccountId).orElseThrow(() -> new RuntimeException("To account not found"));
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
        tx.setDescription(description != null ? description : "Transfer");
        return transactionRepo.save(tx);
    }
}
