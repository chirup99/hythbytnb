import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapData {
  date: string;
  pnl: number;
  count: number;
}

interface PersonalHeatmapProps {
  data?: HeatmapData[];
}

const PersonalHeatmap = ({ data }: PersonalHeatmapProps) => {
  const demoData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 90 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (89 - i));
      return {
        date: date.toISOString().split('T')[0],
        pnl: Math.random() > 0.6 ? Math.random() * 2000 : (Math.random() > 0.5 ? -Math.random() * 1500 : 0),
        count: Math.floor(Math.random() * 5) + 1
      };
    });
  }, []);

  const heatmapData = data && data.length > 0 ? data : demoData;

  const getColor = (pnl: number) => {
    if (pnl > 1000) return 'bg-green-600';
    if (pnl > 500) return 'bg-green-500';
    if (pnl > 0) return 'bg-green-400';
    if (pnl === 0) return 'bg-gray-800';
    if (pnl > -500) return 'bg-red-400';
    if (pnl > -1000) return 'bg-red-500';
    return 'bg-red-600';
  };

  return (
    <div className="mt-6 border-t border-gray-800 pt-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        Trading Activity Heatmap (Last 90 Days)
      </h3>
      <div className="flex flex-wrap gap-1.5 p-3 bg-gray-950/40 rounded-lg border border-gray-800">
        <TooltipProvider>
          {heatmapData.map((day, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div 
                  className={`w-3.5 h-3.5 rounded-sm cursor-pointer transition-all hover:scale-150 hover:z-10 ${getColor(day.pnl)}`}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 border-gray-700 text-gray-100">
                <div className="text-xs p-1">
                  <p className="font-bold border-b border-gray-700 pb-1 mb-1">{day.date}</p>
                  <p className={day.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                    PnL: ₹{day.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-gray-400">Trades: {day.count}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span>Loss</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-red-600 rounded-sm" />
            <div className="w-2 h-2 bg-red-400 rounded-sm" />
            <div className="w-2 h-2 bg-gray-800 rounded-sm" />
            <div className="w-2 h-2 bg-green-400 rounded-sm" />
            <div className="w-2 h-2 bg-green-600 rounded-sm" />
          </div>
          <span>Profit</span>
        </div>
        <span>{heatmapData[0]?.date} — {heatmapData[heatmapData.length - 1]?.date}</span>
      </div>
    </div>
  );
};

export default PersonalHeatmap;
