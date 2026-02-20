import { useMutation, useQuery } from "@tanstack/react-query";
import { Key, CheckCircle2, AlertCircle, Plug, Loader2, LogOut, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface FyersStatusData {
  connected: boolean;
  authenticated: boolean;
  userName?: string;
  userEmail?: string;
}

interface AuthButtonFyersProps {
  externalAppId?: string;
  externalSecretId?: string;
  onSuccess?: () => void;
}

export function AuthButtonFyers({ externalAppId, externalSecretId, onSuccess }: AuthButtonFyersProps) {
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: fyersStatus, isLoading: isStatusLoading } = useQuery<FyersStatusData>({
    queryKey: ["/api/fyers/status"],
    refetchInterval: 5000,
  });

  const [internalAppId, setAppId] = useState("");
  const [internalSecretId, setSecretId] = useState("");

  const effectiveAppId = externalAppId || internalAppId;
  const effectiveSecretId = externalSecretId || internalSecretId;

  const getAuthUrlMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/fyers/auth-url", { 
        appId: effectiveAppId, 
        secretId: effectiveSecretId 
      });
    },
    onSuccess: (data: any) => {
      if (data.url) {
        setIsRedirecting(true);
        toast({
          title: "Redirecting...",
          description: "Opening Fyers login page...",
        });
        if (onSuccess) onSuccess();
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      setIsRedirecting(false);
      toast({
        title: "Authorization Failed",
        description: error?.message || "Failed to get authorization URL",
        variant: "destructive",
      });
    },
  });

  const isConnected = fyersStatus?.connected && fyersStatus?.authenticated;
  const userName = fyersStatus?.userName || "User";

  if (isConnected) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-xl p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-blue-600 dark:text-blue-400 h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Fyers Connected
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Logged in as <span className="font-medium text-blue-600 dark:text-blue-400">{userName}</span>
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
            onClick={() => {
              apiRequest("POST", "/api/fyers/disconnect").then(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/fyers/status"] });
                toast({ title: "Disconnected", description: "Fyers account disconnected" });
              });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <img src="https://play-lh.googleusercontent.com/5Y1kVEbboWVeZ4T0l7cjP2nAUbz1_-ImIWKbbdXkJ0-JMpwV7svbG4uEakENWxPQFRWuQgu4tDtaENULAzZW=s48-rw" alt="Fyers" className="h-6 w-6 rounded-full" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Connect Fyers Broker</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Enter your credentials to link your account</p>
        </div>
      </div>

      <div className="space-y-4">
        {!externalAppId && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">App ID</label>
            <input
              type="text"
              placeholder="e.g. OXIDHUEC01-100"
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-800 px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white"
              value={internalAppId}
              onChange={(e) => setAppId(e.target.value)}
            />
          </div>
        )}
        {!externalSecretId && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Secret ID</label>
            <input
              type="password"
              placeholder="••••••••••••"
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-800 px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white"
              value={internalSecretId}
              onChange={(e) => setSecretId(e.target.value)}
            />
          </div>
        )}
        
        <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100/50 dark:border-blue-800/30 flex items-center justify-between group">
          <div className="flex flex-col">
            <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-bold uppercase tracking-wider">Redirect URL</span>
            <code className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate max-w-[200px]">https://perala.in/api/fyers/callback</code>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
            onClick={() => {
              navigator.clipboard.writeText("https://perala.in/api/fyers/callback");
              toast({
                title: "Copied",
                description: "Redirect URL copied to clipboard",
              });
            }}
          >
            <Copy className="h-4 w-4 text-blue-500" />
          </Button>
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
          <Button
            onClick={() => getAuthUrlMutation.mutate()}
            disabled={getAuthUrlMutation.isPending || isStatusLoading || isRedirecting || !effectiveAppId || !effectiveSecretId}
            className="flex-1 h-11 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-semibold transition-all shadow-lg shadow-emerald-500/20"
          >
            {getAuthUrlMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Connect Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
