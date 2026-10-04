# Contrato HTTP — Web Monolithic Backend

Lo leen los tres equipos. Los campos salen de los atributos de dominio del Capítulo IV (`docs/bounded-contexts/bc-01` … `bc-04`). Los paths salen del Capítulo III cuando el llamador es un cliente. Si el diseño no fija un tipo, una unidad, un path o un campo que la historia pide y el dominio no tiene, la fila dice **To discuss**.

Identidad propia. No hay IdP externo. Header de sesión: `Authorization: Bearer {accessToken}`.

## Convenciones

| Tema | Valor en este contrato |
|---|---|
| JSON | camelCase |
| Fechas | `string`, ISO-8601 (`date-time`) |
| Identificadores | `string`. **To discuss:** UUID frente a string opaco |
| Enums | El literal del dominio (`Supervisor`, `Mobile`, `Extractor`) |
| Secreto de usuario | El request lleva `password` en claro sobre HTTPS. La respuesta nunca devuelve `passwordHash` |
| Secreto de dispositivo | En reposo es hash. Si el alta devuelve el secreto en claro una sola vez: **To discuss** |
| Error | `{ "code": string, "correlationId": string \| null }` |

Códigos que ya nombran las historias y aplican a estos clientes: `invalid_credentials`, `account_disabled`, `unauthorized`, `area_not_found`, `area_name_duplicate`, `role_not_allowed`, `device_already_exists`, `credential_revoked`, `invalid_action`.

El Capítulo III escribe `gateway_unreachable` cuando el override no puede entregarse. En este contrato el código es `edge_unreachable`. El proceso que faltará hasta la ola del Edge es el Edge, no un gateway.

## Quién llama qué

| Operación | Web (Plant Manager) | Móvil (Supervisor) |
|---|---|---|
| Sign-in, cierre de sesión | sí, `channel = Web` | sí, `channel = Mobile` |
| Recuperación y reset | sí | sí |
| Cuentas, roles, directorio | sí | 403 |
| Dashboard e historial de planta | sí | 403 en el historial completo |
| Setup de área, umbrales, ficha, configuración | 403 | sí |
| Alta, listado y revocación de dispositivo | 403 | sí |
| Estado operativo, alertas, historial corto, override | 403 en el override | sí |

Un rol en el canal equivocado responde 403 `role_not_allowed`. Supervisor solo entra con `Mobile`. Plant Manager solo entra con `Web`.

Fuera del contrato de clientes: ingest de telemetría, consumers MQTT, cola offline y el loop de actuación. Viven en el Edge.

---

## Identity & Access

### SignIn

`POST /api/v1/auth/login`

El dominio guarda `Session.channel`. El body lo envía. TS21 no lo incluye; aquí sí, porque `AccessPolicy` distingue canal.

**Request**

| Campo | Tipo | Notas |
|---|---|---|
| `email` | string | `UserAccount.email` |
| `password` | string | se verifica contra `passwordHash`; no se persiste en claro |
| `channel` | `Mobile` \| `Web` | `Session.channel` |

**Response 200**

| Campo | Tipo | Notas |
|---|---|---|
| `accessToken` | string | `Session.token`. JWT |
| `role` | `Supervisor` \| `PlantManager` | `UserAccount.role` |
| `expiresAt` | string (date-time) | `Session.expiresAt` |
| `refreshToken` | — | **To discuss.** TS21 lo pide. `Session` tiene un solo `token` |
| `expiresIn` | — | **To discuss.** TS21 lo pide en segundos. Con `expiresAt` alcanza para esta ola |

**Errores:** 401 `invalid_credentials`. 403 `account_disabled`. 403 `role_not_allowed` si el rol no corresponde al `channel`.

### CloseSession

`POST /api/v1/auth/logout`

Path **To discuss** (el Capítulo III no lo nombra). Sin body. Usa el bearer. **Response 204.**

### RequestCredentialRecovery

`POST /api/v1/auth/recovery`

Path **To discuss.** Los dos clientes.

**Request:** `email` string.

**Response 202.** El `RecoveryToken` sale por correo, no en el JSON. **To discuss:** si la respuesta incluye `recoveryId`.

Email no registrado: la historia US13 pide informar que no hay cuenta. Eso confirma si el correo existe. **To discuss** si se unifica el 202 para no filtrar cuentas.

### ResetCredentials

`POST /api/v1/auth/reset`

Path **To discuss.** Los dos clientes.

**Request**

| Campo | Tipo |
|---|---|
| `token` | string (`RecoveryToken`) |
| `password` | string (nuevo) |

**Response 204.** Token vencido o usado: 422, código **To discuss** (`recovery_expired`).

### CreateUserAccount

`POST /api/v1/users`

Path **To discuss.** Solo web.

**Request**

| Campo | Tipo | Notas |
|---|---|---|
| `email` | string | único |
| `password` | string | |
| `role` | `Supervisor` \| `PlantManager` | |
| `name` | — | **To discuss.** US11 lo pide. `UserAccount` no tiene nombre |

**Response 201**

| Campo | Tipo |
|---|---|
| `id` | string |
| `email` | string |
| `role` | `Supervisor` \| `PlantManager` |
| `enabled` | boolean |

Correo duplicado: 409, código **To discuss** (`email_already_exists`).

### AssignUserRole

`PATCH /api/v1/users/{accountId}/role`

Path **To discuss.** Solo web.

**Request:** `role` `Supervisor` \| `PlantManager`.

**Response 200:** `id`, `email`, `role`, `enabled`.

### UserAccountsDirectory

`GET /api/v1/users`

Path **To discuss.** Solo web.

**Response 200:** `items` array de `{ id, email, role, enabled }`.

---

## Plant Monitoring

Las lecturas no se fusionan. No existe un DTO con `co2Ppm`, `noiseDb` y `presenceDetected` en el mismo objeto de lectura. TS09 los junta; este contrato no.

### ManageIndustrialArea — crear

`POST /api/v1/areas`

Solo móvil.

**Request**

| Campo | Tipo | Notas |
|---|---|---|
| `name` | string | único en la planta |
| `location` | string | `Location.value` |
| `machineReferences` | — | **To discuss.** TS23 lo pide. El dominio no lo tiene |

**Response 201:** `id`, `name`, `location`.

Nombre duplicado: 409 `area_name_duplicate`.

`DELETE /api/v1/areas/{areaId}` (baja lógica, TS23): **To discuss.** `IndustrialArea` no tiene baja.

`PUT` de nombre o ubicación: path **To discuss.** El dominio sí tiene `update()`.

### ConfigureEnvironmentalThresholds

`PUT /api/v1/areas/{areaId}/thresholds`

Solo móvil.

**Request**

| Campo | Tipo | Notas |
|---|---|---|
| `co2LimitPpm` | number | `Co2Limit.ppm` |
| `noiseLimitDb` | number | `NoiseLimit.db` |

TS23 los llama `co2ThresholdPpm` y `noiseThresholdDb`. Esos alias quedan **To discuss**; el contrato usa los nombres del dominio.

**Response 200:** `areaId`, `co2LimitPpm`, `noiseLimitDb`.

`configVersion` y `updatedAt` (TS23): **To discuss.** No están en `AreaThresholds`.

Umbral fuera de rango: 422, campo `noiseLimitDb` o `co2LimitPpm`. El máximo permitido: **To discuss.**

### AssociateDeviceToArea

`POST /api/v1/areas/{areaId}/devices`

Solo móvil. Esto es la asociación en Plant Monitoring. El alta de credencial es otra operación (más abajo). La pantalla US22 hace las dos.

**Request**

| Campo | Tipo | Notas |
|---|---|---|
| `deviceId` | string | no se duplica |
| `kind` | `Sensor` \| `Actuator` | `DeviceKind` |
| tipo fino (CO₂, ruido, presencia, extractor, sirena, mampara) | — | **To discuss.** US22 pide "tipo". El dominio solo distingue sensor o actuador |

**Response 201:** `id`, `areaId`, `deviceId`, `kind`.

Duplicado: 409 `device_already_exists`.

### AreaSetupSheet

`GET /api/v1/areas/{areaId}/setup`

Path **To discuss.** Solo móvil.

**Response 200**

| Campo | Tipo |
|---|---|
| `id` | string |
| `name` | string |
| `location` | string |
| `co2LimitPpm` | number \| null |
| `noiseLimitDb` | number \| null |
| `devices` | array de `{ id, deviceId, kind }` |

### UpdateSystemConfiguration

El dominio tiene `IndustrialArea.updateSystemConfiguration()`. US35 habla de parámetros de áreas, umbrales y dispositivos sin un body propio.

**To discuss:** si esta operación es solo la suma de update de área + umbrales + asociación, sin un tercer endpoint.

### LatestReadings

`GET /api/v1/areas/{areaId}/telemetry/latest`

Supervisor (TS09). Tres últimos hechos, no una fila unificada.

**Response 200**

| Campo | Tipo | Notas |
|---|---|---|
| `areaId` | string | |
| `carbonDioxide` | objeto \| null | `deviceId` string, `ppm` number, `recordedAt` date-time |
| `noise` | objeto \| null | `deviceId` string, `db` number, `recordedAt` date-time |
| `presence` | objeto \| null | `deviceId` string, `state` `Detected` \| `Cleared`, `recordedAt` date-time |
| `quality` | — | **To discuss.** TS09 lo pide. El dominio no lo tiene |
| `presenceDetected` boolean | — | **To discuss.** TS09 usa boolean. El dominio usa `Detected` \| `Cleared` |

Área inexistente: 404 `area_not_found`.

### PlantMetricsDashboard

Lectura nueva respecto de un solo `getPlantMetricsHistory`. US23, solo web. Path **To discuss:** `GET /api/v1/metrics/dashboard`.

**Response 200:** `items` array de:

| Campo | Tipo | Origen |
|---|---|---|
| `areaId` | string | área |
| `name` | string | área |
| `co2Ppm` | number \| null | última lectura |
| `noiseDb` | number \| null | última lectura |
| `presenceState` | `Detected` \| `Cleared` \| null | último cambio |
| `severity` | `None` \| `Medium` \| `High` | `ExposureState` |
| `alertActive` | boolean | `ExposureState` |
| `highlighted` | boolean | `AreaRisk` |

Hasta que el Edge sincronice, `items` puede venir con lecturas y severidad en null / `None`. El endpoint existe igual.

### PlantHistory

US23, solo web. Mediciones + alertas + acciones del periodo. Path **To discuss:** `GET /api/v1/areas/{areaId}/history?from={date-time}&to={date-time}`.

`GET /api/v1/areas/{areaId}/telemetry?from&to` del Capítulo III cubre solo mediciones. El historial de la historia de usuario también incluye alertas y acciones. Un solo response compuesto evita que el web arme tres pantallas. **To discuss** si el backend prefiere tres GET.

**Query:** `from` date-time, `to` date-time. Periodo sin registros: 200 con arrays vacíos (US23 escenario 3).

**Response 200**

| Campo | Tipo |
|---|---|
| `areaId` | string |
| `carbonDioxideReadings` | `{ id, deviceId, ppm, recordedAt }[]` |
| `noiseReadings` | `{ id, deviceId, db, recordedAt }[]` |
| `presenceChanges` | `{ id, deviceId, state, recordedAt }[]` |
| `alerts` | ver `EnvironmentalAlert` más abajo |
| `actions` | ver `AutomaticActuatorAction` más abajo |

`nextCursor` (TS09): **To discuss.**

---

## Safety & Actuation

El loop automático corre en el Edge. Estos DTO son el estado y la auditoría que el cloud expone, y el override que el cloud reenvía cuando hay enlace.

### AreaOperationalStatus

Dashboard del supervisor (US14). Path **To discuss:** `GET /api/v1/areas/operational-status`.

**Response 200:** `items` con la misma forma que una fila de `PlantMetricsDashboard`, más los actuadores del área:

| Campo extra | Tipo |
|---|---|
| `actuators` | `{ type, runState, mode, lastChangedAt }[]` |

`type`: `Extractor` \| `Siren` \| `Barrier`. `runState`: `Off` \| `On` \| `Deployed` \| `Retracted` \| `Failed`. `mode`: `Auto` \| `Overridden`.

Detalle de un área: `GET /api/v1/areas/{areaId}/operational-status`. Path **To discuss.** Misma forma, un objeto.

### ActiveAlerts

`GET /api/v1/alerts/active`

Supervisor. Fallback de polling. El stream SSE `GET /api/v1/alerts/stream` (TS24) queda **To discuss**; el Capítulo IV no lo tiene.

**Response 200:** `items` de `EnvironmentalAlert`:

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `areaId` | string | |
| `raisedAt` | date-time | |
| `withdrawnAt` | date-time \| null | |
| `alertType` | — | **To discuss.** US26 lo pide. La entidad no lo tiene |
| `severity` | — | **To discuss** en la alerta. Vive en `ExposureState.severity` |
| `measuredValue` | — | **To discuss.** US26 lo pide. No está en la entidad |

### ShortExposureHistory

US26, solo móvil. Path **To discuss:** `GET /api/v1/areas/{areaId}/exposures`.

**Query:** `alertType` **To discuss** (el filtro de US26 no tiene campo de dominio).

**Response 200:** `items` con `id`, `areaId`, `raisedAt`, `withdrawnAt`, y los mismos tres campos **To discuss** de la alerta (`alertType`, `severity`, `measuredValue`). `resolvedAt` de US26 se mapea a `withdrawnAt` si el equipo cierra ese **To discuss** a favor del dominio.

### ActuatorActionLog

US33, solo móvil. Path **To discuss:** `GET /api/v1/areas/{areaId}/actuator-actions`.

**Response 200:** `items`:

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `areaId` | string | del aggregate `AreaActuators`, no de la entidad |
| `type` | `Extractor` \| `Siren` \| `Barrier` | |
| `succeeded` | boolean | |
| `recordedAt` | date-time | |
| motivo de fallo | — | **To discuss.** US33 lo pide. La entidad no lo tiene |

### OverrideActuator

`POST /api/v1/areas/{areaId}/actuators/override`

Solo móvil. El Plant Manager recibe 403 `role_not_allowed` (US23 escenario 4, TS10).

**Request**

| Campo | Tipo | Notas |
|---|---|---|
| `actuatorType` | `Extractor` \| `Siren` \| `Barrier` | sin `deviceId` |
| `runState` | `Off` \| `On` \| `Deployed` \| `Retracted` | el objetivo del override |
| `action` (`on` / `off`) | — | **To discuss.** TS10 usa `action`. El dominio usa `ActuatorRunState`. Mampara no cabe en `on` |

**Response 202**

| Campo | Tipo | Notas |
|---|---|---|
| `status` | `queued` | aceptación en cloud |
| `overrideId` | — | **To discuss.** TS10 lo pide. No está en `ActuatorState` |
| `requestedBy` | — | **To discuss.** TS10 lo pide |

Consulta `GET /api/v1/overrides/{overrideId}`: **To discuss** junto con `overrideId`. Estados que TS10 nombra (`applied`, `timeout`, `failed_to_queue`) no están en el dominio.

Si el Edge no está alcanzable: 503 `edge_unreachable`. En esta ola, sin Edge, ese es el resultado esperado de un override real. El endpoint se scaffoldea igual.

`invalid_action`: 400.

---

## Device & Edge Management (solo el maestro cloud)

`EdgeNode`, MQTT y la cola no tienen DTO de cliente.

### IssueDevice

`POST /api/v1/devices`

Solo móvil. El backend parte la llamada: credencial en Device & Edge y, si viene `areaId` + `kind`, asociación en Plant Monitoring.

**Request**

| Campo | Tipo | Notas |
|---|---|---|
| `deviceId` | string | |
| `areaId` | string | asociación |
| `kind` | `Sensor` \| `Actuator` | asociación |
| `model` | — | **To discuss.** TS25 lo pide. `DeviceCredential` no lo tiene |
| `firmwareVersion` | — | **To discuss.** Igual que `model` |
| dirección embebida | — | **To discuss.** US22 la pide. El dominio no la tiene |

**Response 201**

| Campo | Tipo | Notas |
|---|---|---|
| `deviceId` | string | |
| `issuedAt` | date-time | |
| `expiresAt` | date-time | quién fija el TTL: **To discuss** |
| `secret` | — | **To discuss.** Hace falta una vez en claro para el firmware; en reposo solo hay hash |

Duplicado: 409 `device_already_exists`. Área inexistente: 422 `area_not_found`.

### ListDevices

`GET /api/v1/devices`

Solo móvil.

**Response 200:** `items` de `{ deviceId, areaId, kind, issuedAt, expiresAt, revokedAt }`. `revokedAt` es date-time o null.

`lastSeenAt` (TS25): **To discuss.** Lo produce el Edge; esta ola no tiene heartbeat.

### RevokeDevice

`POST /api/v1/devices/{deviceId}/revoke`

Solo móvil. Sin body.

**Response 200:** `deviceId`, `revokedAt`.

Ingest posterior de ese `deviceId`: 403 `credential_revoked` cuando exista el productor. No hay ingest en esta ola.
