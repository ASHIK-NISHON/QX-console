import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QxEventDB, DisplayEvent, transformEvent } from '@/types/qxEvent';

export function useQxEvents(limit: number = 100) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['qx-events', limit],
    queryFn: async (): Promise<DisplayEvent[]> => {
      const { data, error } = await supabase
        .from('qx_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      return (data as QxEventDB[]).map(transformEvent);
    },
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('qx-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qx_events',
        },
        (payload) => {
          console.log('New event received:', payload);
          // Add new event to the top of the list
          queryClient.setQueryData(['qx-events', limit], (oldData: DisplayEvent[] | undefined) => {
            if (!oldData) return [transformEvent(payload.new as QxEventDB)];
            const newEvent = transformEvent(payload.new as QxEventDB);
            return [newEvent, ...oldData.slice(0, limit - 1)];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, limit]);

  return query;
}

export function useEventsByWallet(walletAddress: string | null) {
  return useQuery({
    queryKey: ['wallet-events', walletAddress],
    queryFn: async (): Promise<DisplayEvent[]> => {
      if (!walletAddress) return [];

      const { data, error } = await supabase
        .from('qx_events')
        .select('*')
        .or(`source_id.eq.${walletAddress},dest_id.eq.${walletAddress}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching wallet events:', error);
        throw error;
      }

      return (data as QxEventDB[]).map(transformEvent);
    },
    enabled: !!walletAddress,
  });
}