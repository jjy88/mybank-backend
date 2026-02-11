package com.mybank.app.service.admin;

import com.mybank.app.model.*;
import com.mybank.app.repository.*;
import com.mybank.app.util.Validator;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
public class AdminService {
    @Autowired
    private AdminRepository adminRepo;
    @Autowired
    private CustomerRepository customerRepo;
    @Autowired
    private TellerRepository tellerRepo;
    @Autowired
    private BranchRepository branchRepo;
    @Autowired
    private TransactionRepository transactionRepo;
    @Autowired
    private AccountRepository accountRepo;

    public Optional<AdminEntity> login(String email, String password) {
        return adminRepo.findByEmailAndPassword(email, password);
    }

    public List<CustomerEntity> getAllCustomers() {
        return customerRepo.findAll();
    }

    public List<CustomerEntity> searchCustomers(String searchTerm, Long branchId, Long accountId) {
        List<CustomerEntity> all = customerRepo.findAll();
        
        // Apply text search (first name, last name, address, email)
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
        
        // Apply branch filter
        if (branchId != null) {
            all = all.stream()
                    .filter(c -> c.getBranchId() != null && c.getBranchId().equals(branchId))
                    .collect(java.util.stream.Collectors.toList());
        }
        
        // Apply account ID filter (find customers who have this account)
        if (accountId != null) {
            List<Long> customerIdsWithAccount = accountRepo.findAll().stream()
                    .filter(acc -> acc.getAccountId().equals(accountId))
                    .map(AccountEntity::getUserId)
                    .collect(java.util.stream.Collectors.toList());
            
            if (!customerIdsWithAccount.isEmpty()) {
                all = all.stream()
                        .filter(c -> customerIdsWithAccount.contains(c.getUserId()))
                        .collect(java.util.stream.Collectors.toList());
            } else {
                // No customer has this account, return empty
                return List.of();
            }
        }
        
        return all;
    }

    public boolean removeCustomer(Long id) {
        if (customerRepo.existsById(id)) { customerRepo.deleteById(id); return true; }
        return false;
    }

    public CustomerEntity updateCustomer(Long customerId, String firstName, String lastName, String email,
                                         String phoneNumber, String address, java.time.LocalDate dateOfBirth, 
                                         Integer sin, Long branchId) {
        CustomerEntity customer = customerRepo.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        if (firstName != null) customer.setFirstName(firstName);
        if (lastName != null) customer.setLastName(lastName);
        if (email != null) {
            Optional<CustomerEntity> existing = customerRepo.findByEmail(email);
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
            if (!branchRepo.findById(branchId).isPresent()) {
                throw new RuntimeException("Branch not found");
            }
            customer.setBranchId(branchId);
        }
        
        return customerRepo.save(customer);
    }

    public List<TellerEntity> getAllTellers() {
        return tellerRepo.findAll();
    }

    public TellerEntity createTeller(String firstName, String lastName, String email, String password, 
                                     String branchName, Long branchId) {
        if (Validator.isNullOrEmpty(email) || Validator.isNullOrEmpty(password)) {
            throw new RuntimeException("Email and password are required");
        }
        if (tellerRepo.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        if (branchId != null && !branchRepo.findById(branchId).isPresent()) {
            throw new RuntimeException("Branch not found");
        }
        
        TellerEntity teller = new TellerEntity();
        teller.setFirstName(firstName);
        teller.setLastName(lastName);
        teller.setEmail(email);
        teller.setPassword(password);
        teller.setRole("TELLER");
        teller.setBranchName(branchName);
        teller.setBranchId(branchId);
        
        return tellerRepo.save(teller);
    }

    public TellerEntity updateTeller(Long tellerId, String firstName, String lastName, String email,
                                    String branchName, Long branchId) {
        TellerEntity teller = tellerRepo.findById(tellerId)
                .orElseThrow(() -> new RuntimeException("Teller not found"));
        
        if (firstName != null) teller.setFirstName(firstName);
        if (lastName != null) teller.setLastName(lastName);
        if (email != null) {
            Optional<TellerEntity> existing = tellerRepo.findByEmail(email);
            if (existing.isPresent() && !existing.get().getUserId().equals(tellerId)) {
                throw new RuntimeException("Email already taken by another teller");
            }
            teller.setEmail(email);
        }
        if (branchName != null) teller.setBranchName(branchName);
        if (branchId != null) {
            if (!branchRepo.findById(branchId).isPresent()) {
                throw new RuntimeException("Branch not found");
            }
            teller.setBranchId(branchId);
        }
        
        return tellerRepo.save(teller);
    }

    public boolean removeTeller(Long id) {
        if (tellerRepo.existsById(id)) { tellerRepo.deleteById(id); return true; }
        return false;
    }

    public List<BranchEntity> getAllBranches() {
        return branchRepo.findAll();
    }

    public BranchEntity createBranch(String branchName, String address, String city, 
                                    String province, String postalCode, String phoneNumber) {
        if (Validator.isNullOrEmpty(branchName)) {
            throw new RuntimeException("Branch name is required");
        }
        
        BranchEntity branch = new BranchEntity();
        branch.setBranchName(branchName);
        branch.setAddress(address);
        branch.setCity(city);
        branch.setProvince(province);
        branch.setPostalCode(postalCode);
        branch.setPhoneNumber(phoneNumber);
        
        return branchRepo.save(branch);
    }

    public BranchEntity updateBranch(Long branchId, String branchName, String address, String city,
                                     String province, String postalCode, String phoneNumber) {
        BranchEntity branch = branchRepo.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));
        
        if (branchName != null) branch.setBranchName(branchName);
        if (address != null) branch.setAddress(address);
        if (city != null) branch.setCity(city);
        if (province != null) branch.setProvince(province);
        if (postalCode != null) branch.setPostalCode(postalCode);
        if (phoneNumber != null) branch.setPhoneNumber(phoneNumber);
        
        return branchRepo.save(branch);
    }

    public boolean removeBranch(Long id) {
        if (branchRepo.existsById(id)) { branchRepo.deleteById(id); return true; }
        return false;
    }

    public List<Map<String, Object>> getAllTransactions() {
        return transactionRepo.findAll().stream()
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
                .collect(java.util.stream.Collectors.toList());
    }
}
