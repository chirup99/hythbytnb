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
      
      // Convert pitch adjustment (0.5-2.0) to Hz format
      let pitchHz = '+0Hz';
      if (request.pitch && request.pitch !== 1.0) {
        const pitchShift = (request.pitch - 1.0) * 50; // Scale to Hz
        pitchHz = pitchShift >= 0 ? `+${Math.round(pitchShift)}Hz` : `${Math.round(pitchShift)}Hz`;
      }
      
      // Use edge-tts to generate audio with speed and pitch adjustment
      const audioBuffer = await tts(request.text, {
        voice: voiceName,
        rate: speedRate,    // speed adjustment
        pitch: pitchHz,      // pitch adjustment
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

  // All available Microsoft Edge TTS voices grouped by language
  voicesByLanguage: {
    'en': [
      { name: 'Aria', voice: 'en-US-AriaNeural', gender: 'Female', accent: 'US', description: 'Confident & clear' },
      { name: 'Emma', voice: 'en-US-EmmaNeural', gender: 'Female', accent: 'US', description: 'Bright & energetic' },
      { name: 'Jenny', voice: 'en-US-JennyNeural', gender: 'Female', accent: 'US', description: 'Young professional' },
      { name: 'Eric', voice: 'en-US-EricNeural', gender: 'Male', accent: 'US', description: 'Professional & warm' },
      { name: 'Guy', voice: 'en-US-GuyNeural', gender: 'Male', accent: 'US', description: 'Conversational' },
      { name: 'Brian', voice: 'en-US-BrianNeural', gender: 'Male', accent: 'US', description: 'Deep & warm' },
      { name: 'Andrew', voice: 'en-US-AndrewNeural', gender: 'Male', accent: 'US', description: 'Young professional' },
      { name: 'Thomas', voice: 'en-GB-ThomasNeural', gender: 'Male', accent: 'British', description: 'Classic British' },
      { name: 'Sonia', voice: 'en-GB-SoniaNeural', gender: 'Female', accent: 'British', description: 'Storyteller' },
      { name: 'Natasha', voice: 'en-AU-NatashaNeural', gender: 'Female', accent: 'Australian', description: 'Warm & friendly' }
    ],
    'hi': [
      { name: 'Madhur', voice: 'hi-IN-MadhurNeural', gender: 'Male', accent: 'India', description: 'Natural Indian accent' },
      { name: 'Gaurav', voice: 'hi-IN-GauravNeural', gender: 'Male', accent: 'India', description: 'Clear articulation' }
    ],
    'bn': [
      { name: 'Bashkar', voice: 'bn-IN-BashkarNeural', gender: 'Male', accent: 'India', description: 'Natural Bengali' }
    ],
    'ta': [
      { name: 'Valluvar', voice: 'ta-IN-ValluvarNeural', gender: 'Male', accent: 'India', description: 'Natural Tamil' }
    ],
    'te': [
      { name: 'Mohan', voice: 'te-IN-MohanNeural', gender: 'Male', accent: 'India', description: 'Natural Telugu' }
    ],
    'mr': [
      { name: 'Manohar', voice: 'mr-IN-ManoharNeural', gender: 'Male', accent: 'India', description: 'Natural Marathi' }
    ],
    'gu': [
      { name: 'Dhwani', voice: 'gu-IN-DhwaniNeural', gender: 'Female', accent: 'India', description: 'Natural Gujarati' }
    ],
    'kn': [
      { name: 'Garan', voice: 'kn-IN-GaranNeural', gender: 'Male', accent: 'India', description: 'Natural Kannada' }
    ]
  }
};
