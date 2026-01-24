import { useState, useEffect } from 'react';
import type { SelectedTextSnippet } from '@/contexts/AudioModeContext';
import { useAudioMode } from '@/contexts/AudioModeContext';
import { X, Radio } from 'lucide-react';

interface AudioSelectedPostsPreviewProps {
  snippets: SelectedTextSnippet[];
  onTap: () => void;
  onDeactivate: () => void;
}

interface CardWithColor extends SelectedTextSnippet {
  colorIndex: number;
}

export function AudioSelectedPostsPreview({ snippets, onTap, onDeactivate }: AudioSelectedPostsPreviewProps) {
  const [cards, setCards] = useState<CardWithColor[]>([]);
  const [nextColorIndex, setNextColorIndex] = useState(0);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const { isAudioMode } = useAudioMode();

  useEffect(() => {
    const currentIds = cards.map(c => c.id);
    const newSnippetIds = snippets.map(s => s.id);
    
    const addedSnippets = snippets.filter(s => !currentIds.includes(s.id));
    
    if (addedSnippets.length > 0) {
      setIsAnimatingIn(true);
      
      const newCards: CardWithColor[] = addedSnippets.map((snippet, idx) => ({
        ...snippet,
        colorIndex: (nextColorIndex + idx) % 5
      }));
      
      setCards(prev => [...newCards, ...prev.filter(c => newSnippetIds.includes(c.id))]);
      setNextColorIndex((nextColorIndex + addedSnippets.length) % 5);
      
      setTimeout(() => setIsAnimatingIn(false), 600);
    } else if (currentIds.length !== newSnippetIds.length) {
      setCards(prev => prev.filter(c => newSnippetIds.includes(c.id)));
    }
  }, [snippets]);

  const getGradient = (idx: number) => {
    const gradients = [
      { from: 'from-blue-500', to: 'to-blue-600' },
      { from: 'from-purple-500', to: 'to-purple-600' },
      { from: 'from-pink-500', to: 'to-pink-600' },
      { from: 'from-indigo-500', to: 'to-indigo-600' },
      { from: 'from-cyan-500', to: 'to-cyan-600' },
    ];
    return gradients[idx % gradients.length];
  };

  const hasNoSnippets = cards.length === 0;

  if (!isAudioMode) return null;

  return (
    <div 
      className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-2 transition-all duration-300 md:bottom-4"
      data-testid="audio-selected-preview"
    >
      {/* Tape/Open Button */}
      {!hasNoSnippets && (
        <div 
          onClick={onTap}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold whitespace-nowrap">Tape {cards.length}</span>
        </div>
      )}

      {/* Close/Deactivate Card */}
      <div className="relative w-16 h-20" style={{ perspective: '1000px' }}>
        <div 
          className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
          onClick={onDeactivate}
        >
          <div className="flex flex-col items-center gap-1">
            <X className="w-6 h-6 text-red-500" />
            <span className="text-[8px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none">Close</span>
          </div>
        </div>

        {/* Stacked cards behind the close button if snippets exist */}
        {!hasNoSnippets && (
          cards.slice(0, 3).map((card, index) => {
            const gradient = getGradient(card.colorIndex);
            // Offset them behind the main close card
            const rotationDeg = (index + 1) * 4;
            const yOffset = (index + 1) * 4;
            const scale = 1 - ((index + 1) * 0.05);
            const xOffset = (index + 1) * -2;
            
            const stackTransform = `translateY(${yOffset}px) translateX(${xOffset}px) rotate(${rotationDeg}deg) scale(${scale})`;
            const stackOpacity = 0.5 - (index * 0.1);
            const stackZ = - (index + 1) * 10;

            return (
              <div
                key={card.id}
                className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.to} rounded-lg shadow-sm border border-white/20 dark:border-gray-800 pointer-events-none`}
                style={{
                  transform: stackTransform,
                  opacity: stackOpacity,
                  zIndex: stackZ,
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
