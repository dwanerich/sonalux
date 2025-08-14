import { useCallback, useState } from "react";

/**
 * Wildcard toggle + remix payload mutator.
 * Returns:
 *   { on, toggle, applyToPayload, badge }
 *
 * Usage:
 *   const wildcard = useWildcard();
 *   const payload = wildcard.applyToPayload({ prompt, moods, ... });
 */
export default function useWildcard() {
  const [on, setOn] = useState(false);

  const toggle = useCallback(() => setOn((v) => !v), []);
  const badge = on ? "Wildcard: ON" : "Wildcard: OFF";

  // Mutates a submit payload in tasteful, bounded ways
  const applyToPayload = useCallback(
    (payload) => {
      if (!on) return payload;

      const out = { ...payload };

      // 1) Prompt spice (light, never destructive)
      if (typeof out.prompt === "string") {
        const spices = [
          "with syncopated drum accents",
          "subtle tape saturation",
          "wider stereo field in chorus",
          "ghost-note hi-hats",
          "analog-style glue on bus",
          "call-and-response adlibs",
          "late-night club sheen",
        ];
        const pick = spices[Math.floor(Math.random() * spices.length)];
        out.prompt = `${out.prompt.trim()} — ${pick}`;
      }

      // 2) Mood nudge (adds, doesn’t replace)
      if (Array.isArray(out.moods)) {
        const extras = ["Gritty", "Dreamy", "Groove", "Epic", "Hype", "Minimal"];
        const add = extras[Math.floor(Math.random() * extras.length)];
        if (!out.moods.includes(add)) out.moods = [...out.moods, add];
      }

      // 3) Energy bias (tiny)
      if (out.energy) {
        const map = { low: "medium", medium: Math.random() > 0.5 ? "low" : "high", high: "medium" };
        out.energy = map[out.energy] || out.energy;
      }

      // 4) Quality preset nudge (optional)
      out.quality = out.quality || "NORMAL";
      if (Math.random() > 0.7) out.quality = "HIGH";

      return out;
    },
    [on]
  );

  return { on, toggle, applyToPayload, badge };
}
