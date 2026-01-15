import { motion, AnimatePresence } from "framer-motion";

import { BrokerData } from "@/components/broker-data";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useLocation } from "wouter";

import { useToast } from "@/hooks/use-toast";

import { AuthButtonAngelOne, AngelOneStatus, AngelOneApiStatistics, AngelOneSystemStatus, AngelOneLiveMarketPrices } from "@/components/auth-button-angelone";

import { AuthButtonUpstox } from "@/components/auth-button-upstox";

import { TradingJournalModal } from "@/components/trading-journal-modal";

// REMOVED: All Fyers-related imports
// import { AuthButton } from "@/components/auth-button";

// import { ConnectionStatus } from "@/components/connection-status";

// import { MonthlyProgressTracker } from "@/components/monthly-progress-tracker";

// import { ApiStatistics } from "@/components/api-statistics";

// import { ErrorPanel } from "@/components/error-panel";

import { SigninDataWindow } from "@/components/signin-data-window";

import { TradingViewWidget } from "@/components/tradingview-widget";

import { AdvancedCandlestickChart } from "@/components/advanced-candlestick-chart";

import { EnhancedTradingViewWidget } from "@/components/enhanced-tradingview-widget";

import { TradingViewStyleChart } from "@/components/tradingview-style-chart";

import { MinimalChart } from "@/components/minimal-chart";

import {

  MultipleImageUpload,
  MultipleImageUploadRef,
} from "@/components/multiple-image-upload";
import { IndicatorCrossingsDisplay } from "@/components/indicator-crossings-display";

// import { BattuScanSimulation } from "@/components/battu-scan-simulation";

// import { FourCandleRuleScanner } from "@/components/four-candle-rule-scanner";

import NeoFeedSocialFeed from "@/components/neofeed-social-feed";
import SimpleCompleteScanner from "@/components/simple-complete-scanner";
// import { BattuDocumentationDisplay } from "@/components/battu-documentation-display";

import { StrategyBuilder } from "@/components/strategy-builder";

import { TradingMaster } from "@/components/trading-master";

import { WorldMap } from "@/components/world-map";

import { DemoHeatmap } from "@/components/DemoHeatmap";

import { PersonalHeatmap } from "@/components/PersonalHeatmap";

import { useTheme } from "@/components/theme-provider";

import { useCurrentUser } from "@/hooks/useCurrentUser";

import { useAngelOneAutoconnect } from "@/hooks/useAngelOneAutoconnect";

import { cognitoSignOut, getCognitoToken, sendEmailVerificationCode, confirmEmailVerification, checkEmailVerified } from "@/cognito";

import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries, LineSeries, HistogramSeries, IPriceLine, createSeriesMarkers } from 'lightweight-charts';

import { ArrowLeft, Banknote, Clock, ExternalLink, Info, Loader2, LogOut, Newspaper, RefreshCw, Save, TrendingUp, Award, Headset, X, Play, Music2, Pencil, CheckCircle } from "lucide-react";

import { parseBrokerTrades, ParseError } from "@/utils/trade-parser";


// Global window type declaration for audio control
declare global {
  interface Window {
    stopNewsAudio?: () => void;
  }
}

// import ThreeCycleScanner from "@/components/three-cycle-scanner";
import HistoricalTradeSimulator from "@/components/historical-trade-simulator";
import {

  PriceChangeAnimation,
  TradeExecutionAnimation,
  VolumeSpikeAnimation,
  MarketStatusPulse,
  ProfitLossAnimation,
  CandlestickAnimation,
  MarketDataSkeleton,
} from "@/components/micro-animations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {

  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Switch } from "@/components/ui/switch";

import {

  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
import {

  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {

  TrendingDown,
  Activity,
  Calendar,
  BarChart3,
  
  Pause,
  RotateCcw,
  RotateCw,
  DollarSign,
  Zap,
  Sun,
  Moon,
  GraduationCap,
  Download,
  Mic,
  MessageCircle,
  BookOpen,
  Home as HomeIcon,
  Search,
  Code,
  PenTool,
  Target,
  Grid3X3,
  Send,
  Sparkles,
  Users,
  Upload,
  Timer,
  Edit,
  Check,
  Mail,
  
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Shield,
  Bot,
  User,
  SkipBack,
  SkipForward,
  Heart,
  Lightbulb,
  Star,
  FileText,
  Bell,
  Briefcase,
  PieChart,
  Lock,
  Trophy,
  Radio,
  Eye,
  EyeOff,
  Blocks,
  Hammer,
  Plus,
  Share2,
  Copy,
  Link2,
  Facebook,
  Linkedin,
  Twitter,
  Settings,
  Filter,
  Radar,
  RefreshCcw,
  MoreVertical,
  ChevronsUpDown,
  CalendarDays,
  Brain,
  ShieldCheck,
} from "lucide-react";
import { AIChatWindow } from "@/components/ai-chat-window";

import { BrokerImportDialog } from "@/components/broker-import-dialog";

import { TradeBlockEditor } from "@/components/TradeBlockEditor";

import type { BrokerTrade } from "@shared/schema";

// Type definitions for stock data and trading
interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string | number;
  marketCap: string;
  pe: number;
  high: number;
  low: number;
  open: number;
  sentiment: {
    trend?: string;
    confidence?: string;
    score?: number;
  } | null;
  indicators: {
    rsi?: string;
    ema50?: string;
    macd?: string;
  } | null;
}

interface TradeMarker {
  candleIndex: number;
  price: number;
  type: "buy" | "sell";
  symbol: string;
  quantity: number;
  time: string;
  pnl: string;
}

// SwipeableCardStack Component
interface SwipeableCardStackProps {
  onSectorChange: (sector: string) => void;
  selectedSector: string;
  onCardIndexChange?: (index: number) => void;
  currentCardIndex?: number;
}

function SwipeableCardStack({
  onSectorChange,
  selectedSector,
  onCardIndexChange,
  currentCardIndex = 0,
}: SwipeableCardStackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentContent, setCurrentContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] =
    useState<SpeechSynthesisUtterance | null>(null);

  const [cards, setCards] = useState([
    {
      id: 1,
      title: "TECH NEWS",
      subtitle: "Latest in\ntechnology",
      buttonText: "Read Now",
      gradient: "from-blue-500 to-blue-600",
      buttonColor: "text-blue-600",
      icon: "💻",
      sector: "IT",
    },
    {
      id: 2,
      title: "FINANCE NEWS",
      subtitle: "Market updates\n& trends",
      buttonText: "Listen",
      gradient: "from-green-500 to-green-600",
      buttonColor: "text-green-600",
      icon: "📈",
      sector: "FINANCE",
    },
    {
      id: 3,
      title: "COMMODITY NEWS",
      subtitle: "Commodity\nmarket trends",
      buttonText: "Listen",
      gradient: "from-orange-500 to-orange-600",
      buttonColor: "text-orange-600",
      icon: "🏗️",
      sector: "COMMODITY",
    },
    {
      id: 4,
      title: "GLOBAL NEWS",
      subtitle: "World events\n& updates",
      buttonText: "Listen",
      gradient: "from-purple-500 to-purple-600",
      buttonColor: "text-purple-600",
      icon: "🌍",
      sector: "GLOBAL",
    },
    {
      id: 5,
      title: "BANKING NEWS",
      subtitle: "Banking sector\nupdates",
      buttonText: "Listen",
      gradient: "from-indigo-500 to-indigo-600",
      buttonColor: "text-indigo-600",
      icon: "🏦",
      sector: "BANKS",
    },
    {
      id: 6,
      title: "AUTO NEWS",
      subtitle: "Automotive\nindustry news",
      buttonText: "Listen",
      gradient: "from-red-500 to-red-600",
      buttonColor: "text-red-600",
      icon: "🚗",
      sector: "AUTOMOBILE",
    },
  ]);

  // News cache for faster loading - ultra-short cache for speed
  const newsCache = React.useRef<
    Record<string, { content: string; timestamp: number }>
  >({});
  const CACHE_DURATION = 10 * 1000; // 10 seconds - ultra-short for instant refresh

  // Global cleanup function to stop all audio
  const globalStopAudio = React.useCallback(() => {
    if (currentAudio) {
      speechSynthesis.cancel();
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  }, [currentAudio]);

  // Fetch AI-generated news content for current card with caching
  const fetchAndPlayContent = async (cardTitle: string, sector: string) => {
    // Stop any currently playing audio immediately
    globalStopAudio();

    try {
      setIsLoading(true);

      // Check cache first
      const cacheKey = sector;
      const cachedData = newsCache.current[cacheKey];
      const now = Date.now();

      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        // Use cached content
        setCurrentContent(cachedData.content);
        playAudio(cachedData.content);
        setIsLoading(false);
        return;
      }

      const response = await fetch(getFullApiUrl("/api/daily-news"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sector: sector }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate news content");
      }

      const data = await response.json();
      const content = data.summary;

      // Cache the content
      newsCache.current[cacheKey] = {
        content,
        timestamp: now,
      };

      setCurrentContent(content);
      playAudio(content);
    } catch (error) {
      console.error("Error fetching news:", error);
      const fallbackContent = `${sector.toLowerCase()} market update. Current developments in progress. Trading activity continues.`;
      setCurrentContent(fallbackContent);
      playAudio(fallbackContent);
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio using Speech Synthesis with optimized settings
  const playAudio = (text: string) => {
    // Stop current audio if playing
    if (currentAudio) {
      speechSynthesis.cancel();
    }

    // Clean the text to remove any potential greetings
    const cleanText = text
      .replace(
        /^(good morning|good afternoon|good evening|hello|hi|welcome)/gi,
        "",
      )
      .replace(/^(ladies and gentlemen|dear listeners|in today's news)/gi, "")
      .replace(/^[.,\s]+/, "") // Remove leading punctuation and spaces
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Get available voices and select neutral/direct voices
    const voices = speechSynthesis.getVoices();

    // Prioritize Moira voice specifically, then other natural voices
    const moiraVoice = voices.find(
      (voice) =>
        voice.lang.startsWith("en") &&
        voice.name.toLowerCase().includes("moira"),
    );

    const otherNaturalVoices = voices.filter(
      (voice) =>
        voice.lang.startsWith("en") &&
        !voice.name.toLowerCase().includes("moira") &&
        // Other premium female voices that sound very natural
        (voice.name.toLowerCase().includes("samantha") ||
          voice.name.toLowerCase().includes("karen") ||
          voice.name.toLowerCase().includes("susan") ||
          voice.name.toLowerCase().includes("fiona") ||
          voice.name.toLowerCase().includes("serena") ||
          voice.name.toLowerCase().includes("allison") ||
          voice.name.toLowerCase().includes("ava") ||
          voice.name.toLowerCase().includes("claire") ||
          voice.name.toLowerCase().includes("aria") ||
          voice.name.toLowerCase().includes("zira") ||
          voice.name.toLowerCase().includes("hazel") ||
          // Neural/premium indicators
          voice.name.toLowerCase().includes("neural") ||
          voice.name.toLowerCase().includes("premium") ||
          voice.name.toLowerCase().includes("enhanced")),
    );

    // Use Moira first, then other natural voices, then any English voice
    if (moiraVoice) {
      utterance.voice = moiraVoice;
    } else if (otherNaturalVoices.length > 0) {
      utterance.voice = otherNaturalVoices[0];
    } else {
      const englishVoices = voices.filter(
        (voice) =>
          voice.lang.startsWith("en") &&
          !voice.name.toLowerCase().includes("novelty"),
      );
      if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0];
      }
    }

    // Settings for natural, human-like delivery
    utterance.rate = 0.9; // Slightly slower for more natural pacing
    utterance.pitch = 1.05; // Slight variation for more natural sound
    utterance.volume = 0.85; // Comfortable listening volume

    // Set language for neutral pronunciation
    utterance.lang = "en-US";

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };

    setCurrentAudio(utterance);
    speechSynthesis.speak(utterance);
  };

  // Stop audio playback
  const stopAudio = () => {
    if (currentAudio) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  };

  const swipeCard = (direction: "left" | "right") => {
    // Immediately stop current audio
    globalStopAudio();

    setCards((prev) => {
      const newCards = [...prev];
      let newIndex = currentCardIndex;

      if (direction === "right") {
        // Right swipe: Move to next card (current card goes to back)
        const topCard = newCards.shift();
        if (topCard) {
          newCards.push(topCard);
        }
        newIndex = (currentCardIndex + 1) % 7;
      } else {
        // Left swipe: Move to previous card (bottom card comes to front)
        const bottomCard = newCards.pop();
        if (bottomCard) {
          newCards.unshift(bottomCard);
        }
        newIndex = (currentCardIndex - 1 + 7) % 7;
      }

      // Notify parent of index change
      if (onCardIndexChange) {
        onCardIndexChange(newIndex);
      }

      // Auto-play content for the new front card (faster response)
      if (newCards.length > 0) {
        const frontCard = newCards[0];
        setTimeout(() => {
          fetchAndPlayContent(frontCard.title, frontCard.sector);
        }, 100); // Reduced delay for faster response
      }

      return newCards;
    });
  };

  // Expose global stop function to window for tab switching
  React.useEffect(() => {
    window.stopNewsAudio = globalStopAudio;

    return () => {
      delete window.stopNewsAudio;
    };
  }, [globalStopAudio]);

  // Add window focus/blur detection to stop voice when clicking away
  React.useEffect(() => {
    const handleWindowBlur = () => {
      // Stop audio when user clicks away from the window
      globalStopAudio();
    };

    const handleVisibilityChange = () => {
      // Stop audio when tab becomes hidden
      if (document.hidden) {
        globalStopAudio();
      }
    };

    // Listen for window losing focus
    window.addEventListener("blur", handleWindowBlur);
    // Listen for tab visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [globalStopAudio]);

  // Load voices on component mount
  React.useEffect(() => {
    // Ensure voices are loaded
    const loadVoices = () => {
      speechSynthesis.getVoices();
    };

    // Load voices immediately and on voiceschanged event
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);

    // Cleanup on unmount
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      globalStopAudio(); // Stop any playing audio when component unmounts
    };
  }, [globalStopAudio]);

  // Voice functionality is now only triggered by manual clicks

  return (
    <div className="relative w-56 h-48 md:w-44 md:h-52">
      {cards.map((card, index) => {
        const isTop = index === 0;
        const isSecond = index === 1;
        const isThird = index === 2;

        return (
          <div
            key={card.id}
            data-card-index={index}
            className={`absolute inset-0 transition-all duration-300 ease-out cursor-grab active:cursor-grabbing ${
              isTop
                ? "z-40 scale-100 rotate-0"
                : isSecond
                  ? "z-30 scale-95 rotate-1 translate-y-2"
                  : isThird
                    ? "z-20 scale-90 rotate-2 translate-y-4"
                    : "z-10 scale-85 rotate-3 translate-y-6 opacity-50"
            }`}
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
              if (!isTop) return;

              const startX = e.clientX;
              const startY = e.clientY;
              const cardElement = e.currentTarget as HTMLElement;
              let isDragging = false;

              const handleMouseMove = (e: MouseEvent) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                if (
                  !isDragging &&
                  (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                ) {
                  isDragging = true;
                }

                if (isDragging) {
                  const rotation = deltaX * 0.1;
                  cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                  cardElement.style.opacity = String(
                    Math.max(0.3, 1 - Math.abs(deltaX) / 300),
                  );
                }
              };

              const handleMouseUp = (e: MouseEvent) => {
                if (isDragging) {
                  const deltaX = e.clientX - startX;
                  if (Math.abs(deltaX) > 100) {
                    // Determine swipe direction
                    const swipeDirection = deltaX > 0 ? "right" : "left";

                    if (swipeDirection === "right") {
                      // Right swipe: Card moves away animation
                      const direction = "150%";
                      const rotation = "30deg";
                      cardElement.style.transform = `translate(${direction}, ${
                        deltaX * 0.5
                      }px) rotate(${rotation})`;
                      cardElement.style.opacity = "0";

                      setTimeout(() => {
                        cardElement.style.transform = "";
                        cardElement.style.opacity = "";
                        swipeCard(swipeDirection);
                      }, 300);
                    } else {
                      // Left swipe: Previous card slides in from left (reverse animation)
                      cardElement.style.transform = "";
                      cardElement.style.opacity = "";

                      // Change the card order first
                      swipeCard(swipeDirection);

                      // Then animate the new top card sliding in from the right (coming back)
                      setTimeout(() => {
                        const newTopCard =
                          cardElement.parentElement?.querySelector(
                            '[data-card-index="0"]',
                          ) as HTMLElement;
                        if (newTopCard) {
                          // Start from right side with rotation (like it's coming back)
                          newTopCard.style.transform =
                            "translate(150%, 0) rotate(30deg)";
                          newTopCard.style.opacity = "0";

                          // Animate to center
                          setTimeout(() => {
                            newTopCard.style.transform = "";
                            newTopCard.style.opacity = "";
                            newTopCard.style.transition =
                              "transform 300ms ease-out, opacity 300ms ease-out";

                            // Clear transition after animation
                            setTimeout(() => {
                              newTopCard.style.transition = "";
                            }, 300);
                          }, 10);
                        }
                      }, 10);
                    }
                  } else {
                    // Snap back to center
                    cardElement.style.transform = "";
                    cardElement.style.opacity = "";
                  }
                }

                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
            onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => {
              if (!isTop) return;

              const startX = e.touches[0].clientX;
              const startY = e.touches[0].clientY;
              const cardElement = e.currentTarget as HTMLElement;
              let isDragging = false;

              const handleTouchMove = (e: TouchEvent) => {
                const deltaX = e.touches[0].clientX - startX;
                const deltaY = e.touches[0].clientY - startY;

                if (
                  !isDragging &&
                  (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                ) {
                  isDragging = true;
                }

                if (isDragging) {
                  e.preventDefault();
                  const rotation = deltaX * 0.1;
                  cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                  cardElement.style.opacity = String(
                    Math.max(0.3, 1 - Math.abs(deltaX) / 300),
                  );
                }
              };

              const handleTouchEnd = (e: TouchEvent) => {
                if (isDragging) {
                  const deltaX = e.changedTouches[0].clientX - startX;
                  if (Math.abs(deltaX) > 100) {
                    // Determine swipe direction
                    const swipeDirection = deltaX > 0 ? "right" : "left";

                    if (swipeDirection === "right") {
                      // Right swipe: Card moves away animation
                      const direction = "150%";
                      const rotation = "30deg";
                      cardElement.style.transform = `translate(${direction}, ${
                        deltaX * 0.5
                      }px) rotate(${rotation})`;
                      cardElement.style.opacity = "0";

                      setTimeout(() => {
                        cardElement.style.transform = "";
                        cardElement.style.opacity = "";
                        swipeCard(swipeDirection);
                      }, 300);
                    } else {
                      // Left swipe: Previous card slides in from left (reverse animation)
                      cardElement.style.transform = "";
                      cardElement.style.opacity = "";

                      // Change the card order first
                      swipeCard(swipeDirection);

                      // Then animate the new top card sliding in from the right (coming back)
                      setTimeout(() => {
                        const newTopCard =
                          cardElement.parentElement?.querySelector(
                            '[data-card-index="0"]',
                          ) as HTMLElement;
                        if (newTopCard) {
                          // Start from right side with rotation (like it's coming back)
                          newTopCard.style.transform =
                            "translate(150%, 0) rotate(30deg)";
                          newTopCard.style.opacity = "0";

                          // Animate to center
                          setTimeout(() => {
                            newTopCard.style.transform = "";
                            newTopCard.style.opacity = "";
                            newTopCard.style.transition =
                              "transform 300ms ease-out, opacity 300ms ease-out";

                            // Clear transition after animation
                            setTimeout(() => {
                              newTopCard.style.transition = "";
                            }, 300);
                          }, 10);
                        }
                      }, 10);
                    }
                  } else {
                    // Snap back to center
                    cardElement.style.transform = "";
                    cardElement.style.opacity = "";
                  }
                }

                document.removeEventListener("touchmove", handleTouchMove);
                document.removeEventListener("touchend", handleTouchEnd);
              };

              document.addEventListener("touchmove", handleTouchMove, {
                passive: false,
              });
              document.addEventListener("touchend", handleTouchEnd);
            }}
            onClick={() => {
              if (isTop) {
                console.log(`Clicked on ${card.title}`);
                onSectorChange(card.sector);
              }
            }}
          >
            <div
              className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 md:p-6 h-full relative overflow-hidden shadow-xl border-2 border-white/10 flex flex-col`}
            >
              {/* Character illustration area */}
              <div className="absolute bottom-0 right-0 w-20 h-20 md:w-24 md:h-24 opacity-20">
                <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 rounded-full"></div>
              </div>

              {/* Card content */}
              <div className="relative z-10 flex flex-col h-full">
                <div className="text-[10px] md:text-[9px] text-white/90 mb-1 md:mb-1.5 uppercase tracking-wider font-semibold">
                  {card.title}
                </div>
                <h3 className="text-lg md:text-base font-bold text-white mb-3 md:mb-3 leading-snug flex-grow">
                  {card.subtitle.split("\n").map((line, i) => (
                    <div key={i} className="hidden md:block">{line}</div>
                  ))}
                </h3>
                <Button
                  className={`bg-white ${card.buttonColor} hover:bg-gray-100 px-3 py-1.5 md:px-3 md:py-1 rounded-full text-xs md:text-[11px] font-semibold shadow-lg w-fit`}
                  onClick={() => {
                    if (isTop) {
                      const userId = localStorage.getItem('currentUserId');
                      const userEmail = localStorage.getItem('currentUserEmail');

                      if (!userId || !userEmail) {
                        console.log('🔒 User not authenticated, redirecting to login');
                        window.location.href = '/login';
                        return;
                      }

                      if (isPlaying) {
                        stopAudio();
                      } else {
                        fetchAndPlayContent(card.title, card.sector);
                      }
                    }
                  }}
                  disabled={isLoading && isTop}
                >
                  <div className="flex items-center gap-2">
                    {isTop && isLoading ? (
                      <RotateCcw className="w-4 h-4 animate-spin" />
                    ) : isTop && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>
                      {isTop && isLoading
                        ? "Generating..."
                        : isTop && isPlaying
                          ? "Pause"
                          : card.buttonText}
                    </span>
                  </div>
                </Button>
              </div>

              {/* Icon */}
              <div className="absolute top-2 right-2 md:top-1.5 md:right-1.5 text-xl md:text-lg filter drop-shadow-lg">
                {card.icon}
              </div>

              {/* Stack indicator for non-top cards */}
              {!isTop && (
                <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
import { format } from "date-fns";

import { apiRequest } from "@/lib/queryClient";

import {

  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";

function NiftyIndex() {
  const {
    data: marketData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/market-data"],
    refetchInterval: 3000, // Refresh every 3 seconds for live data
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading data</div>
        </CardContent>
      </Card>
    );
  }

  // Find NIFTY50 data from the response
  const niftyData = Array.isArray(marketData)
    ? marketData.find((item: any) => item.symbol === "NIFTY50")
    : null;

  if (!niftyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
