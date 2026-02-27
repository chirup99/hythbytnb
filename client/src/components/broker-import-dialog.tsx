import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type BrokerId,
  type BrokerCredentials,
  type BrokerTradesResponse,
  brokerIds,
  kiteCredentialSchema,
  dhanCredentialSchema,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, AlertCircle, Briefcase } from "lucide-react";

interface BrokerImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (trades: BrokerTradesResponse["trades"]) => void;
}

export function BrokerImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: BrokerImportDialogProps) {
  const [selectedBroker, setSelectedBroker] = useState<BrokerId | "">("");
  const [importSuccess, setImportSuccess] = useState(false);

  const brokerLabels: Record<BrokerId, string> = {
    kite: "Kite (Zerodha)",
    dhan: "Dhan",
    groww: "Groww",
  };

  const brokerDescriptions: Record<BrokerId, string> = {
    kite:
      "Login to Kite Connect and generate a request token from your developer dashboard.",
    dhan: "Get your access token from the Dhan trading platform settings.",
    groww: "Enter your Groww API Key and Secret from the Groww Cloud API Keys page.",
  };

  const growwForm = useForm<z.infer<typeof growwCredentialSchema>>({
    resolver: zodResolver(growwCredentialSchema),
    defaultValues: {
      broker: "groww",
      apiKey: "",
      apiSecret: "",
    },
  });

  const getCurrentForm = () => {
    if (selectedBroker === "kite") return kiteForm;
    if (selectedBroker === "dhan") return dhanForm;
    if (selectedBroker === "groww") return growwForm;
    return null;
  };

  const importMutation = useMutation({
    mutationFn: async (credentials: BrokerCredentials) => {
      const response = await apiRequest({
        url: "/api/brokers/import",
        method: "POST",
        body: {
          broker: selectedBroker,
          credentials,
        },
      });
      return response as BrokerTradesResponse;
    },
    onSuccess: (data) => {
      setImportSuccess(true);
      
      // Store Groww credentials if successful
      if (selectedBroker === 'groww' && data.accessToken) {
        const credentials = growwForm.getValues();
        localStorage.setItem("growwIsConnected", "true");
        localStorage.setItem("growwAccessToken", data.accessToken);
        localStorage.setItem("growwUserId", credentials.apiKey.substring(0, 6));
        localStorage.setItem("growwUserName", "Groww User");
      }

      setTimeout(() => {
        onSuccess(data.trades);
        handleClose();
      }, 1500);
    },
  });

  const handleClose = () => {
    setSelectedBroker("");
    setImportSuccess(false);
    kiteForm.reset();
    dhanForm.reset();
    importMutation.reset();
    onOpenChange(false);
  };

  const handleSubmit = () => {
    const form = getCurrentForm();
    if (!form) return;

    form.handleSubmit((data) => {
      importMutation.mutate(data as BrokerCredentials);
    })();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Import Trades from Broker
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!importSuccess ? (
            <>
              <div>
                <Label className="text-sm font-medium">Select Broker</Label>
                <Select
                  value={selectedBroker}
                  onValueChange={(value: BrokerId) => setSelectedBroker(value)}
                >
                  <SelectTrigger
                    className="mt-2"
                    data-testid="select-broker"
                  >
                    <SelectValue placeholder="Choose your broker" />
                  </SelectTrigger>
                  <SelectContent>
                    {brokerIds.map((brokerId) => (
                      <SelectItem
                        key={brokerId}
                        value={brokerId}
                        data-testid={`option-broker-${brokerId}`}
                      >
                        {brokerLabels[brokerId]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBroker && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {brokerDescriptions[selectedBroker]}
                  </p>
                )}
              </div>

              {selectedBroker === "kite" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="kite-api-key" className="text-sm">
                      API Key
                    </Label>
                    <Input
                      id="kite-api-key"
                      {...kiteForm.register("apiKey")}
                      placeholder="Enter your Kite API Key"
                      className="mt-1"
                      data-testid="input-kite-api-key"
                    />
                    {kiteForm.formState.errors.apiKey && (
                      <p className="text-xs text-red-600 mt-1">
                        {kiteForm.formState.errors.apiKey.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="kite-api-secret" className="text-sm">
                      API Secret
                    </Label>
                    <Input
                      id="kite-api-secret"
                      type="password"
                      {...kiteForm.register("apiSecret")}
                      placeholder="Enter your Kite API Secret"
                      className="mt-1"
                      data-testid="input-kite-api-secret"
                    />
                    {kiteForm.formState.errors.apiSecret && (
                      <p className="text-xs text-red-600 mt-1">
                        {kiteForm.formState.errors.apiSecret.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="kite-request-token" className="text-sm">
                      Request Token
                    </Label>
                    <Input
                      id="kite-request-token"
                      {...kiteForm.register("requestToken")}
                      placeholder="Enter your Request Token"
                      className="mt-1"
                      data-testid="input-kite-request-token"
                    />
                    {kiteForm.formState.errors.requestToken && (
                      <p className="text-xs text-red-600 mt-1">
                        {kiteForm.formState.errors.requestToken.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedBroker === "groww" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="groww-api-key" className="text-sm">
                      API Key
                    </Label>
                    <Input
                      id="groww-api-key"
                      {...growwForm.register("apiKey")}
                      placeholder="Enter your Groww API Key"
                      className="mt-1"
                      data-testid="input-groww-api-key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="groww-api-secret" className="text-sm">
                      API Secret
                    </Label>
                    <Input
                      id="groww-api-secret"
                      type="password"
                      {...growwForm.register("apiSecret")}
                      placeholder="Enter your Groww API Secret"
                      className="mt-1"
                      data-testid="input-groww-api-secret"
                    />
                  </div>
                </div>
              )}

              {importMutation.isError && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        Import Failed
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        {importMutation.error instanceof Error
                          ? importMutation.error.message
                          : "Failed to import trades. Please check your credentials and try again."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={importMutation.isPending}
                  data-testid="button-cancel-broker-import"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedBroker || importMutation.isPending}
                  data-testid="button-submit-broker-import"
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    "Import Trades"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mb-4" />
              <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
                Import Successful!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                {importMutation.data?.trades.length || 0} trades imported from{" "}
                {selectedBroker && brokerLabels[selectedBroker]}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
