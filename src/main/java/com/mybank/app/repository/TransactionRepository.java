package com.mybank.app.repository;

import com.mybank.app.model.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {
    List<TransactionEntity> findByFromAccountIdInOrToAccountIdIn(List<Long> fromIds, List<Long> toIds);
    List<TransactionEntity> findByTellerIdOrderByTimestampDesc(Long tellerId);
}
