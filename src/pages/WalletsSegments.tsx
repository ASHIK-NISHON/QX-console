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
import { Search, Tag, X, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { shortenAddress } from "@/data/events";
import { EventDetailDialog } from "@/components/EventDetailDialog";
import { useWhaleDetection, parseAmount } from "@/hooks/useWhaleDetection";
import { useWallets, useWalletDetails, WalletWithStats } from "@/hooks/useWallets";
import { useEventsByWallet } from "@/hooks/useQxEvents";
import { DisplayEvent } from "@/types/qxEvent";

const MAX_LABELS = 5;

export default function WalletsSegments() {
  const [customLabels, setCustomLabels] = useState<Record<string, string[]>>({});
  const [selectedWallet, setSelectedWallet] = useState<WalletWithStats | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<DisplayEvent | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all-segments");
  const [tickSort, setTickSort] = useState<"highest" | "lowest">("highest");
  const { toast } = useToast();
  const { isWhale, whaleThresholds } = useWhaleDetection();

  const { data: wallets = [], isLoading: walletsLoading } = useWallets();
  const { data: walletDetails, isLoading: detailsLoading } = useWalletDetails(selectedWallet?.address || null);
  const { data: walletEvents = [] } = useEventsByWallet(selectedWallet?.address || null);

  // Set first wallet as selected when data loads
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0]);
    }
  }, [wallets, selectedWallet]);

  // Load custom labels from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("wallet_labels");
    if (stored) {
      setCustomLabels(JSON.parse(stored));
    }
  }, []);

  const getWalletLabels = (address: string): string[] => {
    return customLabels[address] || [];
  };

  // Check if wallet is a whale based on events
  const isWhaleWallet = (address: string): boolean => {
    return walletEvents.some((e) => {
      const amount = parseAmount(e.amount);
      return isWhale(e.token, amount);
    });
  };

  // Filter wallets
  const filteredWallets = useMemo(() => {
    let filtered = wallets.filter((wallet) => {
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesAddress = wallet.address.toLowerCase().includes(query);
        const matchesTick = wallet.latestTickNo.toString().includes(query.replace(/,/g, ""));
        const matchesLabel = getWalletLabels(wallet.address).some((l) => l.toLowerCase().includes(query));
        if (!matchesAddress && !matchesTick && !matchesLabel) {
          return false;
        }
      }

      if (segmentFilter !== "all-segments") {
        const labels = getWalletLabels(wallet.address);
        if (!labels.some((l) => l.toLowerCase() === segmentFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => 
      tickSort === "highest" ? b.latestTickNo - a.latestTickNo : a.latestTickNo - b.latestTickNo
    );
  }, [wallets, searchQuery, segmentFilter, tickSort, customLabels]);

  const handleSaveLabels = (address: string, labels: string[]) => {
    const updated = { ...customLabels, [address]: labels };
    setCustomLabels(updated);
    localStorage.setItem("wallet_labels", JSON.stringify(updated));
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && selectedWallet) {
      const currentLabels = getWalletLabels(selectedWallet.address);
      if (currentLabels.length >= MAX_LABELS) {
        toast({ title: "Label limit reached", variant: "destructive" });
        return;
      }
      if (!currentLabels.includes(newLabel.trim())) {
        handleSaveLabels(selectedWallet.address, [...currentLabels, newLabel.trim()]);
        toast({ title: "Label added" });
      }
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    if (selectedWallet) {
      const currentLabels = getWalletLabels(selectedWallet.address);
      handleSaveLabels(selectedWallet.address, currentLabels.filter((l) => l !== labelToRemove));
    }
  };

  const handleEventClick = (event: DisplayEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

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
                    placeholder="Search by address or tick no..."
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
            {walletsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredWallets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No wallets found. Waiting for data from n8n webhook...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>Label / Segment</TableHead>
                    <TableHead>Tick No</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWallets.map((wallet) => (
                    <TableRow
                      key={wallet.address}
                      className={`border-border hover:bg-background/30 transition-smooth cursor-pointer ${
                        selectedWallet?.address === wallet.address ? "bg-primary/10" : ""
                      }`}
                      onClick={() => setSelectedWallet(wallet)}
                    >
                      <TableCell className="font-mono font-semibold">
                        {shortenAddress(wallet.address)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {getWalletLabels(wallet.address).map((label, i) => (
                            <Badge key={i} variant="outline" className="border-primary/30 text-primary">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{wallet.latestTickNo.toLocaleString()}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Wallet Detail Panel */}
        <div className="space-y-6">
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Wallet Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedWallet ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <p className="font-mono font-semibold text-foreground text-xs break-all">
                      {selectedWallet.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Labels</p>
                    <div className="flex gap-1 flex-wrap">
                      {getWalletLabels(selectedWallet.address).map((label, i) => (
                        <Badge key={i} variant="outline" className="border-primary/30 text-primary">
                          {label}
                        </Badge>
                      ))}
                      {getWalletLabels(selectedWallet.address).length === 0 && (
                        <span className="text-muted-foreground text-sm">No labels</span>
                      )}
                    </div>
                  </div>
                  {detailsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : walletDetails ? (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Balance</p>
                        <p className="font-mono font-semibold text-foreground">
                          {parseInt(walletDetails.balance).toLocaleString()} QUBIC
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                        <p className="font-mono font-semibold text-foreground">
                          {selectedWallet.transactionCount}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                        <p className="font-mono font-semibold text-foreground">
                          {selectedWallet.transactionCount}
                        </p>
                      </div>
                    </div>
                  )}
                  <Button className="w-full mt-4" onClick={() => setIsEditDialogOpen(true)}>
                    <Tag className="w-4 h-4 mr-2" />
                    Add / Edit Labels
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">Select a wallet</p>
              )}
            </CardContent>
          </Card>

          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {walletEvents.slice(0, 4).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border hover:border-primary/30 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={event.type === "AddToBidOrder" ? "default" : "secondary"}>
                        {event.type.replace(/([A-Z])/g, ' $1').trim().split(' ').slice(0, 2).join(' ')}
                      </Badge>
                      <span className="font-mono font-semibold">{event.amount}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{event.time}</span>
                  </div>
                ))}
                {walletEvents.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">No events</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Labels Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-2">
              {selectedWallet && getWalletLabels(selectedWallet.address).map((label, i) => (
                <Badge key={i} variant="outline" className="border-primary/30 text-primary pr-1">
                  {label}
                  <button onClick={() => handleRemoveLabel(label)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add new label..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
              />
              <Button onClick={handleAddLabel}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EventDetailDialog event={selectedEvent} open={eventDialogOpen} onOpenChange={setEventDialogOpen} />
    </DashboardLayout>
  );
}