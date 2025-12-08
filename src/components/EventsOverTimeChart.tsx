import { useMemo, useState } from "react";
import { DisplayEvent } from "@/types/qxEvent";
import { parseAmount } from "@/hooks/useWhaleDetection";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EventsOverTimeChartProps {
  events: DisplayEvent[];
}

interface TimeSlot {
  hour: string;
  total: number;
  bidOrders: number;
  askOrders: number;
  transfers: number;
  issues: number;
  cancels: number;
  volume: number;
}

const ACTION_COLORS = {
  bidOrders: "from-emerald-500 to-emerald-400",
  askOrders: "from-rose-500 to-rose-400",
  transfers: "from-violet-500 to-violet-400",
  issues: "from-amber-500 to-amber-400",
  cancels: "from-slate-500 to-slate-400",
};

const ACTION_LABELS = {
  bidOrders: "Bid Orders",
  askOrders: "Ask Orders",
  transfers: "Transfers",
  issues: "Issue Assets",
  cancels: "Cancellations",
};

export function EventsOverTimeChart({ events }: EventsOverTimeChartProps) {
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [selectedView, setSelectedView] = useState<"activity" | "volume">("activity");

  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    const now = new Date();

    // Create 12 time slots for last 24 hours (2-hour intervals)
    for (let i = 11; i >= 0; i--) {
      const slotEnd = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
      const slotStart = new Date(slotEnd.getTime() - 2 * 60 * 60 * 1000);

      const slotEvents = events.filter((event) => {
        const eventTime = new Date(event.timestamp);
        return eventTime >= slotStart && eventTime < slotEnd;
      });

      const bidOrders = slotEvents.filter((e) => e.type === "AddToBidOrder").length;
      const askOrders = slotEvents.filter((e) => e.type === "AddToAskOrder").length;
      const transfers = slotEvents.filter((e) => e.type === "TransferShareOwnershipAndPossession").length;
      const issues = slotEvents.filter((e) => e.type === "IssueAsset").length;
      const cancels = slotEvents.filter(
        (e) => e.type === "RemoveFromAskOrder" || e.type === "RemoveFromBidOrder"
      ).length;

      const volume = slotEvents.reduce((acc, e) => acc + parseAmount(e.amount), 0);

      slots.push({
        hour: slotEnd.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        total: slotEvents.length,
        bidOrders,
        askOrders,
        transfers,
        issues,
        cancels,
        volume,
      });
    }

    return slots;
  }, [events]);

  const maxTotal = Math.max(...timeSlots.map((s) => s.total), 1);
  const maxVolume = Math.max(...timeSlots.map((s) => s.volume), 1);

  const totalActivity = timeSlots.reduce((acc, s) => acc + s.total, 0);
  const totalBids = timeSlots.reduce((acc, s) => acc + s.bidOrders, 0);
  const totalAsks = timeSlots.reduce((acc, s) => acc + s.askOrders, 0);

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView("activity")}
            className={`px-3 py-1.5 text-xs rounded-md transition-all duration-300 ${
              selectedView === "activity"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-background/50 text-muted-foreground hover:bg-background/80"
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => setSelectedView("volume")}
            className={`px-3 py-1.5 text-xs rounded-md transition-all duration-300 ${
              selectedView === "volume"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-background/50 text-muted-foreground hover:bg-background/80"
            }`}
          >
            Volume
          </button>
        </div>
        <div className="text-xs text-muted-foreground">
          {totalActivity} events
        </div>
      </div>

      {/* Chart */}
      <TooltipProvider delayDuration={0}>
        <div className="h-36 flex items-end justify-between gap-1.5 relative">
          {/* Pulse indicator for live data */}
          <div className="absolute -top-1 -right-1 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Live</span>
          </div>

          {timeSlots.map((slot, idx) => {
            const isHovered = hoveredSlot === idx;
            const heightPercent = selectedView === "activity" 
              ? (slot.total / maxTotal) * 100
              : (slot.volume / maxVolume) * 100;

            // Calculate stacked segments for activity view
            const bidHeight = slot.total > 0 ? (slot.bidOrders / slot.total) * heightPercent : 0;
            const askHeight = slot.total > 0 ? (slot.askOrders / slot.total) * heightPercent : 0;
            const transferHeight = slot.total > 0 ? (slot.transfers / slot.total) * heightPercent : 0;
            const issueHeight = slot.total > 0 ? (slot.issues / slot.total) * heightPercent : 0;
            const cancelHeight = slot.total > 0 ? (slot.cancels / slot.total) * heightPercent : 0;

            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div
                    className="flex-1 flex flex-col justify-end cursor-pointer group relative"
                    style={{ height: "100%" }}
                    onMouseEnter={() => setHoveredSlot(idx)}
                    onMouseLeave={() => setHoveredSlot(null)}
                  >
                    {selectedView === "activity" ? (
                      // Stacked bar for activity
                      <div
                        className={`w-full rounded-t overflow-hidden transition-all duration-500 ease-out ${
                          isHovered ? "scale-x-110 shadow-lg" : ""
                        }`}
                        style={{
                          height: `${heightPercent}%`,
                          minHeight: slot.total > 0 ? "4px" : "0",
                          transitionProperty: "height, transform, box-shadow",
                        }}
                      >
                        {/* Stacked segments */}
                        <div className="w-full h-full flex flex-col-reverse">
                          {bidHeight > 0 && (
                            <div
                              className={`w-full bg-gradient-to-t ${ACTION_COLORS.bidOrders} transition-all duration-300`}
                              style={{ height: `${(bidHeight / heightPercent) * 100}%` }}
                            />
                          )}
                          {askHeight > 0 && (
                            <div
                              className={`w-full bg-gradient-to-t ${ACTION_COLORS.askOrders} transition-all duration-300`}
                              style={{ height: `${(askHeight / heightPercent) * 100}%` }}
                            />
                          )}
                          {transferHeight > 0 && (
                            <div
                              className={`w-full bg-gradient-to-t ${ACTION_COLORS.transfers} transition-all duration-300`}
                              style={{ height: `${(transferHeight / heightPercent) * 100}%` }}
                            />
                          )}
                          {issueHeight > 0 && (
                            <div
                              className={`w-full bg-gradient-to-t ${ACTION_COLORS.issues} transition-all duration-300`}
                              style={{ height: `${(issueHeight / heightPercent) * 100}%` }}
                            />
                          )}
                          {cancelHeight > 0 && (
                            <div
                              className={`w-full bg-gradient-to-t ${ACTION_COLORS.cancels} transition-all duration-300`}
                              style={{ height: `${(cancelHeight / heightPercent) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      // Single bar for volume
                      <div
                        className={`w-full bg-gradient-to-t from-primary via-primary/80 to-primary/40 rounded-t transition-all duration-500 ease-out ${
                          isHovered ? "scale-x-110 shadow-lg shadow-primary/20" : ""
                        }`}
                        style={{
                          height: `${heightPercent}%`,
                          minHeight: slot.volume > 0 ? "4px" : "0",
                          transitionProperty: "height, transform, box-shadow",
                        }}
                      />
                    )}

                    {/* Glow effect on hover */}
                    {isHovered && (
                      <div
                        className="absolute inset-0 bg-primary/10 rounded-t animate-pulse pointer-events-none"
                        style={{ height: `${heightPercent}%`, bottom: 0, top: "auto" }}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-card border-border p-3 shadow-xl"
                >
                  <div className="space-y-2">
                    <div className="font-semibold text-foreground border-b border-border pb-1 mb-2">
                      {slot.hour}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"></span>
                        <span className="text-muted-foreground">Bids:</span>
                        <span className="font-medium text-foreground">{slot.bidOrders}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-400"></span>
                        <span className="text-muted-foreground">Asks:</span>
                        <span className="font-medium text-foreground">{slot.askOrders}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-violet-400"></span>
                        <span className="text-muted-foreground">Transfers:</span>
                        <span className="font-medium text-foreground">{slot.transfers}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400"></span>
                        <span className="text-muted-foreground">Issues:</span>
                        <span className="font-medium text-foreground">{slot.issues}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-slate-500 to-slate-400"></span>
                        <span className="text-muted-foreground">Cancels:</span>
                        <span className="font-medium text-foreground">{slot.cancels}</span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold text-foreground">{slot.total} events</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Volume:</span>
                        <span className="font-semibold text-primary">
                          {slot.volume >= 1000000
                            ? `${(slot.volume / 1000000).toFixed(2)}M`
                            : slot.volume >= 1000
                            ? `${(slot.volume / 1000).toFixed(1)}K`
                            : slot.volume.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Time labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>{timeSlots[0]?.hour || ""}</span>
        <span>{timeSlots[5]?.hour || ""}</span>
        <span>{timeSlots[11]?.hour || ""}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center pt-2 border-t border-border/50">
        {Object.entries(ACTION_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-[10px]">
            <span
              className={`w-2.5 h-2.5 rounded-sm bg-gradient-to-r ${
                ACTION_COLORS[key as keyof typeof ACTION_COLORS]
              }`}
            ></span>
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="bg-background/30 rounded-lg p-2 text-center border border-border/30">
          <div className="text-lg font-bold text-emerald-500 animate-fade-in">{totalBids}</div>
          <div className="text-[10px] text-muted-foreground">Bid Orders</div>
        </div>
        <div className="bg-background/30 rounded-lg p-2 text-center border border-border/30">
          <div className="text-lg font-bold text-rose-500 animate-fade-in">{totalAsks}</div>
          <div className="text-[10px] text-muted-foreground">Ask Orders</div>
        </div>
        <div className="bg-background/30 rounded-lg p-2 text-center border border-border/30">
          <div className="text-lg font-bold text-primary animate-fade-in">{totalActivity}</div>
          <div className="text-[10px] text-muted-foreground">Total</div>
        </div>
      </div>
    </div>
  );
}
