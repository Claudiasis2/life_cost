# Plan de arquitectura React

## Alcance y principios

Este documento traduce el comportamiento del frontend jQuery actual a la arquitectura React ya creada en `static/react/src`. No implementa ni modifica funcionalidades. La migración conserva los endpoints Flask existentes, centraliza las peticiones en `shared/api/httpClient.js` y organiza cada dominio bajo `features/`.

Principios de estado:

- El estado de servidor se conserva en los hooks de cada funcionalidad, junto con `loading` y `error` por recurso.
- El estado de interfaz vive en el ancestro común más cercano; no se duplica en filas, celdas ni modales.
- Los valores derivados (semanas del mes, total de las filas visibles y saldo acumulado) se calculan con `useMemo`, no se almacenan.
- El usuario y la cartera activa proceden de `GET /api/me`; no se duplican como datos de ejemplo en el cliente.
- Las mutaciones de una transacción invalidan o recargan tanto la lista activa como el resumen mensual.

## Contratos de datos relevantes

```text
UserSession
  is_authenticated: boolean
  user: { id, username, email, picture, last_visited_wallet_id, active_wallet, wallets[] } | null

Wallet
  id, name, description

Transaction
  id, amount, description, created_at, modifed_at, created_by, tags[]

Tag
  id, name, category_id

MonthlySummary
  month, year, mean, mean_month, total_amount,
  days: [{ day, total_amount }]

ChartPoint (respuesta API)
  Date, Close
```

`modifed_at` conserva la grafía actual de la API. El adaptador de la funcionalidad puede normalizarlo a `modifiedAt` internamente, sin cambiar el contrato del backend.

## Componentes y responsabilidades

### Estructura transversal

| Componente | Responsabilidad | Estado local | Props |
| --- | --- | --- | --- |
| `App` | Declara rutas lazy y sus límites de carga. | Ninguno. | Ninguna. |
| `MainLayout` | Compone cabecera, navegación y contenido de la ruta. | Ninguno. | `children` implícito mediante `Outlet`. |
| `Header` | Muestra identidad, cartera activa y acceso al gráfico. | Ninguno; consume sesión/cartera. | `onOpenChart`. |
| `Sidebar` | Navegación de aplicación. | Ninguno. | Ninguna inicialmente. |
| `GlobalErrorBoundary` | Captura errores de render no recuperables. | `hasError`. | `children`. |
| `MoneyAmount` | Formatea importe y aplica semántica visual según signo. | Ninguno. | `amount`, `currency?`, `className?`. |
| `Modal` | Contenedor accesible de diálogos. | Gestiona foco mientras está abierto. | `isOpen`, `title`, `onClose`, `children`. |

`AppProviders` seguirá siendo el lugar de proveedores globales. La sesión no debe residir como copia manual dentro de `Header`: se expone mediante un `SessionProvider` o una ampliación del proveedor actual.

### `features/session`

| Componente / hook | Responsabilidad | Estado / props |
| --- | --- | --- |
| `SessionProvider` | Carga y expone identidad, carteras y cartera activa. | Estado: `session`, `isLoading`, `error`. |
| `useSession` | Consume la sesión en cualquier feature. | Devuelve estado y `refreshSession`. |
| `useActiveWallet` | Encapsula el cambio de cartera y refresco de sesión. | Devuelve `activeWallet`, `wallets`, `selectWallet`, `isSaving`. |
| `WalletSelector` | Selector controlado de cartera. | Props: `wallets`, `value`, `onChange`, `disabled`. |

El `Header` consumirá `useSession` y pasará los datos a `WalletSelector`; la recarga completa de página usada por jQuery se sustituye por refresco de sesión y de los recursos dependientes.

### `features/calendar`

| Componente / hook | Responsabilidad | Estado local | Props |
| --- | --- | --- | --- |
| `CalendarPage` | Coordinador de la vista de inicio: mes, selección de día, resumen y panel de transacciones. | `visibleMonth`, `selectedDate`. | Ninguna como ruta. |
| `CalendarControls` | Cambia el mes visible. | Ninguno. | `month`, `onPreviousMonth`, `onNextMonth`. |
| `Calendar` | Construye la cuadrícula de 6 × 7 y distribuye importes diarios. | Ninguno; semanas derivadas. | `month`, `selectedDate`, `summary`, `onSelectDate`. |
| `CalendarDay` | Presenta un día, su total y sus estados actual/seleccionado. | Ninguno. | `date`, `amount`, `isToday`, `isSelected`, `onSelect`. |
| `MonthlySummary` | Presenta total mensual y los dos promedios actuales. | Ninguno. | `summary`. |
| `useMonthlySummary` | Carga resumen para el mes y zona horaria actual. | `data`, `isLoading`, `error`; recibe `visibleMonth`. | No aplica. |

`CalendarPage` limpia `selectedDate` cuando cambia `visibleMonth`, igual que el frontend legado. Tras una mutación confirmada, pide de nuevo el mes visible a `useMonthlySummary`.

### `features/transactions`

| Componente / hook | Responsabilidad | Estado local | Props |
| --- | --- | --- | --- |
| `TransactionsPanel` | Selecciona la fuente de la lista y coordina tabla, formulario y detalle. | `filter`, `editingTransactionId`, `selectedTransaction`. | `selectedDate`, `onMutationSuccess`. |
| `TransactionTable` | Muestra filas y total de las transacciones visibles. | Ninguno; total derivado. | `transactions`, `isLoading`, `error`, `onSelect`, `onEdit`, `onDelete`, `onTagSelect`. |
| `TransactionRow` | Muestra una transacción y acciones. | Ninguno. | `transaction`, `onSelect`, `onEdit`, `onDelete`, `onTagSelect`. |
| `TransactionForm` | Alta o edición con inputs controlados. | `description`, `amount`, `tagsText`, `errors`, `isSubmitting`. | `transaction?`, `defaultDate`, `onSubmit`, `onCancel`. |
| `TransactionDetailsModal` | Detalle y acciones de la transacción seleccionada. | Ninguno. | `transaction`, `isOpen`, `onClose`, `onEdit`, `onDelete`, `onTagSelect`. |
| `Tag` | Etiqueta de categoría clicable. | Ninguno. | `tag`, `onSelect`. |
| `useTransactions` | Lee la fuente activa: recientes, día o categoría. Ejecuta mutaciones e invalida la consulta activa. | `transactions`, `query`, `isLoading`, `error`, `isMutating`. | Recibe `{ mode, date, categoryId }`. |
| `useTransactionForm` | Validación y conversión de formulario a payload de API. | Estado del formulario y errores. | Recibe `transaction?`, `defaultDate`, `onSubmit`. |

`filter` debe ser una unión explícita para no conservar estados incompatibles:

```text
{ type: 'recent' }
{ type: 'date', date: Date }
{ type: 'tag', categoryId: number, label: string }
```

Al seleccionar un día, `CalendarPage` entrega `selectedDate` y el panel usa `{ type: 'date' }`. Al pulsar un tag, `TransactionsPanel` cambia a `{ type: 'tag' }`. La navegación mensual no debe alterar por sí sola un filtro de tag.

### `features/charts`

| Componente / hook | Responsabilidad | Estado local | Props |
| --- | --- | --- | --- |
| `ChartModal` | Controla apertura, carga y cierre del gráfico. | `isOpen` puede vivir en `CalendarPage`; datos en hook. | `isOpen`, `onClose`, `onSelectDate`. |
| `BalanceChart` | Dibuja la serie acumulada, tooltip y selección de punto. | Tooltip/medidas del contenedor; no conserva la serie. | `data`, `onSelectDate`. |
| `useChartData` | Solicita y transforma los puntos de gráfico en serie acumulada inmutable. | `data`, `isLoading`, `error`. | `enabled`. |

Al pulsar un punto, `ChartModal` llama `onSelectDate(point.date)`. `CalendarPage` cierra el modal, actualiza `visibleMonth` si hace falta y selecciona el día; `TransactionsPanel` carga las transacciones de ese día.

## Hooks transversales necesarios

| Hook | Ubicación | Finalidad |
| --- | --- | --- |
| `useSession` | `features/session/hooks` | Exponer sesión real de `/api/me`. |
| `useActiveWallet` | `features/session/hooks` | Cambiar cartera y notificar la invalidación de datos dependientes. |
| `useMonthlySummary` | `features/calendar/hooks` | Encapsular la consulta mensual. |
| `useTransactions` | `features/transactions/hooks` | Resolver lista, CRUD y estados de red. |
| `useTransactionForm` | `features/transactions/hooks` | Validar descripción, importe y tags antes de mutar. |
| `useChartData` | `features/charts/hooks` | Obtener y normalizar serie acumulada. |
| `useTimeZone` | `shared/hooks` | Devolver `Intl.DateTimeFormat().resolvedOptions().timeZone` una vez por render. |
| `useDisclosure` | `shared/hooks` | Abrir/cerrar modales con una API uniforme. |

No se necesita un hook para manipulación de DOM equivalente a jQuery. Las filas editables se sustituyen por `TransactionForm` controlado; el foco inicial se gestiona con `useRef` y `useEffect` dentro del formulario.

## APIs requeridas

| Dominio | Método y ruta | Solicitud | Respuesta / consumidor |
| --- | --- | --- | --- |
| Sesión | `GET /api/me` | — | `UserSession`; `SessionProvider`. |
| Cartera activa | `POST /update_last_visited_wallet` | `{ wallet_id }` | Confirmación; `useActiveWallet` refresca sesión e invalida datos de cartera. |
| Recientes | `GET /last_money_transfers/5` | — | `Transaction[]`; `useTransactions` en modo `recent`. |
| Por día | `POST /money_transfer_from_date` | `{ date: ISO, timeZone }` | `Transaction[]`; `useTransactions` en modo `date`. |
| Por categoría | `GET /money_transfers_by_category/:categoryId` | — | `Transaction[]`; `useTransactions` en modo `tag`. |
| Crear | `POST /add_money` | `{ description, amount, tags, created_at }` | Confirmación; `useTransactions.create`. |
| Editar | `POST /edit_money` | `{ id, description, amount, tags, created_at }` | Confirmación; `useTransactions.update`. |
| Eliminar | `DELETE /remove_money/:id` | — | Confirmación; `useTransactions.remove`. |
| Resumen mensual | `POST /money_transfers` | `{ date: ISO, timeZone }` | `MonthlySummary`; `useMonthlySummary`. |
| Serie | `POST /chart_data` | `{ timeZone }` | `ChartPoint[]`; `useChartData`. |
| Autenticación | `GET /google_login`, `GET /logout` | Navegación | `Header` e interceptor 401. |

El cliente HTTP existente ya centraliza errores y reacciones 401/403. Cada hook conserva el error operativo para mostrar una recuperación local; el `GlobalErrorBoundary` se reserva para fallos de render inesperados.

## Dependencias entre componentes

```text
App
└── MainLayout
    ├── Header ──────────────── SessionProvider / WalletSelector
    ├── Sidebar
    └── CalendarPage
        ├── CalendarControls
        ├── Calendar ────────── useMonthlySummary
        │   └── CalendarDay
        ├── MonthlySummary ──── useMonthlySummary
        ├── TransactionsPanel ─ useTransactions
        │   ├── TransactionTable
        │   │   ├── TransactionRow
        │   │   └── Tag
        │   ├── TransactionForm ─ useTransactionForm
        │   └── TransactionDetailsModal
        │       └── Tag
        └── ChartModal ──────── useChartData
            └── BalanceChart
```

Flujos de actualización:

1. `SessionProvider` cambia de cartera → invalida `useMonthlySummary`, `useTransactions` y `useChartData`.
2. `CalendarDay` selecciona fecha → `CalendarPage` actualiza `selectedDate` → `TransactionsPanel` cambia a consulta por día.
3. Crear, editar o borrar → `TransactionsPanel` recarga su fuente activa y llama `onMutationSuccess` → `CalendarPage` actualiza el resumen mensual; si el gráfico está abierto o queda cacheado, también se invalida.
4. Un tag → `TransactionsPanel` cambia el filtro, sin modificar la fecha seleccionada del calendario.
5. Un punto de gráfico → `CalendarPage` actualiza mes y fecha seleccionados → el panel muestra el día asociado.

## Orden de migración recomendado

1. `session`: cargar `/api/me`, selector de cartera y la invalidación compartida.
2. `calendar`: controles, cuadrícula, resumen mensual y selección de fecha.
3. `transactions`: listado reciente y por fecha; después formulario, edición, eliminación, detalle y tags.
4. `charts`: modal, serie acumulada y vínculo hacia el día seleccionado.
5. Retirar scripts jQuery y CSS legacy solo después de paridad funcional comprobada.
