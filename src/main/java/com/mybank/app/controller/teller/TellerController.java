package com.mybank.app.controller.teller;

import com.mybank.app.model.*;
import com.mybank.app.service.teller.TellerService;
import com.mybank.app.util.ApiResponse;
import com.mybank.app.util.Validator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/teller")
public class TellerController {
    @Autowired
    private TellerService service;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TellerEntity>> login(@RequestBody Map<String,String> body) {
        String email = body.get("email");
        String password = body.get("password");
        if (Validator.isNullOrEmpty(email) || Validator.isNullOrEmpty(password)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("email and password required"));
        }
        Optional<TellerEntity> t = service.login(email, password);
        if (t.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success("Login successful", t.get()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid credentials"));
        }
    }

    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<CustomerEntity>>> customers() {
        return ResponseEntity.ok(ApiResponse.success("Customers fetched", service.getAllCustomers()));
    }

    @PostMapping("/deposit")
    public ResponseEntity<ApiResponse<TransactionEntity>> deposit(@RequestBody Map<String,Object> body) {
        Long accountId = Long.valueOf(String.valueOf(body.get("accountId")));
        java.math.BigDecimal amount = new java.math.BigDecimal(String.valueOf(body.get("amount")));
        Long tellerId = body.containsKey("tellerId") ? Long.valueOf(String.valueOf(body.get("tellerId"))) : null;
        try {
            TransactionEntity tx = service.tellerDeposit(accountId, amount, tellerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Deposit successful", tx));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<TransactionEntity>> withdraw(@RequestBody Map<String,Object> body) {
        Long accountId = Long.valueOf(String.valueOf(body.get("accountId")));
        java.math.BigDecimal amount = new java.math.BigDecimal(String.valueOf(body.get("amount")));
        Long tellerId = body.containsKey("tellerId") ? Long.valueOf(String.valueOf(body.get("tellerId"))) : null;
        try {
            TransactionEntity tx = service.tellerWithdraw(accountId, amount, tellerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Withdraw successful", tx));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TransactionEntity>> transfer(@RequestBody Map<String,Object> body) {
        Long fromAccountId = Long.valueOf(String.valueOf(body.get("fromAccountId")));
        Long toAccountId = Long.valueOf(String.valueOf(body.get("toAccountId")));
        BigDecimal amount = new BigDecimal(String.valueOf(body.get("amount")));
        String description = body.containsKey("description") ? String.valueOf(body.get("description")) : null;
        Long tellerId = body.containsKey("tellerId") ? Long.valueOf(String.valueOf(body.get("tellerId"))) : null;
        try {
            TransactionEntity tx = service.tellerTransfer(fromAccountId, toAccountId, amount, description, tellerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Transfer successful", tx));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/create_customer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCustomer(@RequestBody Map<String,Object> body) {
        try {
            String firstName = String.valueOf(body.get("firstName"));
            String lastName = String.valueOf(body.get("lastName"));
            String email = String.valueOf(body.get("email"));
            String password = String.valueOf(body.get("password"));
            String phoneNumber = body.containsKey("phoneNumber") ? String.valueOf(body.get("phoneNumber")) : null;
            String address = body.containsKey("address") ? String.valueOf(body.get("address")) : null;
            
            LocalDate dateOfBirth = null;
            if (body.containsKey("dateOfBirth") && body.get("dateOfBirth") != null) {
                String dobStr = String.valueOf(body.get("dateOfBirth"));
                dateOfBirth = LocalDate.parse(dobStr);
            }
            
            Integer sin = null;
            if (body.containsKey("sin") && body.get("sin") != null) {
                String sinStr = String.valueOf(body.get("sin")).replaceAll("\\D", "");
                sin = sinStr.isEmpty() ? null : Integer.parseInt(sinStr);
            }
            
            Long branchId = null;
            if (body.containsKey("branchId") && body.get("branchId") != null) {
                branchId = Long.valueOf(String.valueOf(body.get("branchId")));
            }
            
            CustomerEntity customer = service.createCustomer(
                firstName, lastName, email, password, phoneNumber, address, dateOfBirth, sin, branchId);
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("userId", customer.getUserId());
            responseData.put("firstName", customer.getFirstName());
            responseData.put("lastName", customer.getLastName());
            responseData.put("email", customer.getEmail());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Customer created successfully", responseData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/create_account")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createAccount(@RequestBody Map<String,Object> body) {
        try {
            Long customerId = Long.valueOf(String.valueOf(body.get("customerId")));
            String accountType = String.valueOf(body.get("accountType"));
            
            BigDecimal initialDeposit = BigDecimal.ZERO;
            if (body.containsKey("initialDeposit") && body.get("initialDeposit") != null) {
                initialDeposit = new BigDecimal(String.valueOf(body.get("initialDeposit")));
            }
            
            AccountEntity account = service.createAccount(customerId, accountType, initialDeposit);
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("accountId", account.getAccountId());
            responseData.put("userId", account.getUserId());
            responseData.put("accountType", account.getAccountType());
            responseData.put("balance", account.getBalance());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created successfully", responseData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/branches")
    public ResponseEntity<ApiResponse<List<BranchEntity>>> getBranches() {
        return ResponseEntity.ok(ApiResponse.success("Branches fetched", service.getAllBranches()));
    }

    @GetMapping("/search_customers")
    public ResponseEntity<ApiResponse<List<CustomerEntity>>> searchCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long accountId) {
        List<CustomerEntity> customers = service.searchCustomers(
            search != null ? search : "", 
            branchId, 
            accountId
        );
        return ResponseEntity.ok(ApiResponse.success("Customers found", customers));
    }

    @GetMapping("/filter_customers")
    public ResponseEntity<ApiResponse<List<CustomerEntity>>> filterCustomers(@RequestParam(required = false) Long branchId) {
        List<CustomerEntity> customers = service.filterCustomersByBranch(branchId);
        return ResponseEntity.ok(ApiResponse.success("Customers filtered", customers));
    }

    @PostMapping("/update_customer")
    public ResponseEntity<ApiResponse<CustomerEntity>> updateCustomer(@RequestBody Map<String,Object> body) {
        try {
            Long customerId = Long.valueOf(String.valueOf(body.get("customerId")));
            String firstName = body.containsKey("firstName") ? String.valueOf(body.get("firstName")) : null;
            String lastName = body.containsKey("lastName") ? String.valueOf(body.get("lastName")) : null;
            String email = body.containsKey("email") ? String.valueOf(body.get("email")) : null;
            String phoneNumber = body.containsKey("phoneNumber") ? String.valueOf(body.get("phoneNumber")) : null;
            String address = body.containsKey("address") ? String.valueOf(body.get("address")) : null;
            
            LocalDate dateOfBirth = null;
            if (body.containsKey("dateOfBirth") && body.get("dateOfBirth") != null && !String.valueOf(body.get("dateOfBirth")).isEmpty()) {
                dateOfBirth = LocalDate.parse(String.valueOf(body.get("dateOfBirth")));
            }
            
            Integer sin = null;
            if (body.containsKey("sin") && body.get("sin") != null) {
                String sinStr = String.valueOf(body.get("sin")).replaceAll("\\D", "");
                sin = sinStr.isEmpty() ? null : Integer.parseInt(sinStr);
            }
            
            Long branchId = null;
            if (body.containsKey("branchId") && body.get("branchId") != null) {
                branchId = Long.valueOf(String.valueOf(body.get("branchId")));
            }
            
            CustomerEntity customer = service.updateCustomer(customerId, firstName, lastName, email, phoneNumber, address, dateOfBirth, sin, branchId);
            return ResponseEntity.ok(ApiResponse.success("Customer updated successfully", customer));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/processed_transactions")
    public ResponseEntity<ApiResponse<List<TransactionEntity>>> getProcessedTransactions(@RequestParam Long tellerId) {
        try {
            List<TransactionEntity> transactions = service.getTransactionsByTellerId(tellerId);
            return ResponseEntity.ok(ApiResponse.success("Processed transactions fetched", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
}