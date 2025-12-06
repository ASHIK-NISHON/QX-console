import { useQuery } from '@tanstack/react-query';
import { walletAnalyzer, WalletAnalysisResult } from '@/lib/qubicWalletAnalyzer';

export function useAdvancedWalletDetails(address: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ['advanced-wallet-details', address],
    queryFn: async (): Promise<WalletAnalysisResult | null> => {
      if (!address) return null;
      return walletAnalyzer.analyzeWallet(address);
    },
    enabled: !!address && enabled,
    staleTime: 60000, // Data is fresh for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}
