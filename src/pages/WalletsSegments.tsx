import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, Tag, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MAX_LABELS = 5;
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { events, shortenAddress, QubicEvent } from "@/data/events";
import { EventDetailDialog } from "@/components/EventDetailDialog";
import { useWhaleDetection } from "@/hooks/useWhaleDetection";

interface Wallet {
  address: string;
  labels: string[];
  volume: string;
  events: number;
  lastActivity: string;
  tickNo: string;
}

const wallets: Wallet[] = [
  {
    address: "BZBQFLLBNCXEMGLOBHUVFTLUPLVCPQUASSILFABOFFBCADQSSUPNWLZBQFFK9D2",
    labels: ["Influencer"],
    volume: "1.2M QUBIC",
    events: 342,
    lastActivity: "2 min ago",
    tickNo: "38,460,334",
  },
  {
    address: "QXSEVENALPHAPROMISEDMOONWALLETADDRESSFULLQUBICK7AP1M4",
    labels: ["Partner"],
    volume: "890K QUBIC",
    events: 198,
    lastActivity: "15 min ago",
    tickNo: "38,460,120",
  },
  {
    address: "QA2CFULLADDRESSFORQUBICBLOCKCHAINWALLETIDENTIFIERF8E1",
    labels: ["Community", "New"],
    volume: "765K QUBIC",
    events: 87,
    lastActivity: "1 hour ago",
    tickNo: "38,459,987",
  },
  {
    address: "QM5TFULLSENDERWALLETADDRESSFORQUBICSELLORDERTXR4C9",
    labels: ["Active"],
    volume: "623K QUBIC",
    events: 256,
    lastActivity: "3 hours ago",
    tickNo: "38,459,650",
  },
  {
    address: "QR8NFULLWHALEWALLETADDRESSLARGETRANSACTIONQUBID2S5",
    labels: ["Partner"],
    volume: "541K QUBIC",
    events: 412,
    lastActivity: "5 hours ago",
    tickNo: "38,459,301",
  },
];

// Get recent events for a wallet (simulated)
const getWalletEvents = (walletAddress: string): QubicEvent[] => {
  return events.filter(e => e.from === walletAddress || e.to === walletAddress).slice(0, 4);
};

export default function WalletsSegments() {
  const [customLabels, setCustomLabels] = useState<Record<string, string[]>>({});
  const [selectedWallet, setSelectedWallet] = useState<Wallet>(wallets[0]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<QubicEvent | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all-segments");
  const [tickSort, setTickSort] = useState<"highest" | "lowest">("highest");
  const { toast } = useToast();
  const { getWhaleWallets, whaleThresholds } = useWhaleDetection();

  // Get whale wallets based on current threshold settings
  const whaleWalletAddresses = useMemo(() => getWhaleWallets(events), [getWhaleWallets, whaleThresholds]);

  // Load custom labels from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("wallet_labels");
    if (stored) {
      setCustomLabels(JSON.parse(stored));
    }
  }, []);

  // Get labels for a wallet (custom or default)
  const getWalletLabels = (address: string, defaultLabels: string[]): string[] => {
    return customLabels[address] || defaultLabels;
  };

  // Merge wallet data with custom labels (show ALL labels)
  const walletsWithLabels = wallets.map((wallet) => ({
    ...wallet,
    labels: getWalletLabels(wallet.address, wallet.labels),
  }));

  // Filter wallets based on search and filters
  const filteredWallets = useMemo(() => {
    const filtered = walletsWithLabels.filter((wallet) => {
      // Search filter (address, label, tick number)
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesAddress = wallet.address.toLowerCase().includes(query);
        const matchesLabel = wallet.labels.some((label) =>
          label.toLowerCase().includes(query)
        );
        const matchesTick = wallet.tickNo.replace(/,/g, "").includes(query.replace(/,/g, ""));
        // Also match "whale" search with dynamically detected whale wallets
        const isWhaleWallet = whaleWalletAddresses.has(wallet.address);
        const matchesWhale = query.includes("whale") && isWhaleWallet;
        if (!matchesAddress && !matchesLabel && !matchesTick && !matchesWhale) {
          return false;
        }
      }

      // Segment filter
      if (segmentFilter !== "all-segments") {
        // Special handling for whale segment - check both labels AND dynamically detected whales
        if (segmentFilter.toLowerCase() === "whale") {
          const hasWhaleLabel = wallet.labels.some(
            (label) => label.toLowerCase() === "whale"
          );
          const isWhaleWallet = whaleWalletAddresses.has(wallet.address);
          if (!hasWhaleLabel && !isWhaleWallet) {
            return false;
          }
        } else {
          const hasSegment = wallet.labels.some(
            (label) => label.toLowerCase() === segmentFilter.toLowerCase()
          );
          if (!hasSegment) {
            return false;
          }
        }
      }

      return true;
    });

    // Sort by tick number
    return filtered.sort((a, b) => {
      const tickA = parseInt(a.tickNo.replace(/,/g, ""));
      const tickB = parseInt(b.tickNo.replace(/,/g, ""));
      return tickSort === "highest" ? tickB - tickA : tickA - tickB;
    });
  }, [walletsWithLabels, searchQuery, segmentFilter, tickSort, whaleWalletAddresses]);

  // Update selected wallet when labels change
  useEffect(() => {
    const updated = walletsWithLabels.find(
      (w) => w.address === selectedWallet.address
    );
    if (updated) {
      setSelectedWallet(updated);
    }
  }, [customLabels]);

  const handleSaveLabels = (address: string, labels: string[]) => {
    const updated = { ...customLabels, [address]: labels };
    setCustomLabels(updated);
    localStorage.setItem("wallet_labels", JSON.stringify(updated));
  };

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      const currentLabels = getWalletLabels(selectedWallet.address, wallets.find(w => w.address === selectedWallet.address)?.labels || []);
      
      // Check label limit
      if (currentLabels.length >= MAX_LABELS) {
        toast({
          title: "Label limit reached",
          description: `Maximum ${MAX_LABELS} labels allowed per wallet.`,
          variant: "destructive",
        });
        return;
      }
      
      if (!currentLabels.includes(newLabel.trim())) {
        handleSaveLabels(selectedWallet.address, [...currentLabels, newLabel.trim()]);
        toast({
          title: "Label added",
          description: `"${newLabel.trim()}" has been added to the wallet.`,
        });
      } else {
        toast({
          title: "Label exists",
          description: "This label already exists for this wallet.",
          variant: "destructive",
        });
      }
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    const originalLabels = wallets.find(w => w.address === selectedWallet.address)?.labels || [];
    const currentLabels = getWalletLabels(selectedWallet.address, originalLabels);
    handleSaveLabels(
      selectedWallet.address,
      currentLabels.filter((l) => l !== labelToRemove)
    );
    toast({
      title: "Label removed",
      description: `"${labelToRemove}" has been removed from the wallet.`,
    });
  };

  const handleEventClick = (event: QubicEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const walletEvents = getWalletEvents(selectedWallet.address);
  // If no matching events, show some default events
  const displayEvents = walletEvents.length > 0 ? walletEvents : events.slice(0, 4);

  return (
    <DashboardLayout title="Wallets & Segments">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallets Table */}
        <Card className="lg:col-span-2 gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-xl">Wallet List</CardTitle>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by address, label, or tick no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/50 border-border"
                  />
                </div>
              </div>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-segments">All Segments</SelectItem>
                  <SelectItem value="whale">Whale</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tickSort} onValueChange={(v) => setTickSort(v as "highest" | "lowest")}>
                <SelectTrigger className="w-[160px] bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highest">Tick: Highest First</SelectItem>
                  <SelectItem value="lowest">Tick: Lowest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Label / Segment</TableHead>
                  <TableHead>Tick No</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWallets.map((wallet, idx) => (
                  <TableRow
                    key={idx}
                    className={`border-border hover:bg-background/30 transition-smooth cursor-pointer ${
                      selectedWallet.address === wallet.address
                        ? "bg-primary/10"
                        : ""
                    }`}
                    onClick={() => setSelectedWallet(wallet)}
                  >
                    <TableCell className="font-mono font-semibold">
                      {shortenAddress(wallet.address)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {whaleWalletAddresses.has(wallet.address) && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/50 text-amber-500 bg-amber-500/10"
                          >
                            🐋 Whale
                          </Badge>
                        )}
                        {wallet.labels.filter(l => l.toLowerCase() !== 'whale').map((label, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="border-primary/30 text-primary"
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-foreground">
                        {wallet.tickNo}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Wallet Detail Panel */}
        <div className="space-y-6">
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Wallet Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <p className="font-mono font-semibold text-foreground text-xs break-all">
                  {selectedWallet.address}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Labels</p>
                <div className="flex gap-1 flex-wrap">
                  {selectedWallet.labels.map((label, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-primary/30 text-primary"
                    >
                      {label}
                    </Badge>
                  ))}
                  {selectedWallet.labels.length === 0 && (
                    <span className="text-muted-foreground text-sm">No labels</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Volume
                  </p>
                  <p className="font-mono font-semibold text-foreground">
                    {selectedWallet.volume}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Events</p>
                  <p className="font-mono font-semibold text-foreground">
                    {selectedWallet.events}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Last Activity
                </p>
                <p className="text-foreground">{selectedWallet.lastActivity}</p>
              </div>
              <Button
                className="w-full mt-4 bg-primary hover:bg-primary/90"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Tag className="w-4 h-4 mr-2" />
                Add / Edit Labels
              </Button>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayEvents.map((event, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleEventClick(event)}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border hover:border-primary/30 cursor-pointer transition-smooth"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          event.type === "Buy"
                            ? "default"
                            : event.type === "Sell"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {event.type}
                      </Badge>
                      <span className="font-mono font-semibold">
                        {event.amount}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {event.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Labels Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Labels for {shortenAddress(selectedWallet.address)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Labels</p>
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {getWalletLabels(selectedWallet.address, wallets.find(w => w.address === selectedWallet.address)?.labels || []).map(
                  (label, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-primary/30 text-primary pr-1"
                    >
                      {label}
                      <button
                        onClick={() => handleRemoveLabel(label)}
                        className="ml-1 hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                )}
                {getWalletLabels(selectedWallet.address, wallets.find(w => w.address === selectedWallet.address)?.labels || []).length === 0 && (
                  <span className="text-muted-foreground text-sm">No labels yet</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Add New Label</p>
              {(() => {
                const currentLabels = getWalletLabels(selectedWallet.address, wallets.find(w => w.address === selectedWallet.address)?.labels || []);
                const remainingLabels = MAX_LABELS - currentLabels.length;
                const isLimitReached = remainingLabels <= 0;
                
                return (
                  <>
                    <Alert variant={isLimitReached ? "destructive" : "default"} className="mb-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {isLimitReached 
                          ? `Maximum ${MAX_LABELS} labels reached. Remove a label to add a new one.`
                          : `You can add ${remainingLabels} more label${remainingLabels !== 1 ? 's' : ''} (max ${MAX_LABELS}).`
                        }
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter label name..."
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !isLimitReached && handleAddLabel()}
                        className="bg-background/50 border-border"
                        disabled={isLimitReached}
                      />
                      <Button 
                        onClick={handleAddLabel} 
                        className="bg-primary hover:bg-primary/90"
                        disabled={isLimitReached}
                      >
                        Add
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <EventDetailDialog
        event={selectedEvent}
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
      />
    </DashboardLayout>
  );
}
