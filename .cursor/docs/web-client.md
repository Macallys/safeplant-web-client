# Plant Manager Web Client

Cliente Angular del encargado de planta. Gobierna cuentas y consulta métricas. No configura áreas, no registra dispositivos y no anula actuadores: esas acciones responden 403.

El contrato está en [api-dtos.md](./api-dtos.md). Este archivo dice qué pantalla llama qué, cómo se diseña y cómo queda el repo vacío.

## Pantallas y datos

| Pantalla | Operación | Verbo y path | Request | Response |
|---|---|---|---|---|
| Sign-in | `SignIn` | `POST /api/v1/auth/login` | `email`, `password`, `channel: Web` | `accessToken`, `role`, `expiresAt` |
| Cierre de sesión | `CloseSession` | `POST /api/v1/auth/logout` (**To discuss**) | bearer | 204 |
| Recuperar acceso | `RequestCredentialRecovery` | `POST /api/v1/auth/recovery` (**To discuss**) | `email` | 202 |
| Nueva contraseña | `ResetCredentials` | `POST /api/v1/auth/reset` (**To discuss**) | `token`, `password` | 204 |
| Alta de cuenta | `CreateUserAccount` | `POST /api/v1/users` (**To discuss**) | `email`, `password`, `role` | `id`, `email`, `role`, `enabled` |
| Asignar rol | `AssignUserRole` | `PATCH /api/v1/users/{accountId}/role` (**To discuss**) | `role` | cuenta |
| Directorio | `UserAccountsDirectory` | `GET /api/v1/users` (**To discuss**) | bearer | `items[]` |
| Dashboard | `PlantMetricsDashboard` | `GET /api/v1/metrics/dashboard` (**To discuss**) | bearer | fila por área |
| Historial | `PlantHistory` | `GET /api/v1/areas/{areaId}/history?from&to` (**To discuss**) | periodo | tres series de lecturas, alertas y acciones |

`refreshToken`, `expiresIn` y `name` en el alta están **To discuss** en el contrato. No los muestres hasta cerrarlos.

El dashboard y el historial pueden llegar vacíos mientras no exista el Edge. La UI informa que no hay eventos en el periodo (US23), no inventa lecturas.

Si el usuario intenta anular un actuador desde una alerta del dashboard, la UI no llama al override. El control operativo es del móvil (US23 escenario 4).

El bearer va en cada llamada salvo login, recovery y reset. Guarda `accessToken` y `expiresAt`. Si `role` no es `PlantManager`, no entres al shell de gobernanza.

## Diseño visual

Fuente de verdad, ya exportada en el Capítulo V:

| Qué | Archivo |
|---|---|
| Estilo general | `assets/05-capitulo-v/style-guidelines/general.png` |
| Web, móvil e IoT | `assets/05-capitulo-v/style-guidelines/web-mobile-iot.png` |
| Organización | `assets/05-capitulo-v/information-architecture/organization-systems.png` |
| Navegación | `assets/05-capitulo-v/information-architecture/navigation-systems.png` |
| Wireframes de aplicaciones | `assets/05-capitulo-v/applications/wireframes.png` |
| Wireflow | `assets/05-capitulo-v/applications/wireflow.png` |
| Mockups | `assets/05-capitulo-v/applications/mockups.png` |
| User flow | `assets/05-capitulo-v/applications/user-flow.png` |
| Prototipo | `assets/05-capitulo-v/applications/prototype.png` |

La landing (`assets/05-capitulo-v/landing/`) no es este repo.

Esas imágenes fijan información y flujo. El kit de implementación es Angular 22.2 con Tailwind v4, no Angular Material. Las reglas del repo (`.cursor/rules/angular-core.mdc` y `ui-adaptation.mdc`) y el paquete `safeplant-frontend` dicen cómo se instalan Figma, Context7, Motion, Playwright y el skill `frontend-design`.

Tres catálogos para revisar componentes antes de crearlos (referencia React, se traducen a Angular): [KokonutUI](https://kokonutui.com/docs), [Skiper UI](https://skiper-ui.com/), [Bklit UI](https://bklit.com/).

## Scaffolding

Lo crea quien arma los repos. Angular **22.2** (CLI 22.2.1), standalone, TypeScript estricto (`>=6.0.0 <6.1.0`), Node.js `^22.22.3`, `^24.15.0` o `^26.0.0`, Tailwind v4, zoneless (default desde v21). Sin SSR. Nombres de archivo de la guía 2025 (`accounts.ts` y `accounts.html`, sin sufijo `.component`). Este documento no corre el CLI.

Nombre sugerido del repo: `plant-manager-web`.

```
src/app/
  core/                 interceptor del bearer, guarda de sesión
  features/
    accounts/           alta, roles, directorio
    recovery/           solicitud y reset
    metrics/            dashboard e historial
  shared/
```

`src/environments` con `apiBaseUrl`. Sin proyecto de landing dentro de este repo.

Rutas de arranque: `/login`, `/recovery`, `/reset`, `/users`, `/metrics`, `/metrics/:areaId/history`.
