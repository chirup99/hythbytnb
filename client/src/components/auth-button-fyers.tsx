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
      <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="text-orange-600 dark:text-orange-400 h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-orange-900 dark:text-orange-200">
                Fyers Connected
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300 truncate">
                User: <span className="font-semibold">{userName}</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-orange-600 text-orange-600"
            onClick={() => {
              apiRequest("POST", "/api/fyers/disconnect").then(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/fyers/status"] });
                toast({ title: "Disconnected", description: "Fyers account disconnected" });
              });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-orange-100 dark:border-orange-900 pb-2">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <Plug className="text-orange-600 dark:text-orange-400 h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-orange-900 dark:text-orange-200">
                Fyers Disconnected
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Connect your Fyers account
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid gap-3">
          {!externalAppId && (
            <div className="grid gap-1.5">
              <label className="text-[10px] font-medium text-slate-500 uppercase">App ID</label>
              <input
                type="text"
                placeholder="Enter Fyers App ID"
                className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                value={internalAppId}
                onChange={(e) => setAppId(e.target.value)}
              />
            </div>
          )}
          {!externalSecretId && (
            <div className="grid gap-1.5">
              <label className="text-[10px] font-medium text-slate-500 uppercase">Secret ID</label>
              <input
                type="password"
                placeholder="Enter Fyers Secret ID"
                className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                value={internalSecretId}
                onChange={(e) => setSecretId(e.target.value)}
              />
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 w-fit group hover:border-blue-200 dark:hover:border-blue-900/40 transition-colors">
            <span className="text-[10px] text-slate-500 font-medium">Redirect URL:</span>
            <code className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">https://perala.in/api/fyers/callback</code>
            <Button
              size="icon"
              variant="ghost"
              className="h-4 w-4 hover:bg-slate-200 dark:hover:bg-slate-800 ml-0.5"
              onClick={() => {
                navigator.clipboard.writeText("https://perala.in/api/fyers/callback");
                toast({
                  title: "Copied",
                  description: "Redirect URL copied to clipboard",
                });
              }}
            >
              <Copy className="h-2.5 w-2.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </Button>
          </div>

          <Button
            onClick={() => getAuthUrlMutation.mutate()}
            disabled={getAuthUrlMutation.isPending || isStatusLoading || isRedirecting || !effectiveAppId || !effectiveSecretId}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white w-full"
          >
            {getAuthUrlMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
            Connect Account
          </Button>
        </div>
      </div>
    </div>
  );
}
