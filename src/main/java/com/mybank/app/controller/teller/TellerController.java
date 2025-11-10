package com.mybank.app.controller.teller;

import com.mybank.app.model.*;
import com.mybank.app.service.teller.TellerService;
import com.mybank.app.util.ApiResponse;
import com.mybank.app.util.Validator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        try {
            TransactionEntity tx = service.tellerDeposit(accountId, amount);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Deposit successful", tx));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<TransactionEntity>> withdraw(@RequestBody Map<String,Object> body) {
        Long accountId = Long.valueOf(String.valueOf(body.get("accountId")));
        java.math.BigDecimal amount = new java.math.BigDecimal(String.valueOf(body.get("amount")));
        try {
            TransactionEntity tx = service.tellerWithdraw(accountId, amount);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Withdraw successful", tx));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}