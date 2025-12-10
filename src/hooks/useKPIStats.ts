import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWhaleDetection, parseAmount } from '@/hooks/useWhaleDetection';

interface KPIStats {
  totalEvents: number;
  activeWallets: number;
  whalesDetected: number;
  totalVolume: number;
  totalEvents24h: number;
  activeWallets24h: number;
  whalesDetected24h: number;
  totalVolume24h: number;
}

export function useKPIStats() {
  const { isWhale } = useWhaleDetection();

  return useQuery({
    queryKey: ['kpi-stats'],
    queryFn: async (): Promise<KPIStats> => {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

      // Get all events (overall stats)
      const { data: allEvents, error: allError } = await supabase
        .from('qx_events')
        .select('*');

      // Get events from last 24 hours
      const { data: events24h, error: events24hError } = await supabase
        .from('qx_events')
        .select('*')
        .gte('timestamp', twentyFourHoursAgo);

      if (allError || events24hError) {
        console.error('Error fetching KPI stats:', allError || events24hError);
        throw allError || events24hError;
      }

      const events = allEvents || [];
      const events24hData = events24h || [];

      // Calculate overall stats
      const uniqueWallets = new Set<string>();
      let whaleCount = 0;
      let totalVolume = 0;

      events.forEach((event) => {
        uniqueWallets.add(event.source_id);
        
        const amount = parseInt(event.amount) || 0;
        const token = event.asset_name || 'QUBIC';
        totalVolume += amount;

        if (isWhale(token, amount)) {
          whaleCount++;
        }
      });

      // Calculate 24h stats
      const uniqueWallets24h = new Set<string>();
      let whaleCount24h = 0;
      let totalVolume24h = 0;

      events24hData.forEach((event) => {
        uniqueWallets24h.add(event.source_id);
        
        const amount = parseInt(event.amount) || 0;
        const token = event.asset_name || 'QUBIC';
        totalVolume24h += amount;

        if (isWhale(token, amount)) {
          whaleCount24h++;
        }
      });

      return {
        totalEvents: events.length,
        activeWallets: uniqueWallets.size,
        whalesDetected: whaleCount,
        totalVolume: totalVolume,
        totalEvents24h: events24hData.length,
        activeWallets24h: uniqueWallets24h.size,
        whalesDetected24h: whaleCount24h,
        totalVolume24h: totalVolume24h,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
}