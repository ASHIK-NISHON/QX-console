# QX Events Dashboard

A real-time analytics dashboard for monitoring and analyzing Qubic QX smart contract events. Built for Qubic admins to track transactions, detect whale activity, manage alerts, and configure automated notifications.

## Overview

The QX Events Dashboard provides a user-friendly interface to visualize and analyze events from the Qubic QX decentralized exchange smart contract. Data flows in real-time from the Qubic blockchain through a webhook integration, is stored in Supabase, and displayed in an intuitive dashboard.

## Architecture

```
┌─────────────────┐     ┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│ Qubic Blockchain│────▶│ EasyConnect │────▶│       n8n        │────▶│   Supabase  │
│   (QX Contract) │     │             │     │ (Webhook Router) │     │  (Database) │
└─────────────────┘     └─────────────┘     └──────────────────┘     └─────────────┘
                                                                             │
                                                                             ▼
                                                                    ┌─────────────────┐
                                                                    │  QX Dashboard   │
                                                                    │   (React App)   │
                                                                    └─────────────────┘
```

### Data Flow

1. **Qubic Blockchain** - QX smart contract executes transactions (buy/sell orders, transfers, asset issuance)
2. **EasyConnect** - Monitors the blockchain and captures QX events
3. **n8n Workflow** - Receives events via webhook, processes and routes data
4. **Supabase Edge Function** - Webhook endpoint (`/qx-webhook`) receives and stores events
5. **Supabase Database** - Persists all QX events in the `qx_events` table
6. **Dashboard** - Fetches and displays data in real-time with React Query

## Features

### 📊 Overview Dashboard
- **KPI Cards** - Total events, unique wallets, whale transactions, and highest volume events
- **Events Over Time Chart** - Animated bar chart showing activity breakdown by QX action types over 24 hours
- **Recent Activity** - Live feed of the latest QX events

### 📋 Events Page
- **Full Event Table** - Paginated list of all QX events with filtering and search
- **Event Details Dialog** - Click any event to view complete transaction details
- **Whale Tagging** - Events exceeding configured thresholds are tagged as "Whale"

### 👛 Wallets & Segments
- **Wallet List** - All unique wallets that have interacted with QX
- **Transaction History** - View recent transactions for each wallet
- **Advanced Wallet Details** - Fetch comprehensive wallet data from Qubic RPC API including:
  - Current balance
  - Transaction statistics
  - Asset holdings
  - Network status

### 🔔 Alerts
- **Alert Templates** - Pre-configured templates for whale buy/sell alerts
- **Custom Alerts** - Create alerts based on specific QX transaction types and thresholds
- **Multi-Platform Notifications** - Send alerts to Discord, Telegram, or X (Twitter)
- **Alert History** - Track all triggered alerts

### 🎁 Airdrops
- **Airdrop Conditions** - Configure conditions based on QX activity (bids, asks, transfers,etc..)
- **Multi-Platform Support** - Notify recipients via Discord, Telegram, or X
- **Airdrop Templates** - Pre-built conditions for common scenarios

### 🔗 Integrations
- **Discord** - Connect via webhook URL
- **Telegram** - Connect with Bot Token and Chat ID
- **X (Twitter)** - Connect with OAuth 1.0a credentials
- **Credential Validation** - Test connections before saving

### ⚙️ Settings
- **Whale Detection Thresholds** - Configure per-token thresholds for whale detection
- **Custom Tokens** - Add new tokens with custom threshold amounts

## Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Radix UI |
| State Management | React Query (TanStack Query) |
| Database | Supabase (PostgreSQL) |
| Backend | Supabase Edge Functions (Deno) |
| Charts | Recharts |
| Routing | React Router v6 |
| Notifications | Sonner (Toast) |

## Database Schema

### `qx_events` Table
Stores all QX smart contract events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tx_id` | TEXT | Transaction ID |
| `source_id` | TEXT | Source wallet address |
| `dest_id` | TEXT | Destination wallet address |
| `amount` | TEXT | Transaction amount |
| `tick_number` | INTEGER | Qubic tick number |
| `timestamp` | INTEGER | Unix timestamp |
| `procedure_type_name` | TEXT | QX action type (AddToBidOrder, AddToAskOrder, etc.) |
| `procedure_type_value` | INTEGER | Numeric procedure type |
| `asset_name` | TEXT | Token/asset name |
| `issuer_address` | TEXT | Asset issuer address |
| `price` | INTEGER | Order price |
| `number_of_shares` | INTEGER | Number of shares/tokens |
| `money_flew` | BOOLEAN | Whether funds were transferred |
| `input_hex` | TEXT | Raw input data |
| `signature_hex` | TEXT | Transaction signature |
| `raw_payload` | JSONB | Complete raw event data |

### `wallets` Table
Tracks unique wallet addresses.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `address` | TEXT | Wallet address |
| `first_seen_at` | TIMESTAMP | First transaction timestamp |
| `last_seen_at` | TIMESTAMP | Most recent transaction |
| `transaction_count` | INTEGER | Total transaction count |

## QX Transaction Types

The dashboard tracks these QX smart contract operations:

| Action | Description |
|--------|-------------|
| `AddToBidOrder` | Place a buy order |
| `AddToAskOrder` | Place a sell order |
| `RemoveFromBidOrder` | Cancel a buy order |
| `RemoveFromAskOrder` | Cancel a sell order |
| `TransferShareOwnershipAndPossession` | Transfer asset ownership |
| `TransferShareManagementRights` | Transfer management rights |
| `IssueAsset` | Create a new asset |


## Setup & Installation

### Prerequisites
- Node.js 18+
- Supabase account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/ASHIK-NISHON/QX-console.git
   cd qx-events-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the app**
   Navigate to `http://localhost:8080`

### Environment Configuration

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

Replace the placeholders with your actual Supabase project URL and anonymous/public key. You can find these in your Supabase project settings under API.


## Webhook Integration

### Edge Function Endpoint
The webhook endpoint for receiving QX events:
```
POST https://example.supabase.co/functions/v1/qx-webhook
```

## n8n Workflow

The project includes a complete n8n workflow (`n8n workflow/QX-console workflow.json`) that handles two main data flows:

### Workflow Overview

The n8n workflow acts as a middleware between EasyConnect (blockchain monitor) and the QX Console application. It processes incoming events and routes them appropriately.

![n8n Workflow Diagram](n8n%20workflow/n8n-workflow.png)

*Workflow visualization showing the dual-path data flow: Raw QX transactions from EasyConnect and Alert/Airdrop notifications from the dashboard.*

### Workflow Structure

The workflow consists of two main paths:

#### 1. **Raw QX Data Flow** (EasyConnect → Dashboard)
This path handles raw transaction data from EasyConnect:

- **Webhook Trigger** (`/events`) - Receives POST requests from EasyConnect
- **Detect Source** - Checks if the incoming data contains raw QX transaction data
- **Extract Transaction Data** - Extracts and normalizes transaction fields:
  - `ProcedureTypeValue` & `ProcedureTypeName` - Transaction type
  - `sourceId` & `destId` - Wallet addresses
  - `amount`, `tickNumber`, `timestamp` - Transaction details
  - `AssetName`, `IssuerAddress`, `Price`, `NumberOfShares` - Asset information
- **Send to Website Webhook** - Forwards the normalized data to the Supabase Edge Function endpoint

#### 2. **Alert/Airdrop Notification Flow** (Dashboard → External Platforms)
This path handles alert and airdrop notifications from the dashboard:

- **Normalize Alert Data** - Processes alert/airdrop payloads from the dashboard
  - Supports single alerts or arrays of alerts
  - Extracts credentials for Telegram, Discord, and X (Twitter)
  - Normalizes the data structure for routing
- **Route by Source** - Routes notifications based on the target platform:
  - **Route 0**: Telegram (`source: "telegram"`)
  - **Route 1**: Discord (`source: "discord"`)
  - **Route 2**: X/Twitter (`source: "twitter"` or `"x"`)
- **Send to Telegram** - Posts message to Telegram using Bot API
- **Send to Discord** - Posts message to Discord webhook
- **Generate Twitter OAuth** - Generates OAuth 1.0a signature for Twitter API v2
- **Send to X (Twitter)** - Posts tweet using Twitter API v2
- **Build Response** - Constructs success response message
- **Send Response to Website** - Sends response back to the dashboard webhook endpoint

### n8n Workflow Setup

1. **Import the Workflow**
   - Open your n8n instance
   - Import the workflow file: `n8n workflow/QX-console workflow.json`
   - The workflow will be imported with all nodes and connections

2. **Configure Webhook URLs**
   - Update the Supabase webhook URL in the "Send to Website Webhook" and "Send Response to Website" nodes
   - Replace the example URL with your actual Supabase project URL
   - Example format: `https://your-project-id.supabase.co/functions/v1/qx-webhook`

3. **Set Up Credentials** (Optional)
   - For production, configure n8n credentials for Telegram, Discord, and Twitter
   - Alternatively, credentials can be passed in the request payload from the dashboard

4. **Activate the Workflow**
   - Activate the workflow in n8n
   - Copy the webhook URL from the "events" node
   - Configure EasyConnect to send events to this webhook URL

5. **Configure Dashboard**
   - In the QX Console dashboard, go to Settings → Integrations
   - Enter your n8n webhook URL (the URL from the "events" node)
   - This URL will be used for sending alerts and airdrop notifications

### Workflow Features

- **Dual Purpose**: Handles both raw blockchain data and user-triggered notifications
- **Multi-Platform Support**: Routes notifications to Telegram, Discord, and X (Twitter)
- **OAuth 1.0a Authentication**: Automatically generates Twitter API signatures
- **Response Handling**: Sends success/failure responses back to the dashboard
- **Error Resilience**: Each path operates independently, so failures in one don't affect the other

## Qubic RPC API Integration

The dashboard fetches additional wallet details from the Qubic RPC API:
- **Base URL**: `https://rpc.qubic.org`
- **Balance Endpoint**: `POST /v1/balances`
- **Latest Tick**: `GET /v1/latestTick`

## Project Structure

```
src/
├── components/
│   ├── layout/           # Layout components (Sidebar, Header, DashboardLayout)
│   ├── ui/               # shadcn/ui components
│   ├── AdvancedWalletDialog.tsx
│   ├── EventDetailDialog.tsx
│   ├── EventsOverTimeChart.tsx
│   └── KPICard.tsx
├── contexts/
│   ├── IntegrationsContext.tsx  # Integration credentials management
│   └── SettingsContext.tsx      # Whale threshold settings
├── hooks/
│   ├── useQxEvents.ts           # Fetch QX events from Supabase
│   ├── useWallets.ts            # Fetch wallet data
│   ├── useKPIStats.ts           # Calculate KPI statistics
│   ├── useWhaleDetection.ts     # Whale detection logic
│   └── useAdvancedWalletDetails.ts
├── lib/
│   ├── qubicWalletAnalyzer.ts   # Qubic RPC API client
│   └── utils.ts
├── pages/
│   ├── Overview.tsx
│   ├── Events.tsx
│   ├── WalletsSegments.tsx
│   ├── Alerts.tsx
│   ├── Airdrops.tsx
│   ├── Integrations.tsx
│   └── Settings.tsx
├── integrations/
│   └── supabase/
│       ├── client.ts     # Supabase client initialization
│       └── types.ts      # Auto-generated database types
└── types/
    └── qxEvent.ts        # QX event type definitions

supabase/
├── config.toml           # Supabase configuration
└── functions/
    └── qx-webhook/       # Edge function for receiving events
        └── index.ts
```


---


App demo->https://qx-console.vercel.app/
*optimesed for desktop*.   
                      -demo live works till the easyconnect limitations ends🙂.

---

**Built for admins and developers** ❤️
