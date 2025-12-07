import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface TelegramCredentials {
  telegramToken: string;
  telegramChatId: string;
  channelName?: string;
}

export interface DiscordCredentials {
  discordWebhookUrl: string;
  channelName?: string;
}

export interface XCredentials {
  xApiKey: string;
  xApiSecret: string;
  xAccessToken: string;
  xAccessSecret: string;
  channelName?: string;
}

export interface IntegrationStatus {
  telegram: boolean;
  discord: boolean;
  x: boolean;
}

export interface RecentNotification {
  id: string;
  type: "alert" | "airdrop";
  title: string;
  message: string;
  channels: string[];
  timestamp: string;
  success: boolean;
}

interface IntegrationsContextType {
  telegramCredentials: TelegramCredentials | null;
  discordCredentials: DiscordCredentials | null;
  xCredentials: XCredentials | null;
  n8nWebhookUrl: string;
  integrationStatus: IntegrationStatus;
  recentAlerts: RecentNotification[];
  recentAirdrops: RecentNotification[];
  setTelegramCredentials: (creds: TelegramCredentials | null) => void;
  setDiscordCredentials: (creds: DiscordCredentials | null) => void;
  setXCredentials: (creds: XCredentials | null) => void;
  setN8nWebhookUrl: (url: string) => void;
  testTelegramConnection: (creds: TelegramCredentials) => Promise<boolean>;
  testDiscordConnection: (creds: DiscordCredentials) => Promise<boolean>;
  testXConnection: (creds: XCredentials) => Promise<boolean>;
  sendNotification: (
    type: "alert" | "airdrop",
    title: string,
    message: string,
    channels: ("telegram" | "discord" | "x")[]
  ) => Promise<boolean>;
  sendTestNotification: (
    title: string,
    message: string,
    channels: ("telegram" | "discord" | "x")[]
  ) => Promise<boolean>;
  addRecentNotification: (notification: RecentNotification) => void;
  removeRecentNotification: (type: "alert" | "airdrop", id: string) => void;
}

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

export function IntegrationsProvider({ children }: { children: ReactNode }) {
  const [telegramCredentials, setTelegramCredentialsState] = useState<TelegramCredentials | null>(() => {
    const stored = localStorage.getItem("telegramCredentials");
    return stored ? JSON.parse(stored) : null;
  });

  const [discordCredentials, setDiscordCredentialsState] = useState<DiscordCredentials | null>(() => {
    const stored = localStorage.getItem("discordCredentials");
    return stored ? JSON.parse(stored) : null;
  });

  const [xCredentials, setXCredentialsState] = useState<XCredentials | null>(() => {
    const stored = localStorage.getItem("xCredentials");
    return stored ? JSON.parse(stored) : null;
  });

  const [n8nWebhookUrl, setN8nWebhookUrlState] = useState<string>(() => {
    return localStorage.getItem("n8nWebhookUrl") || "";
  });

  const [recentAlerts, setRecentAlerts] = useState<RecentNotification[]>(() => {
    const stored = localStorage.getItem("recentAlerts");
    return stored ? JSON.parse(stored) : [];
  });

  const [recentAirdrops, setRecentAirdrops] = useState<RecentNotification[]>(() => {
    const stored = localStorage.getItem("recentAirdrops");
    return stored ? JSON.parse(stored) : [];
  });

  const integrationStatus: IntegrationStatus = {
    telegram: !!telegramCredentials?.telegramToken && !!telegramCredentials?.telegramChatId,
    discord: !!discordCredentials?.discordWebhookUrl,
    x: !!xCredentials?.xApiKey && !!xCredentials?.xApiSecret && !!xCredentials?.xAccessToken && !!xCredentials?.xAccessSecret,
  };

  const setTelegramCredentials = (creds: TelegramCredentials | null) => {
    setTelegramCredentialsState(creds);
    if (creds) {
      localStorage.setItem("telegramCredentials", JSON.stringify(creds));
    } else {
      localStorage.removeItem("telegramCredentials");
    }
  };

  const setDiscordCredentials = (creds: DiscordCredentials | null) => {
    setDiscordCredentialsState(creds);
    if (creds) {
      localStorage.setItem("discordCredentials", JSON.stringify(creds));
    } else {
      localStorage.removeItem("discordCredentials");
    }
  };

  const setXCredentials = (creds: XCredentials | null) => {
    setXCredentialsState(creds);
    if (creds) {
      localStorage.setItem("xCredentials", JSON.stringify(creds));
    } else {
      localStorage.removeItem("xCredentials");
    }
  };

  const setN8nWebhookUrl = (url: string) => {
    setN8nWebhookUrlState(url);
    localStorage.setItem("n8nWebhookUrl", url);
  };

  const addRecentNotification = (notification: RecentNotification) => {
    if (notification.type === "alert") {
      const updated = [notification, ...recentAlerts].slice(0, 20);
      setRecentAlerts(updated);
      localStorage.setItem("recentAlerts", JSON.stringify(updated));
    } else {
      const updated = [notification, ...recentAirdrops].slice(0, 20);
      setRecentAirdrops(updated);
      localStorage.setItem("recentAirdrops", JSON.stringify(updated));
    }
  };

  const removeRecentNotification = (type: "alert" | "airdrop", id: string) => {
    if (type === "alert") {
      const updated = recentAlerts.filter((alert) => alert.id !== id);
      setRecentAlerts(updated);
      localStorage.setItem("recentAlerts", JSON.stringify(updated));
    } else {
      const updated = recentAirdrops.filter((airdrop) => airdrop.id !== id);
      setRecentAirdrops(updated);
      localStorage.setItem("recentAirdrops", JSON.stringify(updated));
    }
  };

  // Test Discord by sending a test message directly to webhook
  const testDiscordConnection = async (creds: DiscordCredentials): Promise<boolean> => {
    try {
      const response = await fetch(creds.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "🔔 **QX Dashboard Test** - Connection successful!",
          username: "QX Dashboard",
        }),
      });
      return response.ok;
    } catch (error) {
      console.error("Discord test failed:", error);
      return false;
    }
  };

  // Test Telegram by sending a message directly via Telegram API
  const testTelegramConnection = async (creds: TelegramCredentials): Promise<boolean> => {
    try {
      const message = encodeURIComponent("🔔 QX Dashboard Test - Connection successful!");
      const url = `https://api.telegram.org/bot${creds.telegramToken}/sendMessage?chat_id=${creds.telegramChatId}&text=${message}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return data.ok === true;
    } catch (error) {
      console.error("Telegram test failed:", error);
      return false;
    }
  };

  const testXConnection = async (creds: XCredentials): Promise<boolean> => {
    if (!n8nWebhookUrl) {
      toast({
        title: "Configuration Required",
        description: "Please set your n8n webhook URL in Settings first.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          source: "x",
          title: "Test Connection",
          credentials: {
            xApiKey: creds.xApiKey,
            xApiSecret: creds.xApiSecret,
            xAccessToken: creds.xAccessToken,
            xAccessSecret: creds.xAccessSecret,
          },
          message: "🔔 QX Dashboard Test - Connection successful!",
        }),
      });
      return true;
    } catch (error) {
      console.error("X test failed:", error);
      return false;
    }
  };

  // Send test notification directly to platforms (without n8n)
  const sendTestNotification = async (
    title: string,
    message: string,
    channels: ("telegram" | "discord" | "x")[]
  ): Promise<boolean> => {
    if (channels.length === 0) {
      toast({
        title: "No Channels Selected",
        description: "Please select at least one notification channel.",
        variant: "destructive",
      });
      return false;
    }

    const results: boolean[] = [];

    // Send to Discord directly
    if (channels.includes("discord") && discordCredentials) {
      try {
        const response = await fetch(discordCredentials.discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `🧪 **${title}**\n\n${message}`,
            username: "QX Dashboard",
          }),
        });
        results.push(response.ok);
      } catch (error) {
        console.error("Discord test notification failed:", error);
        results.push(false);
      }
    }

    // Send to Telegram directly
    if (channels.includes("telegram") && telegramCredentials) {
      try {
        const encodedMessage = encodeURIComponent(`🧪 ${title}\n\n${message}`);
        const url = `https://api.telegram.org/bot${telegramCredentials.telegramToken}/sendMessage?chat_id=${telegramCredentials.telegramChatId}&text=${encodedMessage}`;
        
        const response = await fetch(url);
        const data = await response.json();
        results.push(data.ok === true);
      } catch (error) {
        console.error("Telegram test notification failed:", error);
        results.push(false);
      }
    }

    // X requires n8n, so skip it for direct testing
    if (channels.includes("x")) {
      toast({
        title: "X (Twitter) Not Supported",
        description: "X notifications require n8n webhook. Use regular send for X.",
        variant: "default",
      });
    }

    const success = results.length > 0 && results.every(r => r === true);
    return success;
  };

  const sendNotification = async (
    type: "alert" | "airdrop",
    title: string,
    message: string,
    channels: ("telegram" | "discord" | "x")[]
  ): Promise<boolean> => {
    if (!n8nWebhookUrl) {
      toast({
        title: "Configuration Required",
        description: "Please set your n8n webhook URL in Settings first.",
        variant: "destructive",
      });
      return false;
    }

    const payloads: any[] = [];

    channels.forEach((channel) => {
      if (channel === "telegram" && telegramCredentials) {
        payloads.push({
          source: "telegram",
          title,
          credentials: {
            telegramToken: telegramCredentials.telegramToken,
            telegramChatId: telegramCredentials.telegramChatId,
          },
          message,
        });
      }
      if (channel === "discord" && discordCredentials) {
        payloads.push({
          source: "discord",
          title,
          credentials: {
            discordWebhookUrl: discordCredentials.discordWebhookUrl,
          },
          message,
        });
      }
      if (channel === "x" && xCredentials) {
        payloads.push({
          source: "x",
          title,
          credentials: {
            xApiKey: xCredentials.xApiKey,
            xApiSecret: xCredentials.xApiSecret,
            xAccessToken: xCredentials.xAccessToken,
            xAccessSecret: xCredentials.xAccessSecret,
          },
          message,
        });
      }
    });

    if (payloads.length === 0) {
      toast({
        title: "No Channels Selected",
        description: "Please select at least one connected channel.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const body = payloads.length === 1 ? payloads[0] : payloads;
      
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let success = response.ok;
      if (response.ok) {
        try {
          const responseData = await response.json();
          if (responseData.success !== undefined) {
            success = responseData.success === true;
          }
        } catch (e) {
          // If response is not JSON, use HTTP status
          success = response.ok;
        }
      }

      // Add to recent notifications
      const notification: RecentNotification = {
        id: crypto.randomUUID(),
        type,
        title,
        message,
        channels: channels.map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
        timestamp: new Date().toISOString(),
        success: success,
      };
      addRecentNotification(notification);

      return success;
    } catch (error) {
      console.error("Send notification failed:", error);
      return false;
    }
  };

  return (
    <IntegrationsContext.Provider
      value={{
        telegramCredentials,
        discordCredentials,
        xCredentials,
        n8nWebhookUrl,
        integrationStatus,
        recentAlerts,
        recentAirdrops,
        setTelegramCredentials,
        setDiscordCredentials,
        setXCredentials,
        setN8nWebhookUrl,
        testTelegramConnection,
        testDiscordConnection,
        testXConnection,
        sendNotification,
        sendTestNotification,
        addRecentNotification,
        removeRecentNotification,
      }}
    >
      {children}
    </IntegrationsContext.Provider>
  );
}

export function useIntegrations() {
  const context = useContext(IntegrationsContext);
  if (context === undefined) {
    throw new Error("useIntegrations must be used within an IntegrationsProvider");
  }
  return context;
}
