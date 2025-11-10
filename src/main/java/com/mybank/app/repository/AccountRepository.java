package com.mybank.app.repository;

import com.mybank.app.model.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface AccountRepository extends JpaRepository<AccountEntity, Long> {
    Optional<List<AccountEntity>> findByUserId(Long userId);
    List<AccountEntity> findByUserIdIn(List<Long> userIds);
}
