package com.mybank.app.repository;

import com.mybank.app.model.CustomerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<CustomerEntity, Long> {
    Optional<CustomerEntity> findByEmailAndPassword(String email, String password);
    Optional<CustomerEntity> findByEmail(String email);
    Optional<CustomerEntity> findByPhoneNumber(String phoneNumber);

}
