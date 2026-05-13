package com.example.trustengine.integration;

import com.example.trustengine.entity.Transaction;
import com.example.trustengine.entity.User;
import com.example.trustengine.repository.TransactionRepository;
import com.example.trustengine.repository.UserRepository;
import com.example.trustengine.service.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TransactionIntegrationTest {

    private static final boolean DOCKER_AVAILABLE = DockerClientFactory.instance().isDockerAvailable();

    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15.5")
            .withDatabaseName("trustdb")
            .withUsername("postgres")
            .withPassword("postgres");

    @BeforeAll
    static void beforeAll() {
        if (DOCKER_AVAILABLE) {
            postgres.start();
        }
    }

    @AfterAll
    static void afterAll() {
        if (DOCKER_AVAILABLE && postgres.isRunning()) {
            postgres.stop();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String bearerToken;
    private User user;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry properties) {
        if (DOCKER_AVAILABLE) {
            properties.add("spring.datasource.url", postgres::getJdbcUrl);
            properties.add("spring.datasource.username", postgres::getUsername);
            properties.add("spring.datasource.password", postgres::getPassword);
            properties.add("spring.datasource.driver-class-name", postgres::getDriverClassName);
        } else {
            properties.add("spring.datasource.url", () -> "jdbc:h2:mem:transactionstest;DB_CLOSE_DELAY=-1;MODE=PostgreSQL");
            properties.add("spring.datasource.username", () -> "sa");
            properties.add("spring.datasource.password", () -> "");
            properties.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
        }
        properties.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        userRepository.deleteAll();

        user = User.builder()
                .email("integration@test.com")
                .passwordHash(passwordEncoder.encode("secret123"))
                .role("USER")
                .status("ACTIVE")
                .build();
        user = userRepository.save(user);
        bearerToken = "Bearer " + jwtService.generateToken(user.getEmail());

        transactionRepository.saveAll(List.of(
                Transaction.builder()
                        .txHash("TX-DEPOSIT-001")
                        .user(user)
                        .type("DEPOSIT")
                        .amount(new BigDecimal("100.00"))
                        .build(),
                Transaction.builder()
                        .txHash("TX-TRANSFER-001")
                        .user(user)
                        .type("TRANSFER")
                        .amount(new BigDecimal("250.50"))
                        .build(),
                Transaction.builder()
                        .txHash("TX-WITHDRAWAL-001")
                        .user(user)
                        .type("WITHDRAWAL")
                        .amount(new BigDecimal("50.00"))
                        .build()
        ));
    }

    @Test
    void shouldReturnAuthenticatedUserTransactions() throws Exception {
        String response = new String(mockMvc.perform(get("/api/v1/transactions?page=0&size=10&sort=date,desc")
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsByteArray(), StandardCharsets.UTF_8);

        JsonNode body = objectMapper.readTree(response);
        assertThat(body.path("transactions").path("content").size()).isEqualTo(3);
        assertThat(body.path("totalTransactions").asLong()).isEqualTo(3L);
    }

    @Test
    void shouldReturnTransactionDetailsForAuthenticatedUser() throws Exception {
        Transaction transaction = transactionRepository.findByUserId(
                user.getId(), org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0);

        String response = new String(mockMvc.perform(get("/api/v1/transactions/" + transaction.getId())
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsByteArray(), StandardCharsets.UTF_8);

        JsonNode body = objectMapper.readTree(response);
        assertThat(body.path("id").asLong()).isEqualTo(transaction.getId());
        assertThat(body.path("txHash").asText()).isEqualTo(transaction.getTxHash());
    }

    @Test
    void shouldRejectRequestsWithoutAuthorizationHeader() throws Exception {
        mockMvc.perform(get("/api/v1/transactions"))
                .andExpect(status().isUnauthorized());
    }
}
