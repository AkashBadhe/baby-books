import { describe, expect, it } from "vitest";
import { chooseVoice } from "../src/voice.js";

describe("chooseVoice", () => {
  it("prefers neural/natural en-US voices", () => {
    const voices = [
      { name: "English Basic", lang: "en-GB", localService: true },
      { name: "Google US English", lang: "en-US", localService: true },
      { name: "Microsoft Aria Online (Natural)", lang: "en-US", localService: false },
    ];

    const selected = chooseVoice(voices);
    expect(selected.name).toContain("Natural");
  });

  it("returns null when no voices exist", () => {
    expect(chooseVoice([])).toBeNull();
  });
});
