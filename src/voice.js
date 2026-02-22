export function chooseVoice(voices) {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  const scoreVoice = (voice) => {
    const name = (voice.name || "").toLowerCase();
    const lang = (voice.lang || "").toLowerCase();
    let score = 0;

    if (lang.startsWith("en-us")) score += 6;
    else if (lang.startsWith("en")) score += 4;

    if (name.includes("natural") || name.includes("neural")) score += 10;
    if (name.includes("enhanced") || name.includes("premium") || name.includes("online")) score += 5;
    if (name.includes("google us english")) score += 5;
    if (name.includes("microsoft aria") || name.includes("microsoft guy")) score += 5;
    if (name.includes("samantha") || name.includes("ava") || name.includes("zira")) score += 2;
    if (voice.localService) score += 1;

    return score;
  };

  return voices.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
}

export function speakText(text, { voiceOn, preferredVoice }) {
  if (!voiceOn) return;
  if (!("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.86;
    utterance.pitch = 1.02;
    utterance.volume = 1;

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    } else {
      utterance.lang = "en-US";
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech synthesis may fail in restricted environments.
  }
}
