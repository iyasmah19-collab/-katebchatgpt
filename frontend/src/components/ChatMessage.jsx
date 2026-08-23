import React, { useMemo } from "react";
import { Sparkles } from "lucide-react";

/**
 * Parses an LLM markdown-ish reply into structured "blocks" that render as
 * vault-style cards (one card per numbered/bulleted point). Intro/outro paragraphs
 * that aren't numbered points are rendered as plain text above/below the cards.
 *
 * Supported point patterns (per paragraph, multi-line ok):
 *   "1. **Title**\n   Body..."
 *   "1) Title — body"
 *   "**Title**\n   Body..."     (treated as a card when followed by body lines)
 *   "- Title: body"
 *   "• Title: body"
 */
function parseReply(raw) {
  const text = (raw || "").trim();
  if (!text) return { intro: "", points: [], outro: "" };

  // Split into paragraphs by blank lines (preserve order).
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const points = [];
  const before = [];
  const after = [];
  let phase = "before"; // before -> points -> after

  // Regexes
  const reNumbered = /^(\d{1,3})[.)、\-]\s+(.+)$/s; // "1. ...", "1) ...", "1- ..."
  const reBoldHeading = /^\*\*([^*]+?)\*\*\s*[:：\-—]?\s*([\s\S]*)$/; // **Title** body...
  const reBullet = /^[•\-*]\s+(.+)$/s;
  const reTitleLineColon = /^([^\n:：]{3,80})[:：]\s+([\s\S]+)$/; // "Title: body" (single colon-led short title)

  function splitTitleBody(s) {
    const t = s.trim();
    // **Title** — body
    let m = t.match(reBoldHeading);
    if (m) return { title: m[1].trim(), body: m[2].trim() };
    // First-line title, rest body
    const idx = t.indexOf("\n");
    if (idx !== -1) {
      const head = t.slice(0, idx).trim();
      const body = t.slice(idx + 1).trim();
      if (head.length <= 120) return { title: head.replace(/[*]+/g, "").trim(), body };
    }
    // "Title: body" on a single line
    const m2 = t.match(reTitleLineColon);
    if (m2) return { title: m2[1].trim(), body: m2[2].trim() };
    // No clear title → use whole text as body, no title
    return { title: "", body: t };
  }

  for (const p of paragraphs) {
    let matched = false;

    // 1. Numbered point
    const mNum = p.match(reNumbered);
    if (mNum) {
      const n = parseInt(mNum[1], 10);
      const rest = mNum[2];
      const { title, body } = splitTitleBody(rest);
      points.push({ number: n, title, body });
      phase = "points";
      matched = true;
    }

    // 2. Bold-heading paragraph as a card (only treat as a point if we already started points OR it has a clear body)
    if (!matched && /^\*\*[^*]+\*\*/.test(p)) {
      const { title, body } = splitTitleBody(p);
      if (title && (body || phase === "points")) {
        points.push({ number: points.length + 1, title, body });
        phase = "points";
        matched = true;
      }
    }

    // 3. Bulleted point
    if (!matched) {
      const mBul = p.match(reBullet);
      if (mBul) {
        const { title, body } = splitTitleBody(mBul[1]);
        points.push({ number: points.length + 1, title, body });
        phase = "points";
        matched = true;
      }
    }

    if (!matched) {
      if (phase === "before") before.push(p);
      else after.push(p);
    }
  }

  // If we found 0 or 1 point only, treat the whole reply as a single plain bubble (no cards).
  if (points.length <= 1) {
    return { intro: text, points: [], outro: "" };
  }

  return {
    intro: before.join("\n\n"),
    points,
    outro: after.join("\n\n"),
  };
}

// Inline markdown: bold (**x**), italic (*x*), code (`x`)
function renderInline(text) {
  if (!text) return null;
  // Tokenize without nested support — good enough for LLM output.
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={`b${i++}`} className="text-white font-semibold">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith("`")) {
      parts.push(
        <code key={`c${i++}`} className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[12px]">
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(
        <em key={`i${i++}`} className="text-amber-200/90">
          {tok.slice(1, -1)}
        </em>
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// Render body with paragraphs and basic bullet support inside a card.
function renderBody(body) {
  if (!body) return null;
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line, i) => {
    const lineKey = `line-${i}-${line.slice(0, 24)}`;
    const mBul = line.match(/^[•\-*]\s+(.+)$/);
    if (mBul) {
      return (
        <li key={lineKey} className="flex gap-2 text-sm text-zinc-300 leading-relaxed" dir="auto">
          <span className="text-amber-400 mt-1 shrink-0">•</span>
          <span>{renderInline(mBul[1])}</span>
        </li>
      );
    }
    return (
      <p key={lineKey} className="text-sm text-zinc-300 leading-relaxed" dir="auto">
        {renderInline(line)}
      </p>
    );
  });
}

function PointCard({ point, fallbackIndex }) {
  const n = point.number ?? fallbackIndex;
  return (
    <div
      data-testid={`chat-point-card-${fallbackIndex}`}
      className="vault-card rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/40"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/25 to-amber-600/10 border border-amber-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(255,184,0,0.15)]">
          {point.number != null ? (
            <span className="text-amber-300 font-mono font-black text-sm">
              {String(n).padStart(2, "0")}
            </span>
          ) : (
            <Sparkles className="w-4 h-4 text-amber-300" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {point.title ? (
            <h4 className="font-bold text-white text-base leading-snug" dir="auto">
              {renderInline(point.title)}
            </h4>
          ) : null}
          {point.body ? (
            <div className="space-y-1.5">
              {renderBody(point.body)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ChatMessage({ role, content }) {
  const parsed = useMemo(
    () => (role === "assistant" ? parseReply(content) : null),
    [role, content]
  );

  if (role === "user") {
    return (
      <div
        className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-amber-400/15 border border-amber-400/30 text-amber-50"
        dir="auto"
      >
        {content}
      </div>
    );
  }

  // Assistant — vault-card layout when we detected ≥2 structured points
  if (parsed.points.length >= 2) {
    return (
      <div className="w-full max-w-[90%] space-y-3">
        {parsed.intro && (
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap px-1" dir="auto">
            {renderInline(parsed.intro)}
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {parsed.points.map((pt, i) => (
            <PointCard
              key={`pt-${pt.number ?? i}-${(pt.title || pt.body || "").slice(0, 16)}`}
              point={pt}
              fallbackIndex={i + 1}
            />
          ))}
        </div>
        {parsed.outro && (
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap px-1" dir="auto">
            {renderInline(parsed.outro)}
          </p>
        )}
      </div>
    );
  }

  // Single short reply — keep the legacy bubble but still apply inline markdown.
  return (
    <div
      className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-[#16161d] border border-white/5 text-zinc-100 whitespace-pre-wrap"
      dir="auto"
    >
      {renderInline(content)}
    </div>
  );
}
