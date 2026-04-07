package com.possum.application.sales;

import com.possum.domain.repositories.SalesRepository;

public class InvoiceNumberService {
    private final SalesRepository salesRepository;

    public InvoiceNumberService(SalesRepository salesRepository) {
        this.salesRepository = salesRepository;
    }

    public String generate(long primaryPaymentMethodId) {
        String code = "XX";
        if (primaryPaymentMethodId > 0) {
            code = salesRepository.getPaymentMethodCode(primaryPaymentMethodId)
                    .filter(c -> c != null && !c.isBlank())
                    .orElse("XX");
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        String yy = String.format("%02d", today.getYear() % 100);
        String mm = String.format("%02d", today.getMonthValue());
        String dd = String.format("%02d", today.getDayOfMonth());

        long seq = salesRepository.getNextSequenceForPaymentType("S_" + code);

        return String.format("S%s%s%s%s%04d", yy, mm, dd, code, seq);
    }
}
