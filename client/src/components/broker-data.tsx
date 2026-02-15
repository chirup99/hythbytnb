import { DialogContent, Dialog } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff, Plus, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRef } from "react";

interface BrokerDataProps {
  showOrderModal: boolean;
  setShowOrderModal: (open: boolean) => void;
  orderTab: string;
  setOrderTab: (tab: string) => void;
  showUserId: boolean;
  setShowUserId: (show: boolean) => void;
  zerodhaClientId: string | null;
  zerodhaUserName: string | null;
  upstoxAccessToken?: string | null;
  upstoxUserId?: string | null;
  upstoxUserName?: string | null;
  dhanAccessToken?: string | null;
  dhanUserId?: string | null;
  dhanClientId?: string | null;
  dhanClientName?: string | null;
  brokerOrders: any[];
  fetchingBrokerOrders: boolean;
  zerodhaAccessToken: string | null;
  recordAllBrokerOrders: () => void;
  brokerPositions: any[];
  fetchingBrokerPositions: boolean;
  showBrokerImportModal: boolean;
  setShowBrokerImportModal: (open: boolean) => void;
  handleBrokerImport: (data: any) => void;
  showImportModal: boolean;
  setShowImportModal: (open: boolean) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeFormat: any;
  detectedFormatLabel: string;
  isBuildMode: boolean;
  setIsBuildMode: (is: boolean) => void;
  brokerSearchInput: string;
  setBrokerSearchInput: (input: string) => void;
  showBrokerSuggestions: boolean;
  setShowBrokerSuggestions: (show: boolean) => void;
  filteredBrokers: string[];
  buildModeData: any;
  setBuildModeData: (data: any) => void;
  allColumnsFilledForSave: boolean;
  missingColumns: string[];
  saveFormatToUniversalLibrary: (label: string, data: any, broker: string) => Promise<boolean>;
  currentUser: any;
  getCognitoToken: () => Promise<string | null>;
  setSavedFormats: (formats: any) => void;
  importDataTextareaRef: React.RefObject<HTMLTextAreaElement>;
  deltaExchangeIsConnected?: boolean;
  deltaExchangeApiKey?: string | null;
  deltaExchangeApiSecret?: string | null;
  deltaExchangeUserId?: string | null;
  deltaExchangeAccountName?: string | null;
  brokerFunds: number | null;
}

export function BrokerData(props: BrokerDataProps) {
  const {
    showOrderModal, setShowOrderModal, orderTab, setOrderTab, showUserId, setShowUserId,
    zerodhaClientId, zerodhaUserName, upstoxAccessToken, upstoxUserId, upstoxUserName,
    dhanAccessToken, dhanUserId, dhanClientId, dhanClientName,
    deltaExchangeIsConnected, deltaExchangeApiKey, deltaExchangeApiSecret,
    deltaExchangeUserId, deltaExchangeAccountName,
    brokerOrders, fetchingBrokerOrders, zerodhaAccessToken,
    recordAllBrokerOrders, brokerPositions, fetchingBrokerPositions, showBrokerImportModal,
    setShowBrokerImportModal, handleBrokerImport, showImportModal, setShowImportModal,
    handleFileUpload, activeFormat, detectedFormatLabel, isBuildMode, setIsBuildMode,
    brokerSearchInput, setBrokerSearchInput, showBrokerSuggestions, setShowBrokerSuggestions,
    filteredBrokers, buildModeData, setBuildModeData, allColumnsFilledForSave, missingColumns,
    saveFormatToUniversalLibrary, currentUser, getCognitoToken, setSavedFormats, importDataTextareaRef,
    brokerFunds
  } = props;

  const isConnected = zerodhaAccessToken || upstoxAccessToken || dhanAccessToken || deltaExchangeIsConnected;
  const activeBroker = zerodhaAccessToken ? 'zerodha' : upstoxAccessToken ? 'upstox' : dhanAccessToken ? 'dhan' : deltaExchangeIsConnected ? 'delta' : null;

  const formatSymbol = (symbol: string) => {
    if (!symbol) return "";
    
    // NIFTY2610626100CE -> NIFTY 06th JAN 26100 CE
    // Pattern: [NAME][YY][M][DD][STRIKE][TYPE]
    // NIFTY 26 1 06 26100 CE
    
    const regex = /^([A-Z]+)(\d{2})([1-9]|O|N|D)(\d{2})(\d+)([PC]E)$/;
    const match = symbol.match(regex);
    
    if (match) {
      const [_, name, year, month, day, strike, type] = match;
      
      const months: Record<string, string> = {
        "1": "JAN", "2": "FEB", "3": "MAR", "4": "APR", "5": "MAY", "6": "JUN",
        "7": "JUL", "8": "AUG", "9": "SEP", "O": "OCT", "N": "NOV", "D": "DEC"
      };
      
      const getOrdinal = (d: string) => {
        const n = parseInt(d);
        if (n > 3 && n < 21) return 'th';
        switch (n % 10) {
          case 1: return "st";
          case 2: return "nd";
          case 3: return "rd";
          default: return "th";
        }
      };

      const monthName = months[month] || month;
      const dayNum = parseInt(day).toString();
      const ordinal = getOrdinal(day);
      
      return `${name} ${dayNum}${ordinal} ${monthName} ${strike} ${type}`;
    }
    
    return symbol;
  };

  return (
    <>
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-thin-scrollbar p-0">
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center">
            <div className="w-1/3 flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Orders & Positions</span>
              {isConnected ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-[10px] font-medium border border-green-100 dark:border-green-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live Connected
                </div>
              ) : null}
            </div>

            <div className="w-1/3 flex flex-col items-center justify-center">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Funds</span>
              <span className="text-xs font-bold text-green-600 dark:text-green-400">
                {showUserId ? (activeBroker === 'delta' ? `$${(Number(brokerFunds) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₹${(Number(brokerFunds) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) : (activeBroker === 'delta' ? "$***" : "₹***")}
              </span>
            </div>

            <div className="w-1/3 flex items-center justify-end gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 rounded px-2 py-1">
                  {activeBroker === 'zerodha' && (
                    <>
                      <img src="https://zerodha.com/static/images/products/kite-logo.svg" alt="Zerodha" className="w-3 h-3" />
                      <span>id: {showUserId ? (zerodhaClientId || "N/A") : "••••••"} | {showUserId ? (zerodhaUserName || "N/A") : "•••••"}</span>
                    </>
                  )}
                  {activeBroker === 'upstox' && (
                    <>
                      <img src="https://assets.upstox.com/content/assets/images/cms/202494/MediumWordmark_UP(WhiteOnPurple).png" alt="Upstox" className="w-3 h-3" />
                      <span>id: {showUserId ? (upstoxUserId || "N/A") : "••••••"} | {showUserId ? (upstoxUserName && upstoxUserName !== "undefined" && upstoxUserName !== "N/A" ? upstoxUserName : "Upstox User") : "•••••"}</span>
                    </>
                  )}
                  {activeBroker === 'dhan' && (
                    <>
                      <img src="https://play-lh.googleusercontent.com/lVXf_i8Gi3C7eZVWKgeG8U5h_kAzUT0MrmvEAXfM_ihlo44VEk01HgAi6vbBNsSzBQ=w240-h480-rw?v=1701" alt="Dhan" className="w-4 h-4" />
                      <span>id: {showUserId ? (dhanClientId || dhanUserId || "N/A") : "••••••"} | {showUserId ? (dhanClientName && dhanClientName !== "Dhan User" ? dhanClientName : "Dhan User") : "•••••"}</span>
                    </>
                  )}
                  {activeBroker === 'delta' && (
                    <>
                      <img src="https://play-lh.googleusercontent.com/XAQ7c8MRAvy_mOUw8EGS3tQsn95MY7gJxtj-sSoVZ6OYJmjvt7KaGGDyT85UTRpLxL6d=w240-h480-rw" alt="Delta Exchange" className="w-3 h-3 rounded-full" />
                      <span>id: {showUserId ? (deltaExchangeUserId && deltaExchangeUserId !== "Fetching..." ? deltaExchangeUserId : "N/A") : "••••••"} | {showUserId ? (deltaExchangeAccountName && deltaExchangeAccountName !== "Delta User" ? deltaExchangeAccountName : "Delta User") : "•••••"}</span>
                    </>
                  )}
                </div>
                {(activeBroker === 'zerodha' || activeBroker === 'upstox' || activeBroker === 'dhan' || activeBroker === 'delta') && (
                  <button onClick={() => setShowUserId(!showUserId)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" data-testid="button-toggle-user-id" title={showUserId ? "Hide ID" : "Show ID"}>
                    {showUserId ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            <Tabs value={orderTab} onValueChange={setOrderTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="history">Orders</TabsTrigger>
                <TabsTrigger value="positions">Positions</TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="space-y-4">
                <div className="max-h-96 overflow-y-auto border rounded-lg custom-thin-scrollbar">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium">Time</th>
                        <th className="px-2 py-2 text-left font-medium">Order</th>
                        <th className="px-2 py-2 text-left font-medium">Symbol</th>
                        <th className="px-2 py-2 text-left font-medium">Type</th>
                        <th className="px-2 py-2 text-left font-medium">Qty</th>
                        <th className="px-2 py-2 text-left font-medium">Price</th>
                        <th className="px-2 py-2 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brokerOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                            {fetchingBrokerOrders ? 'Loading orders...' : isConnected ? 'No orders found' : 'Connect to broker to view orders'}
                          </td>
                        </tr>
                      ) : (
                        [...brokerOrders].sort((a, b) => { 
                          const aStatus = String(a.status || "").toUpperCase().trim(); 
                          const bStatus = String(b.status || "").toUpperCase().trim(); 
                          const aOrder = aStatus === "COMPLETE" || aStatus === "PENDING" ? 0 : aStatus === "REJECTED" || aStatus === "CANCELLED" ? 999 : 500; 
                          const bOrder = bStatus === "COMPLETE" || bStatus === "PENDING" ? 0 : bStatus === "REJECTED" || bStatus === "CANCELLED" ? 999 : 500; 
                          return aOrder - bOrder; 
                        }).map((trade, index) => {
                          const status = String(trade.status || "").toUpperCase().trim();
                          const isClosed = status === "REJECTED" || status === "CANCELLED";
                          
                          // Format time to show only time (HH:MM:SS AM/PM) if it's a full date string
                          let displayTime = trade.time;
                          if (displayTime && displayTime.includes(' ')) {
                            try {
                              const dateParts = displayTime.split(' ');
                              // If it's YYYY-MM-DD HH:MM:SS, take the second part
                              if (dateParts.length >= 2) {
                                displayTime = dateParts[1];
                                // Add AM/PM if not present and if it looks like a 24h time we want to convert or just keep as is
                                // User asked for "same zerodha orders&postion format" which from image 2 shows "11:13:39 AM"
                                const timeObj = new Date(`2000-01-01 ${displayTime}`);
                                if (!isNaN(timeObj.getTime())) {
                                  displayTime = timeObj.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit', 
                                    second: '2-digit',
                                    hour12: true 
                                  });
                                }
                              }
                            } catch (e) {
                              console.error("Error formatting time:", e);
                            }
                          }

                          return (
                            <tr key={index} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${isClosed ? 'bg-gray-100/50 dark:bg-gray-800/40' : ''}`}>
                              <td className="px-2 py-2 font-medium">{displayTime}</td>
                              <td className="px-2 py-2">
                                <span className={`px-1 py-0.5 rounded text-xs ${
                                  trade.order === "BUY"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                }`}>
                                  {trade.order}
                                </span>
                              </td>
                              <td className="px-2 py-2 font-medium">{formatSymbol(trade.symbol)}</td>
                              <td className="px-2 py-2">{trade.type}</td>
                              <td className="px-2 py-2">{trade.qty}</td>
                              <td className="px-2 py-2">₹{typeof trade.price === 'number' ? trade.price.toFixed(2) : trade.price}</td>
                              <td className="px-2 py-2">
                                <span className={`text-xs font-medium ${
                                  (status === 'COMPLETE' || status === 'COMPLETED') ? 'text-green-600 dark:text-green-400' :
                                  status === 'REJECTED' ? 'text-red-600 dark:text-red-400' :
                                  status === 'CANCELLED' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-blue-600 dark:text-blue-400'
                                }`}>
                                  {(trade.status || 'PENDING').toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
                  <button
                    onClick={recordAllBrokerOrders}
                    disabled={brokerOrders.length === 0}
                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded transition-colors"
                    data-testid="button-record-broker-orders"
                  >
                    Record to Journal
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{brokerOrders.length} orders</span>
                </div>
              </TabsContent>

              <TabsContent value="positions" className="space-y-4">
                <div className="max-h-96 overflow-y-auto border rounded-lg custom-thin-scrollbar">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium">Symbol</th>
                        <th className="px-2 py-2 text-left font-medium">Entry Price</th>
                        <th className="px-2 py-2 text-left font-medium">Current Price</th>
                        <th className="px-2 py-2 text-left font-medium">Qty</th>
                        <th className="px-2 py-2 text-left font-medium">Unrealized P&L</th>
                        <th className="px-2 py-2 text-left font-medium">Return %</th>
                        <th className="px-2 py-2 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brokerPositions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                            {fetchingBrokerPositions ? 'Loading positions...' : isConnected ? 'No open positions' : 'Connect to broker to view positions'}
                          </td>
                        </tr>
                      ) : (
                        [...brokerPositions].sort((a, b) => { 
                          const aStatus = String(a.status || "Open").toUpperCase().trim(); 
                          const bStatus = String(b.status || "Open").toUpperCase().trim(); 
                          return (aStatus === "OPEN" ? 0 : 999) - (bStatus === "OPEN" ? 0 : 999); 
                        }).map((pos, index) => {
                          const entryPrice = (pos.entryPrice || pos.entry_price || 0) as number;
                          const currentPrice = (pos.currentPrice || pos.current_price || 0) as number;
                          const qty = (pos.qty || pos.quantity || 0) as number;
                          const unrealizedPnl = (currentPrice - entryPrice) * qty;
                          const status = String(pos.status || "Open").toUpperCase().trim();
                          const isClosed = status === "CLOSED";
                          const returnPercent = (entryPrice > 0 && !isClosed) ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
                          
                          // Format time if available (some brokers include it in positions)
                          let displayTime = pos.time || pos.timestamp || '';
                          if (displayTime && typeof displayTime === 'string' && displayTime.includes(' ')) {
                            try {
                              const dateParts = displayTime.split(' ');
                              if (dateParts.length >= 2) {
                                displayTime = dateParts[1];
                                const timeObj = new Date(`2000-01-01 ${displayTime}`);
                                if (!isNaN(timeObj.getTime())) {
                                  displayTime = timeObj.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit', 
                                    second: '2-digit',
                                    hour12: true 
                                  });
                                }
                              }
                            } catch (e) {
                              console.error("Error formatting position time:", e);
                            }
                          }
                          
                          return (
                            <tr key={index} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${isClosed ? 'bg-gray-100/50 dark:bg-gray-800/40' : ''}`}>
                              <td className="px-2 py-2 font-medium">
                                <div>{formatSymbol(pos.symbol)}</div>
                                {displayTime && <div className="text-[10px] text-gray-500 font-normal">{displayTime}</div>}
                              </td>
                              <td className="px-2 py-2">₹{entryPrice.toFixed(2)}</td>
                              <td className="px-2 py-2">₹{currentPrice.toFixed(2)}</td>
                              <td className="px-2 py-2">{qty}</td>
                              <td className={`px-2 py-2 font-medium ${unrealizedPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                ₹{unrealizedPnl.toFixed(2)}
                              </td>
                              <td className={`px-2 py-2 ${returnPercent >= 0 || isClosed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isClosed ? "0.00%" : `${returnPercent.toFixed(2)}%`}
                              </td>
                              <td className="px-2 py-2">{(pos.status || 'Open').toUpperCase()}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{brokerPositions.length} open positions</span>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
