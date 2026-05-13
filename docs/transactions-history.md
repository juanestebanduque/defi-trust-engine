# Historial de transacciones

## Endpoints

### Listar transacciones
- Método: `GET`
- URL: `/api/v1/transactions`
- Autenticación: JWT Bearer
- Parámetros:
  - `search` (opcional): texto para buscar por ID o descripción.
  - `type` (opcional, default `todo`): `todo`, `pagos`, `préstamos`.
  - `status` (opcional, default `todos`): `todos`, `completado`, `pendiente`, `fallido`.
  - `page` (opcional, default `0`)
  - `size` (opcional, default `20`)
  - `sort` (opcional, default `date,desc`)

#### Ejemplo de request
```http
GET /api/v1/transactions?search=pago&type=pagos&status=completado&page=0&size=10&sort=date,desc
Authorization: Bearer <token>
```

#### Respuesta
- Código: `200 OK`
- Body:
```json
{
  "totalReceived": 2700.00,
  "totalSent": -2700.00,
  "totalTransactions": 8,
  "transactions": {
    "content": [
      {
        "id": 1,
        "title": "Pago recibido - Préstamo #1234",
        "date": "2026-04-20T00:00:00Z",
        "transactionHash": "TX-00000001",
        "status": "COMPLETED",
        "amount": 500.00,
        "currency": "USD",
        "description": "Pago de préstamo"
      }
    ],
    "pageable": { ... },
    "totalPages": 1,
    "totalElements": 8,
    "last": true,
    "size": 10,
    "number": 0,
    "sort": { ... }
  }
}
```
- `totalReceived`: suma de montos positivos para el usuario.
- `totalSent`: suma de montos negativos para el usuario.
- `totalTransactions`: total de transacciones del usuario.

### Ver detalle de transacción
- Método: `GET`
- URL: `/api/v1/transactions/{id}`
- Autenticación: JWT Bearer

#### Ejemplo de request
```http
GET /api/v1/transactions/123
Authorization: Bearer <token>
```

#### Respuesta
- Código: `200 OK`
- Body: `TransactionDto` con detalles completos de la operación.

### Ver detalle de transacción
- Método: `GET`
- URL: `/api/v1/transactions/{id}`
- Autenticación: JWT Bearer

#### Ejemplo de request
```http
GET /api/v1/transactions/123
Authorization: Bearer <token>
```

#### Respuesta
- Código: `200 OK`
- Body: `TransactionDto` con detalles completos de la operación.

## Modelo de datos

```json
{
  "id": 1,
  "type": "TRANSFER",
  "amount": 500.00,
  "currency": "USD",
  "description": "Pago de préstamo",
  "status": "COMPLETED",
  "date": "2026-05-12T14:34:00Z"
}
```

## Notas técnicas

- El endpoint está protegido por JWT y solo permite acceder a transacciones del usuario autenticado.
- El parámetro `sort=date,desc` se traduce internamente a la propiedad `createdAt`.
- La persistencia utiliza `Spring Data JPA` y un índice compuesto sobre `user_id` y `created_at`.
- La documentación OpenAPI se expone en `/swagger-ui.html` y `/v3/api-docs`.
