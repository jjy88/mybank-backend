package com.mybank.app.service.teller;

import com.mybank.app.model.*;
import com.mybank.app.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
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

    public Optional<TellerEntity> login(String email, String password) {
        return tellerRepo.findByEmailAndPassword(email, password);
    }

    public List<CustomerEntity> getAllCustomers() {
        return customerRepository.findAll();
    }

    public TransactionEntity tellerDeposit(Long accountId, BigDecimal amount) {
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
        return transactionRepo.save(tx);
    }

    public TransactionEntity tellerWithdraw(Long accountId, BigDecimal amount) {
        AccountEntity acc = accountRepo.findById(accountId).orElseThrow(() -> new RuntimeException("Account not found"));
        acc.setBalance(acc.getBalance().subtract(amount));
        accountRepo.save(acc);
        TransactionEntity tx = new TransactionEntity();
        tx.setFromAccountId(accountId);
        tx.setToAccountId(null);
        tx.setAmount(amount);
        tx.setTimestamp(LocalDateTime.now());
        tx.setType("WITHDRAW");
        tx.setDescription("Teller withdraw");
        return transactionRepo.save(tx);
    }
}
