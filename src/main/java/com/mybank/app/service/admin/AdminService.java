package com.mybank.app.service.admin;

import com.mybank.app.model.*;
import com.mybank.app.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

@Service
public class AdminService {
    @Autowired
    private AdminRepository adminRepo;
    @Autowired
    private CustomerRepository customerRepo;
    @Autowired
    private TellerRepository tellerRepo;

    public Optional<AdminEntity> login(String email, String password) {
        return adminRepo.findByEmailAndPassword(email, password);
    }

    public List<CustomerEntity> getAllCustomers() {
        return customerRepo.findAll();
    }

    public boolean removeCustomer(Long id) {
        if (customerRepo.existsById(id)) { customerRepo.deleteById(id); return true; }
        return false;
    }

    public TellerEntity createTeller(TellerEntity t) {
        return tellerRepo.save(t);
    }
}
