package com.possum.persistence.repositories.interfaces;

import java.util.List;
import java.util.Map;

public interface ReportsRepository {
    Map<String, Object> getSalesReportSummary(String startDate, String endDate, Long paymentMethodId);

    List<Map<String, Object>> getDailyBreakdown(String startDate, String endDate, Long paymentMethodId);

    List<Map<String, Object>> getMonthlyBreakdown(String startDate, String endDate, Long paymentMethodId);

    List<Map<String, Object>> getYearlyBreakdown(String startDate, String endDate, Long paymentMethodId);

    List<Map<String, Object>> getTopSellingProducts(String startDate, String endDate, int limit, Long paymentMethodId);

    List<Map<String, Object>> getSalesByPaymentMethod(String startDate, String endDate);
}
