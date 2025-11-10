package com.mybank.app.controller.admin;

import com.mybank.app.model.*;
import com.mybank.app.service.admin.AdminService;
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
@RequestMapping("/admin")
public class AdminController {
    @Autowired
    private AdminService service;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AdminEntity>> login(@RequestBody Map<String,String> body) {
        String email = body.get("email");
        String password = body.get("password");
        if (Validator.isNullOrEmpty(email) || Validator.isNullOrEmpty(password)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("email and password required"));
        }
        Optional<AdminEntity> a = service.login(email, password);
        if (a.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success("Login successful", a.get()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid credentials"));
        }
    }

    @GetMapping("/all_customers")
    public ResponseEntity<ApiResponse<List<CustomerEntity>>> allCustomers() {
        return ResponseEntity.ok(ApiResponse.success("Customers fetched", service.getAllCustomers()));
    }

    @PostMapping("/remove_customer")
    public ResponseEntity<ApiResponse<Void>> removeCustomer(@RequestBody Map<String,Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        boolean ok = service.removeCustomer(userId);
        if (ok) return ResponseEntity.ok(ApiResponse.success("Customer removed", null));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("not found"));
    }

    @PostMapping("/create_teller")
    public ResponseEntity<ApiResponse<TellerEntity>> createTeller(@RequestBody TellerEntity t) {
        if (Validator.isNullOrEmpty(t.getEmail()) || Validator.isNullOrEmpty(t.getPassword())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("email and password required"));
        }
        TellerEntity created = service.createTeller(t);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Teller created", created));
    }
}
