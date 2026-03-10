import { tts } from 'edge-tts';

export interface TTSRequest {
  text: string;
  language: string;
  speaker?: string;
  speed?: number;
}

export interface TTSResponse {
  audioUrl?: string;
  audioBase64?: string;
  error?: string;
}

// Free, open-source TTS Service using Edge TTS (Microsoft Bing text-to-speech)
// Enhanced with OpenAI-Edge-TTS compatible voice mapping for perfect voice quality
export const sarvamTTSService = {
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      const voiceName = this.getVoiceNameForLanguage(request.language, request.speaker);
      const speed = request.speed || 1.0;
      
      // Convert speed (0.25-4.0) to SSML rate format (-100% to +100%)
      const speedRate = this.convertSpeedToRate(speed);
      
      console.log(`🎤 [TTS] Generating speech using Edge TTS voice: ${voiceName} at ${speedRate}...`);
      
      // Use edge-tts to generate audio with speed adjustment
      const audioBuffer = await tts(request.text, {
        voice: voiceName,
        rate: speedRate,    // speed adjustment
        pitch: '+0Hz',      // normal pitch
        volume: '+0%'       // normal volume
      });

      if (!audioBuffer || audioBuffer.length === 0) {
        console.warn(`⚠️ [TTS] Empty audio buffer returned for text: "${request.text.substring(0, 50)}..."`);
        return { error: 'TTS generation returned empty audio' };
      }

      // Convert audio buffer to base64
      const audioBase64 = audioBuffer.toString('base64');
      
      console.log(`✅ [TTS] Generated natural voice for "${request.text.substring(0, 50)}..." using ${voiceName}`);
      
      return {
        audioBase64: `data:audio/mpeg;base64,${audioBase64}`
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [TTS] Error generating speech:`, errorMsg);
      return { error: `TTS generation failed: ${errorMsg}` };
    }
  },

  // Convert playback speed (0.25-4.0) to SSML rate format (-100% to +100%)
  convertSpeedToRate(speed: number): string {
    if (speed === 1.0) return '+0%';
    const rate = Math.round((speed - 1.0) * 100);
    return rate >= 0 ? `+${rate}%` : `${rate}%`;
  },

  // Enhanced voice mapping from OpenAI-Edge-TTS for premium quality voices
  // Maps speaker profiles to the most natural and distinct edge-tts voices
  getVoiceNameForLanguage(language: string, speakerId?: string): string {
    // OpenAI-Edge-TTS compatible voice mapping for premium quality
    // These are the best natural-sounding voices from edge-tts
    const openaiVoiceMapping: { [key: string]: string } = {
      // OpenAI voice equivalents (premium quality)
      'alloy': 'en-US-JennyNeural',        // Female, young professional
      'ash': 'en-US-AndrewNeural',         // Male, young professional
      'ballad': 'en-GB-ThomasNeural',      // British male, classic
      'coral': 'en-AU-NatashaNeural',      // Australian female, warm
      'echo': 'en-US-GuyNeural',           // Male, conversational
      'fable': 'en-GB-SoniaNeural',        // British female, storyteller
      'nova': 'en-US-AriaNeural',          // Female, confident
      'onyx': 'en-US-EricNeural',          // Male, professional
      'sage': 'en-US-JennyNeural',         // Female, wise
      'shimmer': 'en-US-EmmaNeural',       // Female, bright & energetic
      'verse': 'en-US-BrianNeural',        // Male, deep & warm
    };
    
    // Speaker profile mapping to premium voices
    const speakerVoiceMap: { [key: string]: string } = {
      'samantha': 'en-US-EmmaNeural',      // Female, bright & energetic (shimmer)
      'liam': 'en-US-EricNeural',          // Male, professional & warm (onyx)
      'sophia': 'en-US-AriaNeural',        // Female, confident & clear (nova)
    };
    
    // If speaker is specified, use speaker mapping
    if (speakerId && speakerVoiceMap[speakerId.toLowerCase()]) {
      return speakerVoiceMap[speakerId.toLowerCase()];
    }

    // Language-specific voice mapping for Indian languages + English
    const languageVoiceMap: { [key: string]: string } = {
      'en': 'en-US-AriaNeural',            // English - Female (confident)
      'hi': 'hi-IN-MadhurNeural',          // Hindi - Male (natural)
      'bn': 'bn-IN-BashkarNeural',         // Bengali - Male (natural)
      'ta': 'ta-IN-ValluvarNeural',        // Tamil - Male (natural)
      'te': 'te-IN-MohanNeural',           // Telugu - Male (natural)
      'mr': 'mr-IN-ManoharNeural',         // Marathi - Male (natural)
      'gu': 'gu-IN-DhwaniNeural',          // Gujarati - Female (natural)
      'kn': 'kn-IN-GaranNeural',           // Kannada - Male (natural)
    };
    
    return languageVoiceMap[language] || 'en-US-AriaNeural'; // Default to confident female
  },

  // Language support - 8+ Indian languages + English with natural voices
  supportedLanguages: [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  ],

  // Available voice profiles with OpenAI-Edge-TTS compatible naming
  voiceProfiles: [
    {
      id: 'samantha',
      name: 'Samantha',
      description: 'Female, bright & energetic',
      voice: 'en-US-EmmaNeural'
    },
    {
      id: 'liam',
      name: 'Liam',
      description: 'Male, professional & warm',
      voice: 'en-US-EricNeural'
    },
    {
      id: 'sophia',
      name: 'Sophia',
      description: 'Female, confident & clear',
      voice: 'en-US-AriaNeural'
    }
  ]
};
