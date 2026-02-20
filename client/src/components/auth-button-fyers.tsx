import { useMutation, useQuery } from "@tanstack/react-query";
import { Key, CheckCircle2, AlertCircle, Plug, Loader2, LogOut } from "lucide-react";
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

export function AuthButtonFyers() {
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: fyersStatus, isLoading: isStatusLoading } = useQuery<FyersStatusData>({
    queryKey: ["/api/fyers/status"],
    refetchInterval: 5000,
  });

  const getAuthUrlMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("GET", "/api/fyers/auth-url");
    },
    onSuccess: (data: any) => {
      if (data.url) {
        setIsRedirecting(true);
        toast({
          title: "Redirecting...",
          description: "Opening Fyers login page...",
        });
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
            disabled
          >
            Connected
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
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
        <Button
          onClick={() => getAuthUrlMutation.mutate()}
          disabled={getAuthUrlMutation.isPending || isStatusLoading || isRedirecting}
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0"
        >
          {getAuthUrlMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
          Connect
        </Button>
      </div>
    </div>
  );
}
