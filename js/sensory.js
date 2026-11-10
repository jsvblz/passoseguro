/**
 * ============================================================================
 * PASSO SEGURO · MOTOR MULTISSENSORIAL (WEB AUDIO API, VOZ E HÁPTICO)
 * - Web Audio API: Sons sintetizados com tons de pitch e ondas distintos
 *   para corredores livres, gôndolas/seções, paredes/obstáculos e chegada.
 * - SpeechSynthesis & ARIA Live: Alternância inteligente entre leitor de tela
 *   do sistema (TalkBack/VoiceOver) e sintetizador interno do app.
 * - Navigator.vibrate: Padrões rítmicos distintos para orientação física.
 * ============================================================================
 */

window.SensoryEngine = {
  audioCtx: null,
  speechRate: 1.05,
  speechPitch: 1.0,
  soundEnabled: true,
  hapticEnabled: true,

  /**
   * Inicializa ou retoma o contexto da Web Audio API
   */
  initAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  },

  /**
   * Toca um som espacial sintetizado conforme o elemento tocado ou ação de rota:
   * - 'free': Corredor livre (Onda senoidal aguda suave - 560 Hz)
   * - 'shelf': Gôndola ou seção (Onda triangular média - 330 Hz)
   * - 'wall' | 'obstacle': Parede ou obstáculo (Dente-de-serra grave - 125 Hz)
   * - 'step': Passo concluído na rota (Pulso curto 680 Hz)
   * - 'turnRight': Curva à direita (Bipe ascendente 440 -> 620 Hz)
   * - 'turnLeft': Curva à esquerda (Bipe descendente 620 -> 440 Hz)
   * - 'arrival': Chegada ao produto/destino (Acorde maior ascendente)
   */
  playTone(kind) {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (kind === "free") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(560, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (kind === "shelf") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(330, now);
        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (kind === "wall" || kind === "obstacle") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(125, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.24);
      } else if (kind === "step") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(680, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (kind === "turnRight") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(620, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
        osc.start(now);
        osc.stop(now + 0.20);
      } else if (kind === "turnLeft") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.setValueAtTime(440, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
        osc.start(now);
        osc.stop(now + 0.20);
      } else if (kind === "arrival") {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const o = this.audioCtx.createOscillator();
          const g = this.audioCtx.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(freq, now + idx * 0.09);
          g.gain.setValueAtTime(0.14, now + idx * 0.09);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
          o.connect(g);
          g.connect(this.audioCtx.destination);
          o.start(now + idx * 0.09);
          o.stop(now + idx * 0.09 + 0.25);
        });
      }
    } catch (e) {
      // Silencia erros caso o navegador bloqueie áudio antes de gesto do usuário
    }
  },

  /**
   * Aciona padrões hápticos rítmicos distintos via navigator.vibrate
   */
  vibrate(patternName) {
    if (!this.hapticEnabled || !("vibrate" in navigator)) return;
    const patterns = {
      straight: [45],                    // Vibração curta contínua: mantenha linha reta
      turnRight: [65, 55, 65],           // 2 toques rápidos: vire à direita
      turnLeft: [65, 55, 65, 55, 65],    // 3 toques rápidos: vire à esquerda
      wall: [190, 60, 190],              // Alerta duplo forte: obstáculo ou parede
      shelfTouch: [30],                  // Pulso sutil: varredura de gôndola no mapa
      arrival: [450, 120, 450]           // Vibração longa: parar / você chegou ao destino
    };
    try {
      navigator.vibrate(patterns[patternName] || [45]);
    } catch (e) {}
  },

  /**
   * Anuncia mensagem via ARIA-LIVE (para TalkBack/VoiceOver) e SpeechSynthesisUtterance
   */
  announce(text, priority = "assertive", screenReaderMode = false) {
    if (!text) return;

    const liveId = priority === "assertive" ? "liveAssertive" : "livePolite";
    const liveEl = document.getElementById(liveId);
    if (liveEl) {
      liveEl.textContent = "";
      setTimeout(() => {
        liveEl.textContent = text;
      }, 40);
    }

    // Quando o modo Leitor de Tela do Sistema está ativo, não usa SpeechSynthesis
    // para evitar sobreposição de vozes com o TalkBack ou VoiceOver
    if (screenReaderMode) return;

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "pt-BR";
        utter.rate = this.speechRate;
        utter.pitch = this.speechPitch;
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }
  }
};

