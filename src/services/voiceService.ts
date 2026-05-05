interface VoiceOptions {
  text: string;
  onStart?: () => void;
  onEnd?: () => void;
}

class VoiceService {
  private isAudioEnabled: boolean = true;
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

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
    if (!this.isAudioEnabled) {
      console.log('VoiceService: Audio is disabled.');
      return;
    }

    const env = (import.meta as any).env;
    const apiKey = env.VITE_ELEVENLABS_API_KEY || 'sk_e48f05b7c2ee56d8203fa277e15b212cdfd9667bf3bde213';
    const voiceId = env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpg8ndPBxc9MB';

    if (apiKey) {
      console.log('VoiceService: Attempting ElevenLabs speech...');
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

        if (!response.ok) throw new Error(`ElevenLabs API failed with status: ${response.status}`);

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
        console.warn('VoiceService: ElevenLabs failed, falling back to WebSpeech:', error);
      }
    }

    // Fallback: Web Speech API
    console.log('VoiceService: Using WebSpeech API fallback.');
    
    // Explicitly resume in case it's stuck
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = 'pt-BR';
    this.currentUtterance.rate = 0.95;
    this.currentUtterance.pitch = 0.9;

    const speakWithBestVoice = () => {
      if (!this.currentUtterance) return;

      // Ensure the engine is resumed
      window.speechSynthesis.resume();
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = ['Daniel', 'Guilherme', 'Google português do Brasil', 'Luciana', 'Neural'];
      const voice = voices.find(v => v.lang === 'pt-BR' && preferredVoices.some(p => v.name.includes(p))) || 
                    voices.find(v => v.lang.includes('pt-BR'));
      
      if (voice) {
        console.log('VoiceService: Selected voice:', voice.name);
        this.currentUtterance.voice = voice;
      }
      
      this.currentUtterance.onstart = () => onStart?.();
      this.currentUtterance.onend = () => {
        onEnd?.();
        this.currentUtterance = null;
      };
      this.currentUtterance.onerror = (e) => {
        console.error('VoiceService: Utterance error:', e);
        onEnd?.();
        this.currentUtterance = null;
      };

      window.speechSynthesis.speak(this.currentUtterance);
    };

    // Browsers load voices asynchronously
    if (window.speechSynthesis.getVoices().length > 0) {
      speakWithBestVoice();
    } else {
      const handleVoices = () => {
        if (window.speechSynthesis.getVoices().length > 0) {
          speakWithBestVoice();
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoices);
        }
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoices);
    }
  }
}

export const voiceService = new VoiceService();
