package com.possum.application.people;

import com.possum.domain.model.Customer;
import com.possum.persistence.repositories.interfaces.CustomerRepository;
import com.possum.shared.dto.CustomerFilter;
import com.possum.shared.dto.PagedResult;

import java.util.Optional;

public class CustomerService {
    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public PagedResult<Customer> getCustomers(CustomerFilter filter) {
        return customerRepository.findCustomers(filter);
    }

    public Optional<Customer> getCustomerById(long id) {
        return customerRepository.findCustomerById(id);
    }

    public Customer createCustomer(String name, String phone, String email, String address) {
        return createCustomer(name, phone, email, address, null, false);
    }

    public Customer createCustomer(String name, String phone, String email, String address,
                                    String customerType, Boolean isTaxExempt) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.CUSTOMERS_MANAGE);
        if (name == null || name.isBlank()) throw new com.possum.domain.exceptions.ValidationException("Customer name is required");
        return customerRepository.insertCustomer(name, phone, email, address, customerType, isTaxExempt)
                .orElseThrow(() -> new RuntimeException("Failed to create customer"));
    }

    public Customer updateCustomer(long id, String name, String phone, String email, String address) {
        return updateCustomer(id, name, phone, email, address, null, false);
    }

    public Customer updateCustomer(long id, String name, String phone, String email, String address,
                                    String customerType, Boolean isTaxExempt) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.CUSTOMERS_MANAGE);
        if (name == null || name.isBlank()) throw new com.possum.domain.exceptions.ValidationException("Customer name is required");
        return customerRepository.updateCustomerById(id, name, phone, email, address, customerType, isTaxExempt)
                .orElseThrow(() -> new RuntimeException("Failed to update customer"));
    }

    public void deleteCustomer(long id) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.CUSTOMERS_MANAGE);
        if (!customerRepository.softDeleteCustomer(id)) {
            throw new RuntimeException("Failed to delete customer or customer not found");
        }
    }
}
