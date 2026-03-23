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
        return customerRepository.insertCustomer(name, phone, email, address)
                .orElseThrow(() -> new RuntimeException("Failed to create customer"));
    }

    public Customer updateCustomer(long id, String name, String phone, String email, String address) {
        return customerRepository.updateCustomerById(id, name, phone, email, address)
                .orElseThrow(() -> new RuntimeException("Failed to update customer"));
    }

    public void deleteCustomer(long id) {
        if (!customerRepository.softDeleteCustomer(id)) {
            throw new RuntimeException("Failed to delete customer or customer not found");
        }
    }
}
