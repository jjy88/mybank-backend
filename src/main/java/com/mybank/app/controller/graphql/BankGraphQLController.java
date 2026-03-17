package com.mybank.app.controller.graphql;

import com.mybank.app.model.*;
import com.mybank.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Controller
public class BankGraphQLController {

    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private BranchRepository branchRepository;

    @QueryMapping
    public CustomerEntity customer(@Argument Long id) {
        return customerRepository.findById(id).orElse(null);
    }

    @QueryMapping
    public List<CustomerEntity> customers() {
        return customerRepository.findAll();
    }

    @QueryMapping
    public AccountEntity account(@Argument Long id) {
        return accountRepository.findById(id).orElse(null);
    }

    @QueryMapping
    public List<AccountEntity> accountsByCustomer(@Argument Long customerId) {
        return accountRepository.findByUserId(customerId).orElse(Collections.emptyList());
    }

    @QueryMapping
    public List<TransactionEntity> transactions(@Argument Long accountId) {
        return transactionRepository.findByFromAccountIdInOrToAccountIdIn(
            List.of(accountId), List.of(accountId));
    }

    @QueryMapping
    public List<TransactionEntity> allTransactions() {
        return transactionRepository.findAll();
    }

    @QueryMapping
    public List<BranchEntity> branches() {
        return branchRepository.findAll();
    }

    @QueryMapping
    public BranchEntity branch(@Argument Long id) {
        return branchRepository.findById(id).orElse(null);
    }

    @SchemaMapping(typeName = "Customer", field = "accounts")
    public List<AccountEntity> customerAccounts(CustomerEntity customer) {
        return accountRepository.findByUserId(customer.getUserId()).orElse(Collections.emptyList());
    }

    @SchemaMapping(typeName = "Account", field = "transactions")
    public List<TransactionEntity> accountTransactions(AccountEntity account) {
        return transactionRepository.findByFromAccountIdInOrToAccountIdIn(
            List.of(account.getAccountId()), List.of(account.getAccountId()));
    }
}
