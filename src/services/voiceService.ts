interface VoiceOptions {
  text: string;
  onStart?: () => void;
  onEnd?: () => void;
}

class VoiceService {
  private isAudioEnabled: boolean = true;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    const saved = localStorage.getItem('jarvis_sound_enabled');
    this.isAudioEnabled = saved !== null ? JSON.parse(saved) : true;
  }

  setAudioEnabled(enabled: boolean) {
    this.isAudioEnabled = enabled;
    localStorage.setItem('jarvis_sound_enabled', JSON.stringify(enabled));
    if (!enabled) this.stop();
  }

  getAudioEnabled() {
    return this.isAudioEnabled;
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    window.speechSynthesis.cancel();
  }

  async speak({ text, onStart, onEnd }: VoiceOptions) {
    if (!this.isAudioEnabled) return;

    const env = (import.meta as any).env;
    const apiKey = env.VITE_ELEVENLABS_API_KEY;
    const voiceId = env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpg8ndPBxc9MB'; // "George" - Professional & Confident

    if (apiKey) {
      try {
        onStart?.();
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true
            }
          }),
        });

        if (!response.ok) throw new Error('ElevenLabs API failed');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        this.stop();
        this.currentAudio = new Audio(url);
        this.currentAudio.onended = () => {
          onEnd?.();
          URL.revokeObjectURL(url);
        };
        await this.currentAudio.play();
        return;
      } catch (error) {
        console.warn('ElevenLabs fallback to WebSpeech:', error);
      }
    }

    // Fallback: Web Speech API (Optimized)
    this.stop();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = ['Daniel', 'Guilherme', 'Google português do Brasil', 'Luciana'];
    const voice = voices.find(v => v.lang === 'pt-BR' && preferredVoices.some(p => v.name.includes(p))) || 
                  voices.find(v => v.lang.includes('pt-BR'));
    
    if (voice) utterance.voice = voice;
    
    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  }
}

export const voiceService = new VoiceService();
