// Qubic Wallet Analyzer - TypeScript version for browser/React usage

// -----------------------------
// Types & Config
// -----------------------------

export interface QubicRpcConfig {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export interface RpcError {
  error: string;
}

export interface BalanceInfo {
  balance: number | { balance: string | number; [key: string]: unknown };
  validForTick?: number;
  latestIncomingTransferTick?: number;
  latestOutgoingTransferTick?: number;
  incomingAmount?: number;
  outgoingAmount?: number;
  numberOfIncomingTransfers?: number;
  numberOfOutgoingTransfers?: number;
  [key: string]: unknown;
}

export interface OwnedAsset {
  data?: {
    issuedAsset?: {
      name?: string;
    };
    numberOfUnits?: string | number;
    ownerIdentity?: string;
    type?: number;
    [key: string]: unknown;
  };
  info?: {
    tick?: number;
    universeIndex?: number;
  };
  [key: string]: unknown;
}

export interface OwnedAssetsResponse {
  ownedAssets?: OwnedAsset[];
  [key: string]: unknown;
}

export interface PossessedAsset {
  data?: {
    possessedAsset?: {
      name?: string;
    };
    numberOfUnits?: string | number;
    ownerIdentity?: string;
    type?: number;
    [key: string]: unknown;
  };
  info?: {
    tick?: number;
    universeIndex?: number;
  };
  [key: string]: unknown;
}

export interface PossessedAssetsResponse {
  possessedAssets?: PossessedAsset[];
  [key: string]: unknown;
}

export interface IssuedAsset {
  data?: {
    issuedAsset?: {
      name?: string;
      numberOfUnits?: string | number;
      unitOfMeasurement?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface IssuedAssetsResponse {
  issuedAssets?: IssuedAsset[];
  [key: string]: unknown;
}

export interface NetworkInfo {
  latest_tick?: number;
  status: "connected" | "disconnected";
  error?: string;
}

export interface AdditionalWalletData {
  owned_assets?: OwnedAssetsResponse | RpcError;
  possessed_assets?: PossessedAssetsResponse | RpcError;
  issued_assets?: IssuedAssetsResponse | RpcError;
}

export interface WalletStatistics {
  balance: number;
  valid_for_tick?: number;
  latest_incoming_transfer_tick?: number;
  latest_outgoing_transfer_tick?: number;
  incoming_amount: number;
  outgoing_amount: number;
  number_of_incoming_transfers: number;
  number_of_outgoing_transfers: number;
  total_transfers: number;
}

export interface WalletAnalysisResult {
  address: string;
  valid: boolean;
  network_info: NetworkInfo;
  balance_info: BalanceInfo | RpcError;
  statistics: WalletStatistics | Record<string, never>;
  additional_data: AdditionalWalletData | Record<string, never>;
  error?: string;
}

// -----------------------------
// RPC Client (browser-safe)
// -----------------------------

export class QubicRpcClient {
  private baseUrl: string;
  private fetchImpl: typeof fetch;

  constructor(config: QubicRpcConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private async request<T>(path: string): Promise<T> {
    const url = this.baseUrl + path;

    const res = await this.fetchImpl(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }

    return (await res.json()) as T;
  }

  async getBalance(address: string): Promise<BalanceInfo> {
    const data = await this.request<{ balance: Record<string, unknown> }>(`/v1/balances/${encodeURIComponent(address)}`);
    // The API returns { balance: { id, balance, ... } } - extract the inner balance object
    const balanceObj = data.balance || {};
    return {
      balance: Number(balanceObj.balance ?? 0),
      validForTick: balanceObj.validForTick as number | undefined,
      latestIncomingTransferTick: balanceObj.latestIncomingTransferTick as number | undefined,
      latestOutgoingTransferTick: balanceObj.latestOutgoingTransferTick as number | undefined,
      incomingAmount: Number(balanceObj.incomingAmount ?? 0),
      outgoingAmount: Number(balanceObj.outgoingAmount ?? 0),
      numberOfIncomingTransfers: balanceObj.numberOfIncomingTransfers as number | undefined,
      numberOfOutgoingTransfers: balanceObj.numberOfOutgoingTransfers as number | undefined,
    };
  }

  async getLatestTick(): Promise<number> {
    const data = await this.request<{ latestTick: number }>("/v1/latestTick");
    return data.latestTick;
  }

  async getOwnedAssets(address: string): Promise<OwnedAssetsResponse> {
    return this.request<OwnedAssetsResponse>(`/v1/assets/${encodeURIComponent(address)}/owned`);
  }

  async getPossessedAssets(address: string): Promise<PossessedAssetsResponse> {
    return this.request<PossessedAssetsResponse>(`/v1/assets/${encodeURIComponent(address)}/possessed`);
  }

  async getIssuedAssets(address: string): Promise<IssuedAssetsResponse> {
    return this.request<IssuedAssetsResponse>(`/v1/assets/${encodeURIComponent(address)}/issued`);
  }
}

// -----------------------------
// Wallet Analyzer
// -----------------------------

export class WalletAnalyzer {
  private rpc: QubicRpcClient;

  constructor(rpcConfig: QubicRpcConfig) {
    this.rpc = new QubicRpcClient(rpcConfig);
  }

  validateAddress(address: string): boolean {
    if (!address || typeof address !== "string") return false;
    if (address.length !== 60) return false;
    if (!/^[A-Za-z0-9]+$/.test(address)) return false;
    return true;
  }

  async getBalanceInfo(address: string): Promise<BalanceInfo | RpcError> {
    try {
      return await this.rpc.getBalance(address);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: `Failed to fetch balance: ${msg}` };
    }
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      const latestTick = await this.rpc.getLatestTick();
      return { latest_tick: latestTick, status: "connected" };
    } catch (e) {
      // Even if latestTick fails, we can still show data - mark as connected if balance works
      console.warn("Failed to fetch latest tick:", e);
      return { status: "connected", latest_tick: undefined };
    }
  }

  async getAdditionalData(address: string): Promise<AdditionalWalletData> {
    const additional: AdditionalWalletData = {};

    try {
      additional.owned_assets = await this.rpc.getOwnedAssets(address);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      additional.owned_assets = { error: `Failed to fetch: ${msg}` };
    }

    try {
      additional.possessed_assets = await this.rpc.getPossessedAssets(address);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      additional.possessed_assets = { error: `Failed to fetch: ${msg}` };
    }

    try {
      additional.issued_assets = await this.rpc.getIssuedAssets(address);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      additional.issued_assets = { error: `Failed to fetch: ${msg}` };
    }

    return additional;
  }

  private buildStatistics(balanceInfo: BalanceInfo | RpcError): WalletStatistics | Record<string, never> {
    if (!balanceInfo || "error" in balanceInfo) {
      return {};
    }

    // Balance is now directly a number from getBalance
    const balanceValue = typeof balanceInfo.balance === 'number' 
      ? balanceInfo.balance 
      : Number(balanceInfo.balance ?? 0);

    return {
      balance: balanceValue,
      valid_for_tick: balanceInfo.validForTick,
      latest_incoming_transfer_tick: balanceInfo.latestIncomingTransferTick,
      latest_outgoing_transfer_tick: balanceInfo.latestOutgoingTransferTick,
      incoming_amount: balanceInfo.incomingAmount ?? 0,
      outgoing_amount: balanceInfo.outgoingAmount ?? 0,
      number_of_incoming_transfers: balanceInfo.numberOfIncomingTransfers ?? 0,
      number_of_outgoing_transfers: balanceInfo.numberOfOutgoingTransfers ?? 0,
      total_transfers: (balanceInfo.numberOfIncomingTransfers ?? 0) + (balanceInfo.numberOfOutgoingTransfers ?? 0),
    };
  }

  async analyzeWallet(address: string): Promise<WalletAnalysisResult> {
    if (!this.validateAddress(address)) {
      return {
        address,
        valid: false,
        network_info: { status: "disconnected", error: "Invalid wallet address format" },
        balance_info: { balance: 0 },
        statistics: {},
        additional_data: {},
        error: "Invalid wallet address format",
      };
    }

    const [networkInfo, balanceInfo] = await Promise.all([
      this.getNetworkInfo(),
      this.getBalanceInfo(address),
    ]);

    const statistics = this.buildStatistics(balanceInfo);
    const additionalData = await this.getAdditionalData(address);

    return {
      address,
      valid: true,
      network_info: networkInfo,
      balance_info: balanceInfo,
      statistics,
      additional_data: additionalData,
    };
  }
}

// Default instance
export const walletAnalyzer = new WalletAnalyzer({ baseUrl: "https://rpc.qubic.org" });
