package com.mybank.app.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "customer")
public class CustomerEntity extends UserEntity {
    private String address;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private Integer sin;
    private Long branchId;

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public Integer getSin() { return sin; }
    public void setSin(Integer sin) { this.sin = sin; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public Long getUserId() {
        return super.getUserId();
    }
}
