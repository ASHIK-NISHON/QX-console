import { useState, useMemo, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "@/hooks/use-toast";
import { KPICard } from "@/components/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Wallet,
  Fish,
  Sparkles,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { shortenAddress } from "@/data/events";
import { EventDetailDialog } from "@/components/EventDetailDialog";
import { useWhaleDetection, parseAmount } from "@/hooks/useWhaleDetection";
import { useQxEvents } from "@/hooks/useQxEvents";
import { useKPIStats } from "@/hooks/useKPIStats";
import { DisplayEvent } from "@/types/qxEvent";

function getEventBadgeVariant(type: string) {
  switch (type) {
    case "AddToBidOrder":
      return "default";
    case "AddToAskOrder":
      return "destructive";
    case "TransferShareOwnershipAndPossession":
      return "secondary";
    case "IssueAsset":
      return "outline";
    default:
      return "secondary";
  }
}

function getEventTypeLabel(type: string) {
  const labels: Record<string, string> = {
    IssueAsset: "Issue Asset",
    AddToAskOrder: "Ask Order",
    AddToBidOrder: "Bid Order",
    TransferShareOwnershipAndPossession: "Transfer",
    RemoveFromAskOrder: "Cancel Ask",
    RemoveFromBidOrder: "Cancel Bid",
    TransferShareManagementRights: "Mgmt Transfer",
  };
  return labels[type] || type;
}

export default function Overview() {
  const [selectedEvent, setSelectedEvent] = useState<DisplayEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenFilter, setTokenFilter] = useState("all-tokens");
  const [typeFilter, setTypeFilter] = useState("all-types");
  const [timeFilter, setTimeFilter] = useState("all");
  const { isWhale, whaleThresholds } = useWhaleDetection();
  const prevWhaleCountRef = useRef<number | null>(null);

  const { data: events = [], isLoading: eventsLoading } = useQxEvents(50);
  const { data: kpiStats } = useKPIStats();

  // Detect whale events
  const detectWhaleInEvent = (event: DisplayEvent): boolean => {
    const amount = parseAmount(event.amount);
    return isWhale(event.token, amount);
  };

  // Find whale events based on current thresholds
  const whaleEvents = useMemo(() => {
    return events.filter((e) => detectWhaleInEvent(e));
  }, [events, whaleThresholds]);

  const whaleEvent = whaleEvents[0] || events[0];

  // Show toast notification when whale events are detected
  useEffect(() => {
    const currentCount = whaleEvents.length;
    
    if (prevWhaleCountRef.current !== null && currentCount > 0 && currentCount !== prevWhaleCountRef.current) {
      toast({
        title: "🐋 Whale Activity Detected!",
        description: `${currentCount} whale event${currentCount > 1 ? 's' : ''} found based on your thresholds.`,
      });
    }
    
    prevWhaleCountRef.current = currentCount;
  }, [whaleEvents.length, whaleThresholds]);

  const handleEventClick = (event: DisplayEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  // Filter events based on search and filters
  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchesFrom = event.from.toLowerCase().includes(query);
      const matchesTo = event.to.toLowerCase().includes(query);
      const matchesTick = event.tickNo.replace(/,/g, "").includes(query.replace(/,/g, ""));
      const matchesToken = event.token.toLowerCase().includes(query);
      if (!matchesFrom && !matchesTo && !matchesTick && !matchesToken) {
        return false;
      }
    }

    // Token filter
    if (tokenFilter !== "all-tokens") {
      const tokenUpper = tokenFilter.toUpperCase();
      if (tokenFilter === "other") {
        const knownTokens = ["QUBIC", "QMINE", "GARTH", "MATILDA", "CFB", "QXMR"];
        if (knownTokens.includes(event.token.toUpperCase())) {
          return false;
        }
      } else if (event.token.toUpperCase() !== tokenUpper) {
        return false;
      }
    }

    if (typeFilter !== "all-types") {
      if (typeFilter === "whale") {
        if (!detectWhaleInEvent(event)) {
          return false;
        }
      } else {
        const typeMap: Record<string, string> = {
          bid: "AddToBidOrder",
          ask: "AddToAskOrder",
          transfer: "TransferShareOwnershipAndPossession",
          issue: "IssueAsset",
        };
        if (event.type !== typeMap[typeFilter]) {
          return false;
        }
      }
    }

    if (timeFilter !== "all") {
      const time = event.time.toLowerCase();
      if (timeFilter === "1h" && !time.includes("min") && !time.includes("just")) {
        return false;
      } else if (timeFilter === "24h" && (time.includes("day") || time.includes("week"))) {
        return false;
      }
    }

    return true;
  });

  const liveEvents = filteredEvents.slice(0, 5);

  // Get unique tokens from events for top wallets calculation
  const topWallets = useMemo(() => {
    const walletVolumes = new Map<string, number>();
    events.forEach((event) => {
      const amount = parseAmount(event.amount);
      const current = walletVolumes.get(event.from) || 0;
      walletVolumes.set(event.from, current + amount);
    });
    
    return Array.from(walletVolumes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([address, volume]) => ({
        address,
        volume: volume >= 1000000 ? `${(volume / 1000000).toFixed(1)}M` : 
                volume >= 1000 ? `${(volume / 1000).toFixed(0)}K` : 
                volume.toLocaleString(),
      }));
  }, [events]);

  const kpiData = [
    {
      title: "Total Events (24h)",
      value: kpiStats?.totalEvents24h?.toLocaleString() || "0",
      trend: { value: 0, isPositive: true },
      icon: Activity,
    },
    {
      title: "Active Wallets (24h)",
      value: kpiStats?.activeWallets24h?.toLocaleString() || "0",
      trend: { value: 0, isPositive: true },
      icon: Wallet,
    },
    {
      title: "Whales Detected (24h)",
      value: kpiStats?.whalesDetected24h?.toLocaleString() || "0",
      trend: { value: 0, isPositive: false },
      icon: Fish,
    },
    {
      title: "Total Volume (24h)",
      value: kpiStats?.totalVolume24h ? 
        (kpiStats.totalVolume24h >= 1000000 ? 
          `${(kpiStats.totalVolume24h / 1000000).toFixed(1)}M` : 
          kpiStats.totalVolume24h.toLocaleString()) : "0",
      trend: { value: 0, isPositive: true },
      icon: Sparkles,
    },
  ];

  return (
    <DashboardLayout title="Overview">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {kpiData.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Events Feed - Takes 2 columns */}
        <Card className="lg:col-span-2 gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-xl">Live QX Events</CardTitle>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search address, token, or tick no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/50 border-border"
                  />
                </div>
              </div>
              <Select value={tokenFilter} onValueChange={setTokenFilter}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-tokens">All Tokens</SelectItem>
                  <SelectItem value="qubic">QUBIC</SelectItem>
                  <SelectItem value="qmine">QMINE</SelectItem>
                  <SelectItem value="garth">GARTH</SelectItem>
                  <SelectItem value="matilda">MATILDA</SelectItem>
                  <SelectItem value="cfb">CFB</SelectItem>
                  <SelectItem value="qxmr">QXMR</SelectItem>
                  <SelectItem value="other">Other tokens</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-types">All Types</SelectItem>
                  <SelectItem value="whale">🐋 Whale</SelectItem>
                  <SelectItem value="bid">Bid Order</SelectItem>
                  <SelectItem value="ask">Ask Order</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="issue">Issue Asset</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[120px] bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1h">Last 1h</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7d</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : liveEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No events yet. Waiting for data from n8n webhook...
              </div>
            ) : (
              <div className="space-y-3">
                {liveEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border hover:border-primary/30 transition-smooth cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Badge variant={getEventBadgeVariant(event.type)}>
                        {getEventTypeLabel(event.type)}
                      </Badge>
                      {detectWhaleInEvent(event) && (
                        <Badge
                          variant="outline"
                          className="text-xs border-amber-500/50 text-amber-500 bg-amber-500/10"
                        >
                          🐋 Whale
                        </Badge>
                      )}
                      <span className="font-mono text-sm text-muted-foreground">
                        {event.token}
                      </span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-foreground">
                          {shortenAddress(event.from)}
                        </span>
                        {event.type === "AddToBidOrder" ? (
                          <ArrowUpRight className="w-4 h-4 text-success" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-mono text-foreground">
                          {shortenAddress(event.to)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-semibold text-foreground">
                        {event.amount}
                      </span>
                      <span className="text-sm text-muted-foreground w-20 text-right">
                        {event.time}
                      </span>
                      <div className="flex flex-col items-end gap-1 min-w-[120px]">
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Tick no
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs border-primary/30 text-primary"
                        >
                          {event.tickNo}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Charts and Stats */}
        <div className="space-y-6">
          {/* Events Chart */}
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Events Over Time</CardTitle>
              <p className="text-sm text-muted-foreground">Last 24 hours</p>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-end justify-between gap-1">
                {[420, 580, 390, 720, 650, 810, 590, 920, 740, 680, 850, 760].map(
                  (height, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-primary to-primary/30 rounded-t"
                      style={{ height: `${(height / 1000) * 100}%` }}
                    />
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Wallets */}
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Top 5 Wallets</CardTitle>
              <p className="text-sm text-muted-foreground">By volume</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topWallets.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No wallet data yet
                  </div>
                ) : (
                  topWallets.map((wallet, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border"
                    >
                      <span className="font-mono text-sm text-foreground">
                        {shortenAddress(wallet.address)}
                      </span>
                      <span className="font-mono font-semibold text-primary">
                        {wallet.volume}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Whale Event */}
          {whaleEvent && (
            <Card
              onClick={() => handleEventClick(whaleEvent)}
              className="gradient-card border-border border-primary/20 glow-primary cursor-pointer hover:border-primary/40 transition-smooth"
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Fish className="w-5 h-5 text-primary" />
                  Most Recent Whale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Wallet</span>
                    <span className="font-mono text-sm text-foreground">
                      {shortenAddress(whaleEvent.from)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <Badge variant="default">{getEventTypeLabel(whaleEvent.type)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-mono font-semibold text-primary">
                      {whaleEvent.amount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Time</span>
                    <span className="text-sm text-foreground">{whaleEvent.time}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EventDetailDialog
        event={selectedEvent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </DashboardLayout>
  );
}