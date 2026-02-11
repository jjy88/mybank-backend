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
    public ResponseEntity<ApiResponse<List<CustomerEntity>>> allCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long accountId) {
        List<CustomerEntity> customers;
        if (search != null || branchId != null || accountId != null) {
            customers = service.searchCustomers(
                search != null ? search : "", 
                branchId, 
                accountId
            );
        } else {
            customers = service.getAllCustomers();
        }
        return ResponseEntity.ok(ApiResponse.success("Customers fetched", customers));
    }

    @PostMapping("/remove_customer")
    public ResponseEntity<ApiResponse<Void>> removeCustomer(@RequestBody Map<String,Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        boolean ok = service.removeCustomer(userId);
        if (ok) return ResponseEntity.ok(ApiResponse.success("Customer removed", null));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("not found"));
    }

    @PostMapping("/create_teller")
    public ResponseEntity<ApiResponse<TellerEntity>> createTeller(@RequestBody Map<String,Object> body) {
        try {
            String firstName = String.valueOf(body.get("firstName"));
            String lastName = String.valueOf(body.get("lastName"));
            String email = String.valueOf(body.get("email"));
            String password = String.valueOf(body.get("password"));
            String branchName = body.containsKey("branchName") ? String.valueOf(body.get("branchName")) : null;
            Long branchId = body.containsKey("branchId") && body.get("branchId") != null 
                ? Long.valueOf(String.valueOf(body.get("branchId"))) : null;
            
            TellerEntity created = service.createTeller(firstName, lastName, email, password, branchName, branchId);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Teller created", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/all_tellers")
    public ResponseEntity<ApiResponse<List<TellerEntity>>> allTellers() {
        return ResponseEntity.ok(ApiResponse.success("Tellers fetched", service.getAllTellers()));
    }

    @PostMapping("/update_teller")
    public ResponseEntity<ApiResponse<TellerEntity>> updateTeller(@RequestBody Map<String,Object> body) {
        try {
            Long tellerId = Long.valueOf(String.valueOf(body.get("tellerId")));
            String firstName = body.containsKey("firstName") ? String.valueOf(body.get("firstName")) : null;
            String lastName = body.containsKey("lastName") ? String.valueOf(body.get("lastName")) : null;
            String email = body.containsKey("email") ? String.valueOf(body.get("email")) : null;
            String branchName = body.containsKey("branchName") ? String.valueOf(body.get("branchName")) : null;
            Long branchId = body.containsKey("branchId") && body.get("branchId") != null 
                ? Long.valueOf(String.valueOf(body.get("branchId"))) : null;
            
            TellerEntity updated = service.updateTeller(tellerId, firstName, lastName, email, branchName, branchId);
            return ResponseEntity.ok(ApiResponse.success("Teller updated", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/remove_teller")
    public ResponseEntity<ApiResponse<Void>> removeTeller(@RequestBody Map<String,Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        boolean ok = service.removeTeller(userId);
        if (ok) return ResponseEntity.ok(ApiResponse.success("Teller removed", null));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("not found"));
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
            
            java.time.LocalDate dateOfBirth = null;
            if (body.containsKey("dateOfBirth") && body.get("dateOfBirth") != null && !String.valueOf(body.get("dateOfBirth")).isEmpty()) {
                dateOfBirth = java.time.LocalDate.parse(String.valueOf(body.get("dateOfBirth")));
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
            return ResponseEntity.ok(ApiResponse.success("Customer updated", customer));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/all_branches")
    public ResponseEntity<ApiResponse<List<BranchEntity>>> allBranches() {
        return ResponseEntity.ok(ApiResponse.success("Branches fetched", service.getAllBranches()));
    }

    @PostMapping("/create_branch")
    public ResponseEntity<ApiResponse<BranchEntity>> createBranch(@RequestBody Map<String,Object> body) {
        try {
            String branchName = String.valueOf(body.get("branchName"));
            String address = body.containsKey("address") ? String.valueOf(body.get("address")) : null;
            String city = body.containsKey("city") ? String.valueOf(body.get("city")) : null;
            String province = body.containsKey("province") ? String.valueOf(body.get("province")) : null;
            String postalCode = body.containsKey("postalCode") ? String.valueOf(body.get("postalCode")) : null;
            String phoneNumber = body.containsKey("phoneNumber") ? String.valueOf(body.get("phoneNumber")) : null;
            
            BranchEntity branch = service.createBranch(branchName, address, city, province, postalCode, phoneNumber);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Branch created", branch));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/update_branch")
    public ResponseEntity<ApiResponse<BranchEntity>> updateBranch(@RequestBody Map<String,Object> body) {
        try {
            Long branchId = Long.valueOf(String.valueOf(body.get("branchId")));
            String branchName = body.containsKey("branchName") ? String.valueOf(body.get("branchName")) : null;
            String address = body.containsKey("address") ? String.valueOf(body.get("address")) : null;
            String city = body.containsKey("city") ? String.valueOf(body.get("city")) : null;
            String province = body.containsKey("province") ? String.valueOf(body.get("province")) : null;
            String postalCode = body.containsKey("postalCode") ? String.valueOf(body.get("postalCode")) : null;
            String phoneNumber = body.containsKey("phoneNumber") ? String.valueOf(body.get("phoneNumber")) : null;
            
            BranchEntity branch = service.updateBranch(branchId, branchName, address, city, province, postalCode, phoneNumber);
            return ResponseEntity.ok(ApiResponse.success("Branch updated", branch));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/remove_branch")
    public ResponseEntity<ApiResponse<Void>> removeBranch(@RequestBody Map<String,Object> body) {
        Long branchId = Long.valueOf(String.valueOf(body.get("branchId")));
        boolean ok = service.removeBranch(branchId);
        if (ok) return ResponseEntity.ok(ApiResponse.success("Branch removed", null));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("not found"));
    }

    @GetMapping("/all_transactions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> allTransactions() {
        return ResponseEntity.ok(ApiResponse.success("Transactions fetched", service.getAllTransactions()));
    }
}
