import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWhaleDetection, parseAmount } from '@/hooks/useWhaleDetection';

interface KPIStats {
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

      // Get all events from last 24 hours
      const { data: events, error } = await supabase
        .from('qx_events')
        .select('*')
        .gte('timestamp', twentyFourHoursAgo);

      if (error) {
        console.error('Error fetching KPI stats:', error);
        throw error;
      }

      if (!events || events.length === 0) {
        return {
          totalEvents24h: 0,
          activeWallets24h: 0,
          whalesDetected24h: 0,
          totalVolume24h: 0,
        };
      }

      // Calculate stats
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

      return {
        totalEvents24h: events.length,
        activeWallets24h: uniqueWallets.size,
        whalesDetected24h: whaleCount,
        totalVolume24h: totalVolume,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
}