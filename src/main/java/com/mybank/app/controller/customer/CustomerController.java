package com.mybank.app.controller.customer;

import com.mybank.app.model.*;
import com.mybank.app.service.customer.CustomerService;
import com.mybank.app.util.ApiResponse;
import com.mybank.app.util.Validator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/customer")
public class CustomerController {
    @Autowired
    private CustomerService service;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        if (Validator.isNullOrEmpty(email) || Validator.isNullOrEmpty(password)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("email and password required"));
        }
        Optional<CustomerEntity> c = service.login(email, password);
        if (c.isPresent()) {
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("userId", c.get().getUserId());
            return ResponseEntity.ok(ApiResponse.success("Login successful", responseData));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid credentials"));
        }
    }

    @PostMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> profile(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        Optional<CustomerEntity> profile = service.getProfile(userId);
        if (profile.isPresent()) {
            Map <String, Object> responseData = new HashMap<>();
            responseData.put("userId", profile.get().getUserId());
            responseData.put("firstName", profile.get().getFirstName());
            responseData.put("lastName", profile.get().getLastName());
            responseData.put("email", profile.get().getEmail());
            responseData.put("address", profile.get().getAddress());
            responseData.put("phoneNumber", profile.get().getPhoneNumber());
            responseData.put("dateOfBirth", profile.get().getDateOfBirth());
            responseData.put("sin", profile.get().getSin());
            return ResponseEntity.ok(ApiResponse.success("Profile fetched", responseData));
            // return ResponseEntity.ok(ApiResponse.success("Profile fetched", profile.get()));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("not found"));
        }
    }

    @PostMapping("/update_profile")
    public ResponseEntity<ApiResponse<CustomerEntity>> updateProfile(@RequestBody Map<String, Object> updated) {
        boolean isUpdateEmail = false;
        boolean isUpdatePhone = false;

        if (updated.containsKey("userId") && updated.get("userId") == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("userId required"));
        }

        Long userId = Long.valueOf(String.valueOf(updated.get("userId")));
        
        Optional<CustomerEntity> existingProfile = service.getProfile(userId);
        if (existingProfile.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Profile not found"));
        }

        CustomerEntity profile = existingProfile.get();

        if (updated.containsKey("email") && updated.get("email") != null) {
            String newEmail = updated.get("email").toString().trim();
            Optional<CustomerEntity> emailCheck = service.findByEmail(newEmail);

            if (emailCheck.isPresent() && !emailCheck.get().getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("Email already taken by another user"));
            } else {
                isUpdateEmail = true;
            }
        }
        

        if (updated.containsKey("phoneNumber") && updated.get("phoneNumber") != null) {
            String newPhoneNumber = updated.get("phoneNumber").toString().trim();
            Optional<CustomerEntity> phoneCheck = service.findByPhoneNumber(newPhoneNumber);

            if (phoneCheck.isPresent() && !phoneCheck.get().getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("Phone number already taken by another user"));
            } else {
                isUpdatePhone = true;
            }
        }

        if (isUpdateEmail) {
            profile.setEmail(updated.get("email").toString().trim());
        }

        if (isUpdatePhone) {
            profile.setPhoneNumber(updated.get("phoneNumber").toString().trim());
        }

        if (updated.containsKey("firstName") && updated.get("firstName") != null) {
            profile.setFirstName((String) updated.get("firstName"));
        }

        if (updated.containsKey("lastName") && updated.get("lastName") != null) {
            profile.setLastName((String) updated.get("lastName"));
        }

        if (updated.containsKey("address") && updated.get("address") != null) {
            profile.setAddress((String) updated.get("address"));
        }
        
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", service.updateProfile(userId, profile).get()));
    }

    @PostMapping("/change_password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> changePassword(@RequestBody Map<String, String> body){
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        Optional<CustomerEntity> profile = service.getProfile(userId);
        if (profile.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("not found"));
        }
        CustomerEntity customer = profile.get();
        if (!customer.getPassword().equals(oldPassword)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Old password is incorrect"));
        }
        customer.setPassword(newPassword);
        service.updateProfile(userId, customer);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", Map.of("userId", userId)));
    }

    @PostMapping("/account_details")
    public ResponseEntity<ApiResponse<List<Map<String,Object>>>> accountDetails(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        Optional<List<AccountEntity>> acc = service.getAccountDetails(userId);
        
        if (acc.isPresent()) {
            // Map<String, Object> test2 = Map.of(
            //         "accountId", acc.get().getAccountId(),
            //         "userId", acc.get().getUserId(),
            //         "accountType", acc.get().getAccountType(),
            //         "balance", acc.get().getBalance()
            // );
            List<Map<String, Object>> test2 = new java.util.ArrayList<>();
            for (int i = 0; i < acc.get().size(); i++) {
                AccountEntity account = acc.get().get(i);
                Map<String, Object> accountData = new HashMap<>();
                accountData.put("accountId", account.getAccountId());
                accountData.put("userId", account.getUserId());
                accountData.put("accountType", account.getAccountType());
                accountData.put("balance", account.getBalance());
                test2.add(accountData);
            }
            return ResponseEntity.ok(ApiResponse.success("Account details fetched", test2));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("account not found"));
        }
    }

    @PostMapping("/balance")
    public ResponseEntity<ApiResponse<Map<String, Object>>> balance(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        Long accountId = Long.valueOf(String.valueOf(body.get("accountId")));
        Optional<java.math.BigDecimal> bal = service.getBalance(userId, accountId);
        if (bal.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success("Balance fetched", Map.of("balance", bal.get())));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Account not found"));
        }
    }

    @PostMapping("/transaction_history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> transactionHistory(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        Long accountId = Long.valueOf(String.valueOf(body.get("accountId")));

        List<Map<String, Object>> tx = service.getTransactionHistory(userId, accountId);
        if(tx.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("No transactions found"));
        } else {
            return ResponseEntity.ok(ApiResponse.success("Transactions fetched", tx));
        }
    }

    @PostMapping("/deposit")
    public ResponseEntity<ApiResponse<TransactionEntity>> deposit(@RequestBody Map<String, Object> body) {
        Long accountId = Long.valueOf(String.valueOf(body.get("accountId")));
        java.math.BigDecimal amount = new java.math.BigDecimal(String.valueOf(body.get("amount")));
        try {
            TransactionEntity tx = service.deposit(accountId, amount);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Deposit successful", tx));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<TransactionEntity>> withdraw(@RequestBody Map<String, Object> body) {
        Long accountId = Long.valueOf(String.valueOf(body.get("accountId")));
        java.math.BigDecimal amount = new java.math.BigDecimal(String.valueOf(body.get("amount")));
        try {
            TransactionEntity tx = service.withdraw(accountId, amount);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Withdraw successful", tx));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TransactionEntity>> transfer(@RequestBody Map<String, Object> body) {
        Long fromAccountId = Long.valueOf(String.valueOf(body.get("fromAccountId")));
        Long toAccountId = Long.valueOf(String.valueOf(body.get("toAccountId")));
        String description = String.valueOf(body.get("description"));
        java.math.BigDecimal amount = new java.math.BigDecimal(String.valueOf(body.get("amount")));
        try {
            TransactionEntity tx = service.transfer(fromAccountId, toAccountId, amount, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Transfer successful", tx));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
