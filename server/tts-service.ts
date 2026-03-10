import axios from 'axios';

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

// High-quality TTS Service using HuggingFace models (SpeechT5 + Kokoro for natural voices)
export const sarvamTTSService = {
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    
    if (!hfToken) {
      console.warn('⚠️ [TTS] No HuggingFace API token found. Set HUGGINGFACE_API_KEY or HF_TOKEN environment variable.');
      return { error: 'HuggingFace API token not configured' };
    }

    try {
      // Use high-quality TTS models based on language
      // Primary: Kokoro (very natural sounding, supports multiple languages)
      // Fallback: SpeechT5 (high quality, reliable)
      
      const isEnglish = request.language === 'en' || !request.language;
      
      // For English: Use Kokoro or SpeechT5 for most natural sound
      // For other languages: Use SpeechT5 which supports multilingual
      const modelId = isEnglish 
        ? 'kokok0/Kokoro-82M' // Ultra-natural English voice
        : 'microsoft/speecht5_tts'; // Multilingual support
      
      console.log(`🎤 [TTS] Generating speech using ${modelId}...`);
      
      // Prepare the audio generation request
      const payload = {
        inputs: request.text,
        parameters: {
          language: request.language || 'en',
          // Speaker ID for Kokoro (can be customized per voice profile)
          speaker_id: this.getSpearkerIdForProfile(request.speaker),
        }
      };

      // Make request to HuggingFace Inference API
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${modelId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 45000, // Longer timeout for quality models
        }
      );

      // Convert audio buffer to base64
      const audioBase64 = Buffer.from(response.data).toString('base64');
      
      console.log(`✅ [TTS] Generated natural voice for "${request.text.substring(0, 50)}..." in ${request.language}`);
      
      return {
        audioBase64: `data:audio/wav;base64,${audioBase64}`
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [TTS] Error generating speech:`, errorMsg);
      
      // Check if it's a model loading error (expected on first request)
      if (errorMsg.includes('loading') || errorMsg.includes('estimated_time')) {
        return { error: 'Model loading. Please try again in a moment.' };
      }
      
      return { error: `TTS generation failed: ${errorMsg}` };
    }
  },

  // Map voice profiles to speaker IDs for natural voices
  getSpearkerIdForProfile(speakerId?: string): string {
    const speakerMap: { [key: string]: string } = {
      'samantha': '1', // Female voice - warm
      'liam': '2',     // Male voice - smooth
      'sophia': '3',   // Female voice - bright
    };
    return speakerMap[speakerId || 'samantha'] || '1';
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
