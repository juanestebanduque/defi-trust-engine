package com.example.trustengine.controller;

import com.example.trustengine.dto.TransactionDto;
import com.example.trustengine.dto.TransactionHistoryResponse;
import com.example.trustengine.service.TransactionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@WebMvcTest(controllers = TransactionController.class)
@AutoConfigureMockMvc(addFilters = false)
class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TransactionService transactionService;

    @MockBean
    private com.example.trustengine.service.JwtService jwtService;

    @MockBean
    private com.example.trustengine.repository.UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldReturnTransactionsPage() throws Exception {
        TransactionDto transaction = TransactionDto.builder()
                .id(10L)
                .txHash("TX-00000010")
                .type("TRANSFER")
                .title("TRANSFER")
                .amount(new BigDecimal("100.00"))
                .build();

        TransactionHistoryResponse response = TransactionHistoryResponse.builder()
                .totalReceived(new BigDecimal("100.00"))
                .totalSent(BigDecimal.ZERO)
                .totalTransactions(1L)
                .transactions(new PageImpl<>(List.of(transaction), PageRequest.of(0, 20), 1))
                .build();

        when(transactionService.getTransactionHistoryForUser(
                anyString(), anyString(), anyString(), anyString(), anyInt(), anyInt(), anyString()))
                .thenReturn(response);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/transactions")
                        .principal((Principal) () -> "owner@test.com")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.transactions.content[0].id").value(10L))
                .andExpect(MockMvcResultMatchers.jsonPath("$.transactions.content[0].type").value("TRANSFER"));
    }

    @Test
    void shouldReturnTransactionById() throws Exception {
        TransactionDto transaction = TransactionDto.builder()
                .id(10L)
                .txHash("TX-00000010")
                .type("TRANSFER")
                .title("TRANSFER")
                .amount(new BigDecimal("100.00"))
                .build();

        when(transactionService.getTransactionForUser("owner@test.com", 10L)).thenReturn(transaction);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/transactions/10")
                        .principal((Principal) () -> "owner@test.com")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(10L))
                .andExpect(MockMvcResultMatchers.jsonPath("$.txHash").value("TX-00000010"));
    }
}
