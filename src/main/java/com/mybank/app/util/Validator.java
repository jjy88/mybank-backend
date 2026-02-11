package com.mybank.app.util;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.regex.Pattern;

public class Validator {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Pattern SIN_PATTERN = Pattern.compile("^\\d{9}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[\\d\\s\\-\\+\\(\\)]{10,}$");

    public static boolean isNullOrEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    public static boolean isValidPassword(String password) {
        return password != null && password.length() >= 6;
    }

    public static boolean isNotEmpty(String value) {
        return value != null && !value.trim().isEmpty();
    }

    public static boolean isValidSIN(String sin) {
        if (sin == null) return false;
        String cleaned = sin.replaceAll("\\D", ""); // Remove non-digits
        return SIN_PATTERN.matcher(cleaned).matches();
    }

    public static boolean isValidPhoneNumber(String phone) {
        if (phone == null) return false;
        String cleaned = phone.replaceAll("\\s", "");
        return PHONE_PATTERN.matcher(cleaned).matches();
    }

    public static boolean isPositiveNumber(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
    }

    public static boolean isPositiveNumber(String value) {
        try {
            BigDecimal num = new BigDecimal(value);
            return isPositiveNumber(num);
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean isSufficientFunds(BigDecimal balance, BigDecimal amount) {
        if (balance == null || amount == null) return false;
        return balance.compareTo(amount) >= 0;
    }

    public static boolean isAlphabetic(String value) {
        if (value == null || value.trim().isEmpty()) return false;
        return value.matches("^[a-zA-Z\\s'-]+$");
    }

    public static boolean isValidDate(LocalDate date) {
        return date != null;
    }

    public static boolean isAgeAtLeast18(LocalDate dateOfBirth) {
        if (dateOfBirth == null) return false;
        return Period.between(dateOfBirth, LocalDate.now()).getYears() >= 18;
    }
}
