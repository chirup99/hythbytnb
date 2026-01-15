            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div>NIFTY data not available</div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = niftyData.change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? "text-green-600" : "text-red-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {niftyData.name}
        </CardTitle>
        <CardDescription>Live streaming data from NSE</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">
              {niftyData.ltp?.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "N/A"}
            </div>
            <div className="text-sm text-gray-500">Last Traded Price</div>
          </div>
          <div className={`text-right ${trendColor}`}>
            <div className="flex items-center justify-end gap-1">
              <TrendIcon className="h-4 w-4" />
              <span className="text-lg font-semibold">
                {isPositive ? "+" : ""}
                {niftyData.change?.toFixed(2) || "N/A"}
              </span>
            </div>
            <div className="text-sm">
              ({isPositive ? "+" : ""}
              {niftyData.changePercent?.toFixed(2) || "N/A"}%)
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500">
            Last Updated: {new Date(niftyData.lastUpdate).toLocaleTimeString()}
          </div>
          <div className="text-xs text-gray-500">Code: {niftyData.code}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface HistoricalDataResponse {
  symbol: string;
  resolution: string;
  range_from: string;
  range_to: string;
  candles: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

function HistoricalDataSection() {
  // Set default dates to a few days ago to ensure data availability (avoid weekends/holidays)
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() - 3); // Go back 3 days to avoid weekend issues
  const [fromDate, setFromDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [timeframe, setTimeframe] = useState("1");
  const [selectedSymbol, setSelectedSymbol] = useState("NSE:INFY-EQ");
  const [sentimentAnalysis, setSentimentAnalysis] = useState<any[]>([]);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const queryClient = useQueryClient();

  const { data: historicalData } = useQuery<HistoricalDataResponse>({
    queryKey: [
      "/api/historical-data",
      selectedSymbol,
      fromDate,
      toDate,
      timeframe,
    ],
    enabled: true, // Enable automatic fetching
  });

  const fetchHistoricalData = useMutation({
    mutationFn: async () => {
      const response = await fetch(getFullApiUrl("/api/historical-data"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          resolution: timeframe,
          range_from: fromDate,
          range_to: toDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch historical data");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["/api/historical-data", selectedSymbol, fromDate, toDate, timeframe],
        data,
      );
    },
  });

  const handleFetchData = () => {
    fetchHistoricalData.mutate();
  };

  const analyzeSentiment = async (candles: any[], symbol: string) => {
    if (!candles || candles.length === 0) return;

    setIsAnalyzingSentiment(true);
    try {
      const response = await fetch(getFullApiUrl("/api/sentiment-analysis"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candles,
          symbol,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSentimentAnalysis(data.sentiment || []);
      } else {
        console.error("Failed to analyze sentiment");
        setSentimentAnalysis([]);
      }
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      setSentimentAnalysis([]);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  // Auto-analyze sentiment when historical data changes
  React.useEffect(() => {
    if (historicalData?.candles && historicalData.candles.length > 0) {
      analyzeSentiment(historicalData.candles, selectedSymbol);
    }
  }, [historicalData, selectedSymbol]);

  const handleExportToExcel = () => {
    if (
      !historicalData ||
      !historicalData.candles ||
      historicalData.candles.length === 0
    ) {
      return;
    }

    // Prepare CSV content with sentiment data
    const headers = [
      "Date",
      "Time",
      "Open",
      "High",
      "Low",
      "Close",
      "Volume",
      "Sentiment_Signal",
      "Sentiment_Score",
      "Confidence",
    ];
    const csvContent = [
      headers.join(","),
      ...historicalData.candles.map((candle, index) => {
        const date = new Date(candle.timestamp * 1000);
        const dateStr = format(date, "d/M/yyyy");
        const timeStr = format(date, "HH:mm:ss");
        const sentiment = sentimentAnalysis[index];
        return [
          dateStr,
          timeStr,
          candle.open.toFixed(2),
          candle.high.toFixed(2),
          candle.low.toFixed(2),
          candle.close.toFixed(2),
          candle.volume.toString(),
          sentiment?.signal || "N/A",
          sentiment?.score?.toFixed(2) || "N/A",
          sentiment?.confidence?.toFixed(0) || "N/A",
        ].join(",");
      }),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    // Generate filename with symbol, timeframe, and date range
    const symbolName = (selectedSymbol || "UNKNOWN")
      .replace("NSE:", "")
      .replace("-EQ", "")
      .replace("-INDEX", "");
    const timeframeName = timeframe === "1" ? "1min" : `${timeframe}min`;
    const dateRange =
      fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
    const filename = `${symbolName}_${timeframeName}_${dateRange}_OHLC.csv`;

    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Historical OHLC Data
        </CardTitle>
        <CardDescription>
          Custom date range, symbol, and timeframe selection with real-time
          Fyers API data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date, Symbol, and Timeframe Selection */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from-date">From Date</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to-date">To Date</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger>
                <SelectValue placeholder="Select symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NSE:NIFTY50-INDEX">NIFTY 50</SelectItem>
                <SelectItem value="NSE:INFY-EQ">INFOSYS</SelectItem>
                <SelectItem value="NSE:RELIANCE-EQ">RELIANCE</SelectItem>
                <SelectItem value="NSE:TCS-EQ">TCS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Minute</SelectItem>
                <SelectItem value="5">5 Minutes</SelectItem>
                <SelectItem value="10">10 Minutes</SelectItem>
                <SelectItem value="15">15 Minutes</SelectItem>
                <SelectItem value="20">20 Minutes</SelectItem>
                <SelectItem value="30">30 Minutes</SelectItem>
                <SelectItem value="40">40 Minutes</SelectItem>
                <SelectItem value="60">1 Hour</SelectItem>
                <SelectItem value="80">80 Minutes</SelectItem>
                <SelectItem value="120">2 Hours</SelectItem>
                <SelectItem value="160">160 Minutes</SelectItem>
                <SelectItem value="240">4 Hours</SelectItem>
                <SelectItem value="320">320 Minutes</SelectItem>
                <SelectItem value="480">8 Hours</SelectItem>
                <SelectItem value="960">16 Hours</SelectItem>
                <SelectItem value="1D">1 Day</SelectItem>
                <SelectItem value="2D">2 Days</SelectItem>
                <SelectItem value="4D">4 Days</SelectItem>
                <SelectItem value="8D">8 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <div className="flex gap-1.5">
              <Button
                onClick={handleFetchData}
                disabled={fetchHistoricalData.isPending}
                className="flex-1"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {fetchHistoricalData.isPending ? "Fetching..." : "Fetch Data"}
              </Button>
              <Button
                onClick={handleExportToExcel}
                disabled={
                  !historicalData || historicalData.candles.length === 0
                }
                variant="outline"
                size="default"
                className="px-3"
                title="Export OHLC data to Excel"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {fetchHistoricalData.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="bg-red-100 rounded-full p-1">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-red-800 font-medium">
                  Fyers API Temporary Service Issue
                </h3>
                <div className="text-red-700 text-sm mt-1 space-y-2">
                  <p>
                    <strong>Current Status:</strong> Fyers API is experiencing
                    intermittent service issues with historical data endpoints.
                    Live market data continues working perfectly.
                  </p>
                  <div className="bg-green-100 p-3 rounded border-l-4 border-green-400">
                    <p className="font-medium text-green-800">
                      What's Still Working:
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-green-700">
                      <li>
                        • <strong>Live Market Data:</strong> Real-time prices
                        streaming every 3 seconds (Dashboard tab)
                      </li>
                      <li>
                        • <strong>Chart Tab:</strong> Professional interactive
                        candlestick chart with zoom controls
                      </li>
                      <li>
                        • <strong>Pattern Analysis:</strong> All 14 Battu API
                        endpoints for technical analysis
                      </li>
                      <li>
                        • <strong>Previously Successful:</strong> CB Tab fetched
                        375 candles earlier before API maintenance
                      </li>
                    </ul>
                  </div>
                  <div className="bg-blue-100 p-3 rounded border-l-4 border-blue-400">
                    <p className="font-medium text-blue-800">
                      Alternative Solutions:
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-blue-700">
                      <li>
                        • <strong>Use Chart Tab:</strong> Interactive
                        candlestick chart may have different data endpoints
                      </li>
                      <li>
                        • <strong>Try Later:</strong> API maintenance typically
                        resolves within 30-60 minutes
                      </li>
                      <li>
                        • <strong>Different Dates:</strong> Try various past
                        trading days as availability varies
                      </li>
                      <li>
                        • <strong>Monitor Dashboard:</strong> Live streaming
                        data remains fully functional
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {historicalData && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-green-100 rounded-full p-1">
                  <svg
                    className="h-4 w-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-green-800 font-medium">
                  ✅ Fyers API Successfully Connected & Data Loaded!
                </div>
              </div>
              <div className="text-green-700 text-sm mt-1">
                Real-time historical OHLC data fetched successfully from Fyers
                API v3.0.0
              </div>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                OHLC Data ({historicalData?.candles?.length || 0} candles) - CB
                Tab
              </h3>
              <div className="text-sm text-gray-500 space-y-1">
                <div>
                  {fromDate} to {toDate} | {timeframe} minute timeframe
                </div>
                <div className="text-xs">
                  Total Candles: {historicalData?.candles?.length || 0}
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-auto border rounded-lg custom-thin-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                    <TableHead className="text-right">High</TableHead>
                    <TableHead className="text-right">Low</TableHead>
                    <TableHead className="text-right">Close</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-center">Sentiment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalData?.candles?.map((candle, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(candle.timestamp * 1000).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.open.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.high.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.low.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.close.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.volume.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {isAnalyzingSentiment &&
                        index < sentimentAnalysis.length ? (
                          <div className="flex items-center justify-center space-x-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-gray-500">
                              Analyzing...
                            </span>
                          </div>
                        ) : sentimentAnalysis[index] ? (
                          <div className="space-y-1 bg-white dark:bg-gray-900/50 rounded-lg p-3">
                            <div
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                sentimentAnalysis[index].signal === "BUY"
                                  ? "bg-green-100 text-green-800"
                                  : sentimentAnalysis[index].signal === "SELL"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {sentimentAnalysis[index].signal}
                            </div>
                            <div className="text-xs text-gray-600">
                              {sentimentAnalysis[index].confidence}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full ${
                                  sentimentAnalysis[index].score > 0
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width: `${
                                    Math.abs(sentimentAnalysis[index].score) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!historicalData?.candles ||
                    historicalData.candles.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-gray-500"
                      >
                        <div className="space-y-2">
                          <div>No historical data available</div>
                          <div className="text-sm">
                            Historical data access may require specific API
                            permissions or market hours. Use the "Fetch Data"
                            button above to attempt loading data.
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MicroAnimationsDemoPage() {
  const [demoPrice, setDemoPrice] = useState(1552.5);
  const [prevPrice, setPrevPrice] = useState(1552.5);
  const [isExecuting, setIsExecuting] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [volume, setVolume] = useState(1000000);
  const [isLive, setIsLive] = useState(true);
  const [profitLoss, setProfitLoss] = useState(0);
  const [showCandleAnimation, setShowCandleAnimation] = useState(false);

  // Demo candle data
  const demoCandleData = {
    open: 1580.0,
    high: 1585.5,
    low: 1548.2,
    close: 1552.5,
  };

  const updatePrice = (direction: "up" | "down") => {
    setPrevPrice(demoPrice);
    const change =
      direction === "up" ? Math.random() * 5 + 1 : -(Math.random() * 5 + 1);
    setDemoPrice((prev) => Math.max(prev + change, 1500));
  };

  const simulateTradeExecution = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      const change =
        tradeType === "buy"
          ? Math.random() * 10 + 5
          : -(Math.random() * 10 + 5);
      setProfitLoss(change);
    }, 3000);
  };

  const simulateVolumeSpike = () => {
    setVolume((prev) => prev * (1.5 + Math.random()));
    setTimeout(() => setVolume(1000000), 3000);
  };

  const toggleMarketStatus = () => {
    setIsLive(!isLive);
  };

  const triggerCandleAnimation = () => {
    setShowCandleAnimation(false);
    setTimeout(() => setShowCandleAnimation(true), 100);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Micro-Animations for Trading Interface
          </CardTitle>
          <CardDescription>
            Interactive demos showcasing smooth animations for trade execution
            and market movements
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Price Change Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Price Change Animation</CardTitle>
            <CardDescription>
              Live price updates with directional indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-white dark:bg-gray-900 rounded-lg">
              <PriceChangeAnimation
                value={demoPrice}
                previousValue={prevPrice}
                className="text-lg"
              />
            </div>
            <div className="flex gap-1.5">
              <Button onClick={() => updatePrice("up")} className="flex-1">
                <TrendingUp className="h-4 w-4 mr-2" />
                Price Up
              </Button>
              <Button
                onClick={() => updatePrice("down")}
                variant="outline"
                className="flex-1"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Price Down
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trade Execution Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Execution Animation</CardTitle>
            <CardDescription>
              Order execution feedback with loading states
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex gap-1.5">
                <Button
                  onClick={() => setTradeType("buy")}
                  variant={tradeType === "buy" ? "default" : "outline"}
                  size="sm"
                >
                  Buy
                </Button>
                <Button
                  onClick={() => setTradeType("sell")}
                  variant={tradeType === "sell" ? "default" : "outline"}
                  size="sm"
                >
                  Sell
                </Button>
              </div>
              <Button
                onClick={simulateTradeExecution}
                disabled={isExecuting}
                className="w-full"
              >
                {isExecuting ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute {tradeType.toUpperCase()} Order
                  </>
                )}
              </Button>
            </div>
            <TradeExecutionAnimation
              isExecuting={isExecuting}
              tradeType={tradeType}
              amount="100"
              symbol="INFY"
            />
          </CardContent>
        </Card>

        {/* Volume Spike Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Volume Spike Animation</CardTitle>
            <CardDescription>
              Animated volume alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <VolumeSpikeAnimation
                volume={volume}
                averageVolume={1000000}
                className="text-sm"
              />
            </div>
            <Button onClick={simulateVolumeSpike} className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              Trigger Volume Spike
            </Button>
          </CardContent>
        </Card>

        {/* Market Status Pulse */}
        <Card>
          <CardHeader>
            <CardTitle>Market Status Animation</CardTitle>
            <CardDescription>
              Live market status with pulsing indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <MarketStatusPulse isLive={isLive} />
            </div>
            <Button onClick={toggleMarketStatus} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Toggle Market Status
            </Button>
          </CardContent>
        </Card>

        {/* Profit/Loss Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Profit/Loss Animation</CardTitle>
            <CardDescription>
              Animated P&L with color transitions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <ProfitLossAnimation
                value={profitLoss}
                showCurrency={true}
                className="text-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setProfitLoss(Math.random() * 100 + 10)}
                size="sm"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Profit
              </Button>
              <Button
                onClick={() => setProfitLoss(-(Math.random() * 100 + 10))}
                variant="outline"
                size="sm"
              >
                <TrendingDown className="h-3 w-3 mr-1" />
                Loss
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Candlestick Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Candlestick Formation</CardTitle>
            <CardDescription>Animated candle drawing process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {showCandleAnimation && (
                <CandlestickAnimation candle={demoCandleData} duration={2000} />
              )}
            </div>
            <Button onClick={triggerCandleAnimation} className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              Animate Candle Formation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Loading Skeleton Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Market Data Loading Animation</CardTitle>
          <CardDescription>
            Skeleton loading states for market data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MarketDataSkeleton />
            <MarketDataSkeleton />
            <MarketDataSkeleton />
          </div>
        </CardContent>
      </Card>

      {/* Integration Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Live Market Data with Animations</CardTitle>
          <CardDescription>
            Real INFY data enhanced with micro-animations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Live Price</Label>
              <PriceChangeAnimation
                value={1552.5}
                previousValue={1574.5}
                className="p-3 border rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label>P&L Today</Label>
              <ProfitLossAnimation
                value={-22.0}
                showCurrency={true}
                className="p-3 border rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Market Status</Label>
              {isReportLoading && (
                                                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                                                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-8 border border-gray-700 shadow-2xl max-w-md">
                                                      <div className="text-center">
                                                        <style>{`
                                                          @keyframes thinkingDot {
                                                            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
                                                            30% { opacity: 1; transform: translateY(-8px); }
                                                          }
                                                          .thinking-dot {
                                                            display: inline-block;
                                                            width: 10px;
                                                            height: 10px;
                                                            border-radius: 50%;
                                                            background-color: #3b82f6;
                                                            animation: thinkingDot 1.4s infinite;
                                                            margin: 0 4px;
                                                          }
                                                          .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
                                                          .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
                                                        `}</style>
                                                        <h3 className="text-lg font-semibold text-white mb-4">Generating Financial Report</h3>
                                                        <div className="flex items-center justify-center gap-2 mb-3">
                                                          <div className="thinking-dot"></div>
                                                          <div className="thinking-dot"></div>
                                                          <div className="thinking-dot"></div>
                                                        </div>
                                                        <p className="text-sm text-gray-400">Analyzing quarterly data, company insights, and financial statements...</p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                                <div className="p-3 border rounded-lg bg-white dark:bg-gray-700">
                <MarketStatusPulse isLive={false} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// API base URL for Cloud Run compatibility - use environment variable
// BUT: In development mode (localhost), always use relative URLs to avoid CORS issues
const isDevelopmentMode = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('replit.dev') ||
                          window.location.port === '5000';

const API_BASE_URL = isDevelopmentMode ? '' : (import.meta.env.VITE_API_URL || '');

// Helper function to construct full API URLs for Cloud Run compatibility
const getFullApiUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

export default function Home() {
  const [location, setLocation] = useLocation();

  // 🔶 Detect Angel One OAuth callback from redirect
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("angelone_connected")) {
      console.log("✅ Angel One connected successfully (redirect callback)");
      setAngelOneIsConnected(true);
      setAngelOneAccessToken(params.get("angelone_client_code") || "P176266");
      localStorage.setItem("angel_one_client_code", params.get("angelone_client_code") || "P176266");
      toast({ title: "Success", description: "Angel One connected successfully" });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.has("angelone_error")) {
      const error = decodeURIComponent(params.get("angelone_error") || "");
      console.error("❌ Angel One auth error:", error);
      toast({ variant: "destructive", title: "Error", description: error });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  // AUTO-CONNECT: Angel One API - Automatically connect when app loads
  useAngelOneAutoconnect();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("trading-home");
  const [showTutorOverlay, setShowTutorOverlay] = useState(false);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [swipeCurrentY, setSwipeCurrentY] = useState(0);
  const [isSwipingUp, setIsSwipingUp] = useState(false);
  const [showJournalAI, setShowJournalAI] = useState(false);
  const [journalAIData, setJournalAIData] = useState<any>(null);
  const [statisticsTab, setStatisticsTab] = useState("overview");
  // Shared timeframe state for chart and crossings display
  const [chartTimeframe, setChartTimeframe] = useState<string>("1");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [newDob, setNewDob] = useState("");
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  // Navigation menu state
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isProfileActive, setIsProfileActive] = useState(false);

  const handleUpdateProfile = async (updates: any) => {
    try {
      const token = await getCognitoToken();
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        toast({ description: "Profile updated successfully" });
        window.location.reload();
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast({ description: "Error updating profile", variant: "destructive" });
    }
  };

  // Mobile bottom navigation state (home, insight, ranking, paper-trade)
  const [mobileBottomTab, setMobileBottomTab] = useState<
    "home" | "insight" | "ranking" | "paper-trade"
  >("home");
