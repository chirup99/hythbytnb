import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, RefreshCw, Mail, Clock, Database, Radio } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SigninDataRecord {
  userId: string;
  email: string;
  signupDate: string;
  lastUpdated?: string;
}

interface SigninDataResponse {
  success: boolean;
  recordsFound: number;
  source: string;
  data: SigninDataRecord[];
}

export function SigninDataWindow() {
  return null;
}

function LivestreamAdsControl() {
  const [streamLink, setStreamLink] = useState('');
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Load saved URL from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('youtube_banner_url');
    if (savedUrl) {
      setActiveUrl(savedUrl);
      setStreamLink(savedUrl);
    }
  }, []);

  const handleConnect = () => {
    if (!streamLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube link",
        variant: "destructive"
      });
      return;
    }

    // Convert to embed URL
    let embedUrl = streamLink;
    if (streamLink.includes('youtube.com/watch?v=')) {
      const videoId = streamLink.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    } else if (streamLink.includes('youtu.be/')) {
      const videoId = streamLink.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    } else if (!streamLink.includes('/embed/')) {
      embedUrl = `${streamLink}${streamLink.includes('?') ? '&' : '?'}enablejsapi=1`;
    }

    // Save to localStorage
    localStorage.setItem('youtube_banner_url', embedUrl);
    setActiveUrl(embedUrl);

    // Notify banner to update
    window.dispatchEvent(new CustomEvent('livestream-url-updated', { 
      detail: { url: embedUrl } 
    }));

    toast({
      title: "✅ Connected",
      description: "YouTube video is now playing on Social Feed banner!",
    });
  };

  const handleClear = () => {
    localStorage.removeItem('youtube_banner_url');
    setStreamLink('');
    setActiveUrl(null);
    
    window.dispatchEvent(new CustomEvent('livestream-url-updated', { 
      detail: { url: '' } 
    }));

    toast({
      title: "Cleared",
      description: "Banner reset to default",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-5 w-5" />
          Livestream Ads
        </CardTitle>
        <CardDescription>Insert YouTube link to display on Social Feed banner</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">YouTube Link</label>
          <Input 
            type="text" 
            placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
            value={streamLink}
            onChange={(e) => setStreamLink(e.target.value)}
            data-testid="input-stream-link"
          />

          <p className="text-xs text-muted-foreground">
            Paste any YouTube URL (watch, embed, or short link)
          </p>
        </div>

        {activeUrl && (
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-400 font-medium">
              ✓ Active Banner URL
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 truncate mt-1">
              {activeUrl}
            </p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            onClick={handleConnect}
            data-testid="button-connect-stream"
          >
            Connect
          </Button>
          {activeUrl && (
            <Button 
              variant="outline"
              onClick={handleClear}
              data-testid="button-clear-stream"
            >
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}