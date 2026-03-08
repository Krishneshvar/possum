package com.possum.application.transactions;

import com.possum.persistence.repositories.interfaces.SalesRepository;
import com.possum.persistence.repositories.interfaces.TransactionRepository;

public final class TransactionsModule {

    private final TransactionService transactionService;

    public TransactionsModule(
            TransactionRepository transactionRepository,
            SalesRepository salesRepository
    ) {
        this.transactionService = new TransactionServiceImpl(
                transactionRepository,
                salesRepository
        );
    }

    public TransactionService getTransactionService() {
        return transactionService;
    }
}
