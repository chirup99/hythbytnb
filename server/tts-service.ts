import { tts } from 'edge-tts';

export interface TTSRequest {
  text: string;
  language: string;
  speaker?: string;
}

export interface TTSResponse {
  audioUrl?: string;
  audioBase64?: string;
  error?: string;
}

// Free, open-source TTS Service using Edge TTS (Microsoft Edge text-to-speech)
export const sarvamTTSService = {
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      const voiceName = this.getVoiceNameForLanguage(request.language, request.speaker);
      
      console.log(`🎤 [TTS] Generating speech using Edge TTS voice: ${voiceName}...`);
      
      // Create text-to-speech request with edge-tts
      const audioBuffer = await tts({
        text: request.text,
        voice: voiceName,
        pitch: 0,
        rate: 0,
        volume: 100
      });

      if (!audioBuffer || audioBuffer.length === 0) {
        console.warn(`⚠️ [TTS] Empty audio buffer returned for text: "${request.text.substring(0, 50)}..."`);
        return { error: 'TTS generation returned empty audio' };
      }

      // Convert audio buffer to base64
      const audioBase64 = Buffer.isBuffer(audioBuffer) 
        ? audioBuffer.toString('base64')
        : Buffer.from(audioBuffer).toString('base64');
      
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

  // Map language codes to Edge TTS voice names (Microsoft Natural Voices)
  getVoiceNameForLanguage(language: string, speakerId?: string): string {
    const voiceMap: { [key: string]: string } = {
      'en': 'en-US-AriaNeural',           // English - Female (natural)
      'hi': 'hi-IN-MadhurNeural',         // Hindi - Male
      'bn': 'bn-IN-BashkarNeural',        // Bengali - Male
      'ta': 'ta-IN-ValluvarNeural',       // Tamil - Male
      'te': 'te-IN-MohanNeural',          // Telugu - Male
      'mr': 'mr-IN-ManoharNeural',        // Marathi - Male
      'gu': 'gu-IN-DhwaniNeural',         // Gujarati - Female
      'kn': 'kn-IN-GaranNeural',          // Kannada - Male
    };
    
    // Override with speaker preference if specified
    const speakerVoiceMap: { [key: string]: string } = {
      'samantha': 'en-US-AriaNeural',      // Female
      'liam': 'en-US-GuyNeural',           // Male
      'sophia': 'en-US-AvaNeural',         // Female
    };
    
    if (speakerId && speakerVoiceMap[speakerId]) {
      return speakerVoiceMap[speakerId];
    }
    
    return voiceMap[language] || 'en-US-AriaNeural'; // Default to English female
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
  ]
};
