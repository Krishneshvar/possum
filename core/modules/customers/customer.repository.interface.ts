import { Customer } from '../../../types/index.js';

export interface CustomerWriteFields {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface CustomerFilter {
  searchTerm?: string;
  page?: number;
  limit?: number;
  currentPage?: number;
  itemsPerPage?: number;
  sortBy?: 'name' | 'email' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedCustomers {
  customers: Customer[];
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface ICustomerRepository {
  findCustomers(params: CustomerFilter): PaginatedCustomers;
  findCustomerById(id: number): Customer | undefined;
  insertCustomer(data: CustomerWriteFields): Customer | undefined;
  updateCustomerById(id: number, data: CustomerWriteFields): Customer | undefined;
  softDeleteCustomer(id: number): boolean;
}
