package com.possum.ui.dashboard;

import com.possum.infrastructure.monitoring.PerformanceMonitor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PerformanceWidgetTest {

    @Mock
    private PerformanceMonitor performanceMonitor;
    
    private PerformanceWidget widget;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        widget = new PerformanceWidget(performanceMonitor);
    }

    @Test
    void testRefreshWithNoMetrics() {
        when(performanceMonitor.getAllStats()).thenReturn(new HashMap<>());
        
        widget.refresh();
        
        verify(performanceMonitor).getAllStats();
    }

    @Test
    void testRefreshWithMetrics() {
        Map<String, PerformanceMonitor.OperationStats> stats = new HashMap<>();
        stats.put("tax_calculation", new PerformanceMonitor.OperationStats("tax_calculation", 100, 5000, 10, 100, 50.0, 95, 5));
        stats.put("audit_log", new PerformanceMonitor.OperationStats("audit_log", 200, 2000, 5, 20, 10.0, 200, 0));
        
        when(performanceMonitor.getAllStats()).thenReturn(stats);
        
        widget.refresh();
        
        verify(performanceMonitor).getAllStats();
    }

    @Test
    void testStop() {
        widget.stop();
        assertNotNull(widget);
    }
}
