import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WalletDB, QxEventDB } from '@/types/qxEvent';

export interface WalletWithStats {
  address: string;
  firstSeenAt: string;
  lastSeenAt: string;
  transactionCount: number;
  latestTickNo: number;
}

export function useWallets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['wallets'],
    queryFn: async (): Promise<WalletWithStats[]> => {
      // Get unique wallets from events (source_id)
      const { data: events, error } = await supabase
        .from('qx_events')
        .select('source_id, tick_number, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching wallets:', error);
        throw error;
      }

      // Group by wallet address and get stats
      const walletMap = new Map<string, WalletWithStats>();
      
      events?.forEach((event: { source_id: string; tick_number: number; created_at: string }) => {
        const existing = walletMap.get(event.source_id);
        if (!existing) {
          walletMap.set(event.source_id, {
            address: event.source_id,
            firstSeenAt: event.created_at,
            lastSeenAt: event.created_at,
            transactionCount: 1,
            latestTickNo: event.tick_number,
          });
        } else {
          existing.transactionCount++;
          if (event.tick_number > existing.latestTickNo) {
            existing.latestTickNo = event.tick_number;
            existing.lastSeenAt = event.created_at;
          }
          if (new Date(event.created_at) < new Date(existing.firstSeenAt)) {
            existing.firstSeenAt = event.created_at;
          }
        }
      });

      return Array.from(walletMap.values()).sort((a, b) => b.latestTickNo - a.latestTickNo);
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Set up real-time subscription for new events
  useEffect(() => {
    const channel = supabase
      .channel('wallets-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qx_events',
        },
        () => {
          // Invalidate wallets query when new event comes in
          queryClient.invalidateQueries({ queryKey: ['wallets'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

// Fetch wallet details from Qubic RPC API
export interface QubicWalletDetails {
  balance: string;
  validForTick: number;
  latestIncomingTransferTick: number;
  latestOutgoingTransferTick: number;
  incomingAmount: string;
  outgoingAmount: string;
  numberOfIncomingTransfers: number;
  numberOfOutgoingTransfers: number;
}

export function useWalletDetails(address: string | null) {
  return useQuery({
    queryKey: ['wallet-details', address],
    queryFn: async (): Promise<QubicWalletDetails | null> => {
      if (!address) return null;

      try {
        // Using Qubic RPC API to fetch wallet balance
        const response = await fetch('https://rpc.qubic.org/v1/balances/' + address);
        
        if (!response.ok) {
          console.error('Failed to fetch wallet details:', response.statusText);
          return null;
        }

        const data = await response.json();
        
        if (data.balance) {
          return {
            balance: data.balance.balance || '0',
            validForTick: data.balance.validForTick || 0,
            latestIncomingTransferTick: data.balance.latestIncomingTransferTick || 0,
            latestOutgoingTransferTick: data.balance.latestOutgoingTransferTick || 0,
            incomingAmount: data.balance.incomingAmount || '0',
            outgoingAmount: data.balance.outgoingAmount || '0',
            numberOfIncomingTransfers: data.balance.numberOfIncomingTransfers || 0,
            numberOfOutgoingTransfers: data.balance.numberOfOutgoingTransfers || 0,
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching wallet details:', error);
        return null;
      }
    },
    enabled: !!address,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}