package com.mybank.app.repository;

import com.mybank.app.model.TellerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TellerRepository extends JpaRepository<TellerEntity, Long> {
    Optional<TellerEntity> findByEmailAndPassword(String email, String password);
    Optional<TellerEntity> findByEmail(String email);
}
