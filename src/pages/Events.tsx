import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { events, shortenAddress, QubicEvent } from "@/data/events";
import { EventDetailDialog } from "@/components/EventDetailDialog";
import { useWhaleDetection } from "@/hooks/useWhaleDetection";

function getEventBadgeVariant(type: string) {
  switch (type) {
    case "Buy":
      return "default";
    case "Sell":
      return "destructive";
    case "Transfer":
      return "secondary";
    case "Contract Call":
      return "outline";
    default:
      return "secondary";
  }
}

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState<QubicEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenFilter, setTokenFilter] = useState("all-tokens");
  const [typeFilter, setTypeFilter] = useState("all-types");
  const [timeFilter, setTimeFilter] = useState("all");
  const { detectWhaleInEvent } = useWhaleDetection();

  const handleEventClick = (event: QubicEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  // Filter events based on search and filters
  const filteredEvents = events.filter((event) => {
    // Search filter (address, label, tick number)
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchesFrom = event.from.toLowerCase().includes(query);
      const matchesTo = event.to.toLowerCase().includes(query);
      const matchesLabel = event.label?.toLowerCase().includes(query);
      const matchesTick = event.tickNo.replace(/,/g, "").includes(query.replace(/,/g, ""));
      const matchesAmount = event.amount.toLowerCase().includes(query);
      // Also match "whale" search with dynamically detected whale events
      const isWhaleEvent = detectWhaleInEvent(event);
      const matchesWhale = query.includes("whale") && isWhaleEvent;
      if (!matchesFrom && !matchesTo && !matchesLabel && !matchesTick && !matchesAmount && !matchesWhale) {
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

    // Type filter
    if (typeFilter !== "all-types") {
      // Special handling for whale filter - check dynamically detected whales
      if (typeFilter === "whale") {
        if (!detectWhaleInEvent(event)) {
          return false;
        }
      } else {
        const typeMap: Record<string, string> = {
          buy: "Buy",
          sell: "Sell",
          transfer: "Transfer",
          contract: "Contract Call",
          airdrop: "Airdrop",
        };
        if (event.type !== typeMap[typeFilter]) {
          return false;
        }
      }
    }

    // Time filter (simplified)
    if (timeFilter !== "all") {
      const time = event.time.toLowerCase();
      if (timeFilter === "1h") {
        if (!time.includes("min") && !time.includes("1 hour")) {
          return false;
        }
      } else if (timeFilter === "24h") {
        if (time.includes("day") || time.includes("week")) {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <DashboardLayout title="Events">
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-xl">Qubic Events History</CardTitle>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search address, label, or tick no..."
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
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="airdrop">Airdrop</SelectItem>
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
                <SelectItem value="30d">Last 30d</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Type</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Tick no</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event, idx) => (
                <TableRow
                  key={idx}
                  className="border-border hover:bg-background/30 transition-smooth cursor-pointer"
                  onClick={() => handleEventClick(event)}
                >
                  <TableCell>
                    <Badge variant={getEventBadgeVariant(event.type)}>
                      {event.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {event.token}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {shortenAddress(event.from)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {event.type === "Buy" ? (
                        <ArrowUpRight className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-mono text-sm">{shortenAddress(event.to)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    {event.amount}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">{event.time}</span>
                      <span className="text-xs text-muted-foreground/60">
                        {event.timestamp}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {detectWhaleInEvent(event) ? (
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-500/50 text-amber-500 bg-amber-500/10"
                      >
                        🐋 Whale
                      </Badge>
                    ) : event.label ? (
                      <Badge
                        variant="outline"
                        className="text-xs border-primary/30 text-primary"
                      >
                        {event.label}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-foreground">
                      {event.tickNo}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EventDetailDialog
        event={selectedEvent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </DashboardLayout>
  );
}
