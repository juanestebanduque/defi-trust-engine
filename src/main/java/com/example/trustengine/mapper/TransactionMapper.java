package com.example.trustengine.mapper;

import com.example.trustengine.dto.TransactionDto;
import com.example.trustengine.entity.Transaction;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TransactionMapper {

    default TransactionDto toDto(Transaction transaction) {
        if (transaction == null) {
            return null;
        }
        return TransactionDto.builder()
                .id(transaction.getId())
                .txHash(transaction.getTxHash())
                .type(transaction.getType())
                .title(transaction.getType())
                .amount(transaction.getAmount())
                .build();
    }
}
