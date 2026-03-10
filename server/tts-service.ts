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

// Sarvam 30B TTS Service using HuggingFace Inference API
export const sarvamTTSService = {
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    
    if (!hfToken) {
      console.warn('⚠️ [TTS] No HuggingFace API token found. Set HUGGINGFACE_API_KEY or HF_TOKEN environment variable.');
      return { error: 'HuggingFace API token not configured' };
    }

    try {
      // Use Sarvam 30B model via HuggingFace Inference API
      const modelId = 'sarvamai/Sarvam-30B';
      const payload = {
        inputs: request.text,
        parameters: {
          language: request.language || 'en',
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
          timeout: 30000,
        }
      );

      // Convert audio buffer to base64
      const audioBase64 = Buffer.from(response.data).toString('base64');
      
      console.log(`✅ [TTS] Generated speech for "${request.text.substring(0, 50)}..." in ${request.language}`);
      
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

  // Language support - Sarvam supports 8+ Indian languages + English
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
