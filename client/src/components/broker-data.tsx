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
  brokerFunds: number | null;
}

export function BrokerData(props: BrokerDataProps) {
  const {
    showOrderModal, setShowOrderModal, orderTab, setOrderTab, showUserId, setShowUserId,
    zerodhaClientId, zerodhaUserName, upstoxAccessToken, upstoxUserId, upstoxUserName,
    dhanAccessToken, dhanUserId, dhanClientId, dhanClientName,
    brokerOrders, fetchingBrokerOrders, zerodhaAccessToken,
    recordAllBrokerOrders, brokerPositions, fetchingBrokerPositions, showBrokerImportModal,
    setShowBrokerImportModal, handleBrokerImport, showImportModal, setShowImportModal,
    handleFileUpload, activeFormat, detectedFormatLabel, isBuildMode, setIsBuildMode,
    brokerSearchInput, setBrokerSearchInput, showBrokerSuggestions, setShowBrokerSuggestions,
    filteredBrokers, buildModeData, setBuildModeData, allColumnsFilledForSave, missingColumns,
    saveFormatToUniversalLibrary, currentUser, getCognitoToken, setSavedFormats, importDataTextareaRef,
    brokerFunds
  } = props;

  const isConnected = zerodhaAccessToken || upstoxAccessToken || dhanAccessToken;
  const activeBroker = zerodhaAccessToken ? 'zerodha' : upstoxAccessToken ? 'upstox' : dhanAccessToken ? 'dhan' : null;

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
              <span className="text-xs font-bold text-green-600 dark:text-green-400">{showUserId ? `₹${brokerFunds?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}` : "₹***"}</span>
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
                      <img src="https://dhan.co/static/images/dhan-logo-white.svg" alt="Dhan" className="w-3 h-3 dark:invert opacity-70" />
                      <span>id: {showUserId ? (dhanClientId || dhanUserId || "N/A") : "••••••"} | {showUserId ? (dhanClientName && dhanClientName !== "Dhan User" ? dhanClientName : "Dhan User") : "•••••"}</span>
                    </>
                  )}
                </div>
                {(activeBroker === 'zerodha' || activeBroker === 'upstox' || activeBroker === 'dhan') && (
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
                          
                          return (
                            <tr key={index} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${isClosed ? 'bg-gray-100/50 dark:bg-gray-800/40' : ''}`}>
                              <td className="px-2 py-2 font-medium">{trade.time}</td>
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
                                  status === 'COMPLETE' ? 'text-green-600 dark:text-green-400' :
                                  status === 'REJECTED' ? 'text-red-600 dark:text-red-400' :
                                  status === 'CANCELLED' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-blue-600 dark:text-blue-400'
                                }`}>
                                  {trade.status || 'PENDING'}
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
                          const returnPercent = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
                          const status = String(pos.status || "Open").toUpperCase().trim();
                          const isClosed = status === "CLOSED";
                          
                          return (
                            <tr key={index} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${isClosed ? 'bg-gray-100/50 dark:bg-gray-800/40' : ''}`}>
                              <td className="px-2 py-2 font-medium">{formatSymbol(pos.symbol)}</td>
                              <td className="px-2 py-2">₹{entryPrice.toFixed(2)}</td>
                              <td className="px-2 py-2">₹{currentPrice.toFixed(2)}</td>
                              <td className="px-2 py-2">{qty}</td>
                              <td className={`px-2 py-2 font-medium ${unrealizedPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                ₹{unrealizedPnl.toFixed(2)}
                              </td>
                              <td className={`px-2 py-2 ${returnPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {returnPercent.toFixed(2)}%
                              </td>
                              <td className="px-2 py-2">{pos.status || 'Open'}</td>
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
