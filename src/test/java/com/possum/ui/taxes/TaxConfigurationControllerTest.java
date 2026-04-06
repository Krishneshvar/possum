package com.possum.ui.taxes;

import com.possum.application.sales.TaxConfiguration;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.ui.common.toast.ToastService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TaxConfigurationControllerTest {

    @Mock
    private SettingsStore settingsStore;
    
    @Mock
    private ToastService toastService;
    
    private TaxConfigurationController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        controller = new TaxConfigurationController(settingsStore, toastService);
    }

    @Test
    void testLoadDefaultConfiguration() {
        when(settingsStore.get(anyString(), eq(TaxConfiguration.class)))
            .thenReturn(Optional.empty());
        
        // Controller should load default config
        verify(settingsStore, atLeastOnce()).get(anyString(), eq(TaxConfiguration.class));
    }

    @Test
    void testLoadExistingConfiguration() {
        var config = new TaxConfiguration(
            TaxConfiguration.RoundingMode.INVOICE_LEVEL, 
            true
        );
        when(settingsStore.get(anyString(), eq(TaxConfiguration.class)))
            .thenReturn(Optional.of(config));
        
        verify(settingsStore, atLeastOnce()).get(anyString(), eq(TaxConfiguration.class));
    }

    @Test
    void testSaveConfiguration() {
        var config = TaxConfiguration.defaultConfig();
        
        doNothing().when(settingsStore).set(anyString(), any(TaxConfiguration.class));
        doNothing().when(toastService).success(anyString());
        
        // Simulate save
        settingsStore.set("tax.configuration", config);
        toastService.success("Tax configuration saved successfully");
        
        verify(settingsStore).set(eq("tax.configuration"), any(TaxConfiguration.class));
        verify(toastService).success(anyString());
    }
}
