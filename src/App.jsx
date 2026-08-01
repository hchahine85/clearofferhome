import { useState, useEffect } from "react";

// ─────────────────────────────────────────────
// ClearOffer Home — iOS-style redesign
// Pages: Home · About · Contact · Estimate flow
// ─────────────────────────────────────────────

const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;
const AIRTABLE_BASE = "appuUlvNaPDNTtjUV";
const AIRTABLE_TABLE = "tblegcH03z8ZVjYQh";

// iOS-inspired design tokens
const T = {
  bg: "#FFFFFF",
  bgSoft: "#F5F5F7",
  text: "#1D1D1F",
  muted: "#86868B",
  blue: "#0071E3",
  blueDark: "#0051A2",
  green: "#34C759",
  border: "#E5E5EA",
  cardShadow: "0 4px 24px rgba(0,0,0,0.06)",
  font: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const CONDITIONS = [
  { id: "excellent", label: "Excellent", desc: "Move-in ready, recently updated" },
  { id: "good", label: "Good", desc: "Well maintained, minor touch-ups" },
  { id: "fair", label: "Fair", desc: "Livable but dated, needs some work" },
  { id: "poor", label: "Needs Work", desc: "Major repairs or renovation needed" },
];

const REASONS = [
  "Just curious about value",
  "Relocating / job change",
  "Inherited this property",
  "Tired of being a landlord",
  "Behind on payments",
  "Divorce / life change",
  "Property needs too much work",
  "Other",
];

const TIMELINES = [
  { id: "asap", label: "As soon as possible", desc: "7–14 days" },
  { id: "soon", label: "I have some time", desc: "30–60 days" },
  { id: "exploring", label: "Just exploring", desc: "No rush" },
];

const BONUSES = [
  { id: "cleanout", icon: "🗑️", title: "Free Cleanout", desc: "Leave anything you don't want. Furniture, boxes, everything — we handle it." },
  { id: "moving", icon: "🚛", title: "Moving Credit", desc: "Up to $1,500 toward your move or a storage POD in your driveway." },
  { id: "grace", icon: "🏠", title: "Stay 14 Days After Closing", desc: "Get paid at closing, move out on your schedule. No rush." },
];

const LOADING_STEPS = [
  "Locating your property…",
  "Pulling neighborhood comparables…",
  "Analyzing property condition…",
  "Calculating your cash offer…",
];

// ── Shared UI pieces ─────────────────────────

function Button({ children, onClick, variant = "primary", size = "lg", style = {}, disabled }) {
  const base = {
    fontFamily: T.font,
    fontWeight: 600,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    borderRadius: 980,
    transition: "all 0.2s ease",
    fontSize: size === "lg" ? 17 : 15,
    padding: size === "lg" ? "14px 32px" : "10px 22px",
  };
  const variants = {
    primary: { background: T.blue, color: "#fff" },
    secondary: { background: T.bgSoft, color: T.text },
    ghost: { background: "transparent", color: T.blue },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => { if (!disabled && variant === "primary") e.target.style.background = T.blueDark; }}
      onMouseLeave={(e) => { if (variant === "primary") e.target.style.background = T.blue; }}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, half }) {
  return (
    <div style={{ flex: half ? "1 1 45%" : "1 1 100%", minWidth: half ? 140 : "auto" }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 6, fontFamily: T.font }}>{label}</label>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", boxSizing: "border-box", fontFamily: T.font, fontSize: 17,
          padding: "13px 16px", borderRadius: 12, border: `1px solid ${T.border}`,
          background: T.bgSoft, color: T.text, outline: "none", transition: "border 0.2s, background 0.2s",
        }}
        onFocus={(e) => { e.target.style.border = `1px solid ${T.blue}`; e.target.style.background = "#fff"; }}
        onBlur={(e) => { e.target.style.border = `1px solid ${T.border}`; e.target.style.background = T.bgSoft; }}
      />
    </div>
  );
}

function Section({ children, soft, style = {} }) {
  return (
    <section style={{ background: soft ? T.bgSoft : T.bg, padding: "80px 24px", ...style }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

// ── Navigation ───────────────────────────────

function Nav({ page, go }) {
  const links = [
    { id: "home", label: "Home" },
    { id: "about", label: "About Us" },
    { id: "contact", label: "Contact" },
  ];
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        maxWidth: 1000, margin: "0 auto", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 56,
      }}>
        <div onClick={() => go("home")} style={{ cursor: "pointer", fontFamily: T.font, fontWeight: 700, fontSize: 19, color: T.text }}>
          ClearOffer <span style={{ color: T.blue }}>Home</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {links.map((l) => (
            <span key={l.id} onClick={() => go(l.id)} style={{
              fontFamily: T.font, fontSize: 15, padding: "8px 14px", borderRadius: 980, cursor: "pointer",
              color: page === l.id ? T.text : T.muted, fontWeight: page === l.id ? 600 : 400,
              background: page === l.id ? T.bgSoft : "transparent", transition: "all 0.2s",
            }}>{l.label}</span>
          ))}
          <Button size="sm" onClick={() => go("estimate")}>Get My Offer</Button>
        </div>
      </div>
    </nav>
  );
}

// ── Home Page ────────────────────────────────

function HomePage({ go }) {
  return (
    <>
      {/* Hero */}
      <Section style={{ padding: "110px 24px 90px", textAlign: "center" }}>
        <h1 style={{ fontFamily: T.font, fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 700, letterSpacing: "-0.02em", color: T.text, margin: 0, lineHeight: 1.1 }}>
          Know what your home<br />is worth. <span style={{ color: T.blue }}>In 60 seconds.</span>
        </h1>
        <p style={{ fontFamily: T.font, fontSize: 21, color: T.muted, maxWidth: 560, margin: "24px auto 36px", lineHeight: 1.5 }}>
          Get a real cash offer estimate for your home as-is. No agents, no phone calls, no showings — and no obligation.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Button onClick={() => go("estimate")}>Get My Cash Offer</Button>
          <Button variant="secondary" onClick={() => go("about")}>How It Works</Button>
        </div>
        <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, marginTop: 20 }}>
          Free · Private · No commitment
        </p>
      </Section>

      {/* How it works */}
      <Section soft>
        <h2 style={{ fontFamily: T.font, fontSize: 34, fontWeight: 700, textAlign: "center", color: T.text, margin: "0 0 12px", letterSpacing: "-0.01em" }}>
          Selling, simplified.
        </h2>
        <p style={{ fontFamily: T.font, fontSize: 17, color: T.muted, textAlign: "center", margin: "0 0 48px" }}>
          Three steps. No pressure at any of them.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {[
            { n: "1", title: "Tell us about your home", desc: "Answer a few quick questions and add photos if you'd like. Takes about a minute." },
            { n: "2", title: "Get your instant estimate", desc: "Our valuation engine analyzes local comparables and condition to give you a real cash range — like a trade-in appraisal, but for your house." },
            { n: "3", title: "Decide on your timeline", desc: "Like your number? Schedule a quick video walkthrough for a firm written offer. Not ready? No one will pressure you." },
          ].map((s) => (
            <div key={s.n} style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: T.cardShadow }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: T.blue, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.font, fontWeight: 700, fontSize: 18, marginBottom: 18,
              }}>{s.n}</div>
              <h3 style={{ fontFamily: T.font, fontSize: 20, fontWeight: 600, color: T.text, margin: "0 0 8px" }}>{s.title}</h3>
              <p style={{ fontFamily: T.font, fontSize: 15, color: T.muted, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Why us */}
      <Section>
        <h2 style={{ fontFamily: T.font, fontSize: 34, fontWeight: 700, textAlign: "center", color: T.text, margin: "0 0 48px", letterSpacing: "-0.01em" }}>
          Why homeowners choose us
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
          {[
            { icon: "💰", title: "Top dollar, as-is", desc: "We're Southern California investors who pay competitive prices for homes in any condition. No repairs, no cleaning, no staging." },
            { icon: "🔍", title: "Transparent process", desc: "You see the math behind your offer. No hidden fees, no commissions, no surprise deductions at closing." },
            { icon: "🏗️", title: "Real expertise", desc: "Our team includes construction engineers and market specialists — your offer is based on real repair costs, not guesswork." },
            { icon: "🔒", title: "Completely private", desc: "No signs in your yard, no open houses, no neighbors knowing your business. Everything happens on your terms." },
            { icon: "⚡", title: "Close on your schedule", desc: "14 days or 90 days — you pick the closing date. We work around your life, not the other way around." },
            { icon: "🤝", title: "No pressure, ever", desc: "Your estimate is free and there's zero obligation. Take your time, compare your options, decide what's right for you." },
          ].map((f) => (
            <div key={f.title} style={{ padding: "8px 4px" }}>
              <div style={{ fontSize: 34, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontFamily: T.font, fontSize: 19, fontWeight: 600, color: T.text, margin: "0 0 6px" }}>{f.title}</h3>
              <p style={{ fontFamily: T.font, fontSize: 15, color: T.muted, lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Bottom CTA */}
      <Section soft style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: T.font, fontSize: 34, fontWeight: 700, color: T.text, margin: "0 0 14px", letterSpacing: "-0.01em" }}>
          Curious what you'd get?
        </h2>
        <p style={{ fontFamily: T.font, fontSize: 17, color: T.muted, margin: "0 0 30px" }}>
          Find out in about a minute. It costs nothing and no one will call you unless you ask.
        </p>
        <Button onClick={() => go("estimate")}>Get My Cash Offer</Button>
      </Section>
    </>
  );
}

// ── About Page ───────────────────────────────

function AboutPage({ go }) {
  return (
    <>
      <Section style={{ padding: "90px 24px 60px", textAlign: "center" }}>
        <h1 style={{ fontFamily: T.font, fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.02em" }}>
          We buy homes the way<br />it <span style={{ color: T.blue }}>should</span> work.
        </h1>
        <p style={{ fontFamily: T.font, fontSize: 19, color: T.muted, maxWidth: 620, margin: "22px auto 0", lineHeight: 1.6 }}>
          ClearOffer Home is a Southern California real estate investment team built on a simple idea: selling your home for cash shouldn't feel shady, pushy, or embarrassing.
        </p>
      </Section>

      <Section soft>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontFamily: T.font, fontSize: 28, fontWeight: 700, color: T.text, margin: "0 0 16px" }}>Our story</h2>
          <p style={{ fontFamily: T.font, fontSize: 17, color: T.text, lineHeight: 1.7, margin: "0 0 16px" }}>
            We started ClearOffer Home after years in the mortgage and real estate world, watching homeowners get bombarded with lowball calls, misleading postcards, and "We Buy Ugly Houses" signs that made asking for help feel like something to be ashamed of.
          </p>
          <p style={{ fontFamily: T.font, fontSize: 17, color: T.text, lineHeight: 1.7, margin: "0 0 16px" }}>
            We flipped the model. Instead of chasing you, we built a tool that lets you find out what your home is worth privately, instantly, and on your own terms — the same way you'd get an online appraisal for your car. If the number works for you, we'll make it real. If it doesn't, no one bothers you.
          </p>
          <p style={{ fontFamily: T.font, fontSize: 17, color: T.text, lineHeight: 1.7, margin: 0 }}>
            We're investors — we buy homes as-is, with our own process, and close fast. And because our team includes people from mortgage lending, construction engineering, and architecture, our offers are grounded in real numbers, not guesses designed to lowball you.
          </p>
        </div>
      </Section>

      <Section>
        <h2 style={{ fontFamily: T.font, fontSize: 28, fontWeight: 700, color: T.text, textAlign: "center", margin: "0 0 40px" }}>
          What we stand for
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {[
            { title: "Transparency first", desc: "You'll always see how we arrived at your number — market value, repair estimates, and our margin. No black boxes." },
            { title: "Respect for your situation", desc: "Inherited property, tough finances, tired of tenants — whatever brought you here, you'll be treated like a person, not a lead." },
            { title: "Local, focused, accountable", desc: "We work exclusively in Southern California. We know these neighborhoods because we live and work in them." },
          ].map((v) => (
            <div key={v.title} style={{ background: T.bgSoft, borderRadius: 20, padding: 30 }}>
              <h3 style={{ fontFamily: T.font, fontSize: 19, fontWeight: 600, color: T.text, margin: "0 0 8px" }}>{v.title}</h3>
              <p style={{ fontFamily: T.font, fontSize: 15, color: T.muted, lineHeight: 1.55, margin: 0 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section soft style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: T.font, fontSize: 30, fontWeight: 700, color: T.text, margin: "0 0 14px" }}>
          See what your home is worth
        </h2>
        <Button onClick={() => go("estimate")}>Get My Cash Offer</Button>
      </Section>
    </>
  );
}

// ── Contact Page ─────────────────────────────

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          records: [{
            fields: {
              "Full Name": form.name,
              "Email": form.email,
              "Phone": form.phone,
              "What AI Missed": `CONTACT FORM: ${form.message}`,
              "Lead Date": new Date().toISOString().split("T")[0],
              "Status": "New Lead",
            },
          }],
        }),
      });
      setSent(true);
    } catch (e) {
      console.error("Contact submit error:", e);
      setSent(true);
    }
    setSending(false);
  };

  return (
    <Section style={{ minHeight: "60vh" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontFamily: T.font, fontSize: 40, fontWeight: 700, color: T.text, margin: "20px 0 12px", letterSpacing: "-0.01em" }}>
          Talk to a real person
        </h1>
        <p style={{ fontFamily: T.font, fontSize: 17, color: T.muted, margin: "0 0 36px", lineHeight: 1.5 }}>
          Questions about your property, your offer, or how any of this works? Reach out — we answer everything, no strings attached.
        </p>

        {sent ? (
          <div style={{ background: T.bgSoft, borderRadius: 20, padding: 40 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontFamily: T.font, fontSize: 22, fontWeight: 600, color: T.text, margin: "0 0 8px" }}>Message received</h3>
            <p style={{ fontFamily: T.font, fontSize: 15, color: T.muted, margin: 0 }}>We'll get back to you within one business day.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, textAlign: "left" }}>
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Your name" />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@email.com" half />
            <Input label="Phone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(555) 555-5555" half />
            <div style={{ flex: "1 1 100%" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 6, fontFamily: T.font }}>How can we help?</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                placeholder="Tell us about your property or ask us anything…"
                style={{
                  width: "100%", boxSizing: "border-box", fontFamily: T.font, fontSize: 17,
                  padding: "13px 16px", borderRadius: 12, border: `1px solid ${T.border}`,
                  background: T.bgSoft, color: T.text, outline: "none", resize: "vertical",
                }}
              />
            </div>
            <div style={{ flex: "1 1 100%", textAlign: "center", marginTop: 8 }}>
              <Button onClick={submit} disabled={!form.name || (!form.email && !form.phone) || sending}>
                {sending ? "Sending…" : "Send Message"}
              </Button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${T.border}` }}>
          <p style={{ fontFamily: T.font, fontSize: 15, color: T.muted, margin: "0 0 4px" }}>Prefer email?</p>
          <a href="mailto:offers@clearofferhome.com" style={{ fontFamily: T.font, fontSize: 17, color: T.blue, textDecoration: "none", fontWeight: 600 }}>
            offers@clearofferhome.com
          </a>
        </div>
      </div>
    </Section>
  );
}

// ── Estimate Flow ────────────────────────────

function EstimateFlow({ go }) {
  const [step, setStep] = useState("form1"); // form1 → form2 → loading → result
  const [prop, setProp] = useState({
    address: "", city: "", state: "CA", zip: "",
    beds: "", baths: "", sqft: "", year: "",
    condition: "", reason: "",
  });
  const [photos, setPhotos] = useState([]);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [timeline, setTimeline] = useState("");
  const [perks, setPerks] = useState([]);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [counterOpen, setCounterOpen] = useState(false);
  const [counter, setCounter] = useState({ price: "", missed: "", name: "", phone: "", email: "" });
  const [submitted, setSubmitted] = useState(null); // "lock" | "counter"

  useEffect(() => {
    if (step !== "loading") return;
    if (loadingStep >= LOADING_STEPS.length) return;
    const t = setTimeout(() => setLoadingStep((s) => s + 1), 1600);
    return () => clearTimeout(t);
  }, [step, loadingStep]);

  const runAnalysis = async () => {
    setStep("loading");
    setLoadingStep(0);
    try {
      const photoBlocks = await Promise.all(
        photos.slice(0, 6).map(async (f) => {
          const b64 = await new Promise((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result.split(",")[1]);
            r.readAsDataURL(f);
          });
          return { type: "image", source: { type: "base64", media_type: f.type, data: b64 } };
        })
      );

      const prompt = `You are a real estate valuation engine for a Southern California cash home buyer. Analyze this property and return ONLY valid JSON.

Property: ${prop.address}, ${prop.city}, ${prop.state} ${prop.zip}
Beds: ${prop.beds} | Baths: ${prop.baths} | SqFt: ${prop.sqft} | Year built: ${prop.year}
Condition (owner-reported): ${prop.condition}
Reason for selling: ${prop.reason}
${photos.length > 0 ? `${photos.length} photos attached — use them to refine condition assessment.` : "No photos provided."}

Estimate current market value and after-repair value (ARV) based on typical Southern California pricing for the area. Then calculate the cash offer range as a percentage of ARV minus estimated repair costs, scaled by condition:
- excellent: 78-85% of ARV
- good: 72-78% of ARV
- fair: 65-72% of ARV
- poor: 55-65% of ARV

The offer should feel competitive and fair — this is a preliminary estimate to open a conversation, not a final lowball. When in doubt, lean toward the higher end of the range.

Return ONLY this JSON structure:
{
  "offerLow": number,
  "offerHigh": number,
  "marketValueLow": number,
  "marketValueHigh": number,
  "arv": number,
  "repairLow": number,
  "repairHigh": number,
  "repairNote": "one sentence on likely repair needs",
  "closingDays": "7-21",
  "keyFactors": ["factor 1", "factor 2", "factor 3", "factor 4"],
  "summary": "2-3 sentence plain-English assessment addressed to the homeowner"
}`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [{ role: "user", content: [...photoBlocks, { type: "text", text: prompt }] }],
        }),
      });
      const data = await resp.json();
      const text = data.content?.[0]?.text || "";
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      setResult(json);
    } catch (e) {
      console.error("Analysis error:", e);
      setResult({
        offerLow: 0, offerHigh: 0, marketValueLow: 0, marketValueHigh: 0, arv: 0,
        repairLow: 0, repairHigh: 0, repairNote: "", closingDays: "7-21",
        keyFactors: ["We couldn't complete the automated analysis"],
        summary: "Something went wrong on our end. Please try again, or contact us directly and we'll run your estimate personally.",
      });
    }
    setTimeout(() => setStep("result"), 6800);
  };

  const saveLead = async (kind) => {
    const fields = {
      "Full Name": kind === "lock" ? contact.name : counter.name,
      "Phone": kind === "lock" ? contact.phone : counter.phone,
      "Email": kind === "lock" ? contact.email : counter.email,
      "Address": prop.address,
      "City": prop.city,
      "State": prop.state,
      "ZIP": prop.zip,
      "Condition": prop.condition,
      "Reason for Selling": prop.reason,
      "Timeline": timeline,
      "AI Offer Low": result?.offerLow || 0,
      "AI Offer High": result?.offerHigh || 0,
      "Bonuses Selected": perks.join(", "),
      "Lead Date": new Date().toISOString().split("T")[0],
      "Status": "New Lead",
    };
    if (kind === "counter") {
      fields["Counter Offer Price"] = Number(counter.price) || 0;
      fields["What AI Missed"] = counter.missed;
    }
    try {
      const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ records: [{ fields }] }),
      });
      const out = await r.json();
      console.log("Airtable response:", out);
    } catch (e) {
      console.error("Airtable error:", e);
    }
    setSubmitted(kind);
    setCounterOpen(false);
  };

  const fmt = (n) => (n ? `$${Number(n).toLocaleString()}` : "—");

  // — Step 1: property details —
  if (step === "form1") {
    const valid = prop.address && prop.city && prop.zip && prop.beds && prop.baths && prop.sqft && prop.condition;
    return (
      <Section style={{ minHeight: "70vh" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <h1 style={{ fontFamily: T.font, fontSize: 34, fontWeight: 700, color: T.text, margin: "10px 0 8px", textAlign: "center", letterSpacing: "-0.01em" }}>
            Tell us about your home
          </h1>
          <p style={{ fontFamily: T.font, fontSize: 16, color: T.muted, textAlign: "center", margin: "0 0 36px" }}>
            Step 1 of 2 · Takes about a minute
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Input label="Street Address" value={prop.address} onChange={(v) => setProp({ ...prop, address: v })} placeholder="123 Main St" />
            <Input label="City" value={prop.city} onChange={(v) => setProp({ ...prop, city: v })} placeholder="Cypress" half />
            <Input label="ZIP" value={prop.zip} onChange={(v) => setProp({ ...prop, zip: v })} placeholder="90630" half />
            <Input label="Bedrooms" type="number" value={prop.beds} onChange={(v) => setProp({ ...prop, beds: v })} placeholder="3" half />
            <Input label="Bathrooms" type="number" value={prop.baths} onChange={(v) => setProp({ ...prop, baths: v })} placeholder="2" half />
            <Input label="Square Feet" type="number" value={prop.sqft} onChange={(v) => setProp({ ...prop, sqft: v })} placeholder="1500" half />
            <Input label="Year Built" type="number" value={prop.year} onChange={(v) => setProp({ ...prop, year: v })} placeholder="1975" half />
          </div>

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, margin: "24px 0 10px", fontFamily: T.font }}>CONDITION</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
            {CONDITIONS.map((c) => (
              <div key={c.id} onClick={() => setProp({ ...prop, condition: c.id })} style={{
                padding: "16px 18px", borderRadius: 14, cursor: "pointer", transition: "all 0.15s",
                border: prop.condition === c.id ? `2px solid ${T.blue}` : `1px solid ${T.border}`,
                background: prop.condition === c.id ? "#F0F7FF" : "#fff",
              }}>
                <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 16, color: T.text }}>{c.label}</div>
                <div style={{ fontFamily: T.font, fontSize: 13, color: T.muted, marginTop: 2 }}>{c.desc}</div>
              </div>
            ))}
          </div>

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, margin: "24px 0 10px", fontFamily: T.font }}>REASON FOR SELLING (OPTIONAL)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {REASONS.map((r) => (
              <span key={r} onClick={() => setProp({ ...prop, reason: r })} style={{
                fontFamily: T.font, fontSize: 14, padding: "9px 16px", borderRadius: 980, cursor: "pointer", transition: "all 0.15s",
                border: prop.reason === r ? `2px solid ${T.blue}` : `1px solid ${T.border}`,
                background: prop.reason === r ? "#F0F7FF" : "#fff",
                color: prop.reason === r ? T.blue : T.text,
                fontWeight: prop.reason === r ? 600 : 400,
              }}>{r}</span>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 36 }}>
            <Button onClick={() => setStep("form2")} disabled={!valid}>Continue</Button>
          </div>
        </div>
      </Section>
    );
  }

  // — Step 2: photos —
  if (step === "form2") {
    return (
      <Section style={{ minHeight: "70vh" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontFamily: T.font, fontSize: 34, fontWeight: 700, color: T.text, margin: "10px 0 8px", letterSpacing: "-0.01em" }}>
            Add photos <span style={{ color: T.muted, fontWeight: 400 }}>(optional)</span>
          </h1>
          <p style={{ fontFamily: T.font, fontSize: 16, color: T.muted, margin: "0 0 32px", lineHeight: 1.5 }}>
            Step 2 of 2 · Photos help us give you a sharper, often higher estimate. Kitchen, bathrooms, and exterior work best.
          </p>

          <label style={{
            display: "block", border: `2px dashed ${T.border}`, borderRadius: 20, padding: "48px 24px",
            cursor: "pointer", background: T.bgSoft, transition: "all 0.2s",
          }}>
            <input type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files)].slice(0, 6))} />
            <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
            <div style={{ fontFamily: T.font, fontSize: 17, fontWeight: 600, color: T.text }}>Tap to add photos</div>
            <div style={{ fontFamily: T.font, fontSize: 13, color: T.muted, marginTop: 4 }}>Up to 6 photos</div>
          </label>

          {photos.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 18 }}>
              {photos.map((f, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 12 }} />
                  <div onClick={() => setPhotos(photos.filter((_, j) => j !== i))} style={{
                    position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%",
                    background: T.text, color: "#fff", fontSize: 13, display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", fontFamily: T.font,
                  }}>✕</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 36 }}>
            <Button variant="secondary" onClick={() => setStep("form1")}>Back</Button>
            <Button onClick={runAnalysis}>{photos.length > 0 ? "Get My Estimate" : "Get My Estimate (No Photos)"}</Button>
          </div>
        </div>
      </Section>
    );
  }

  // — Loading —
  if (step === "loading") {
    return (
      <Section style={{ minHeight: "70vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}>
          <h2 style={{ fontFamily: T.font, fontSize: 26, fontWeight: 700, color: T.text, textAlign: "center", margin: "0 0 36px" }}>
            Analyzing your home…
          </h2>
          {LOADING_STEPS.map((s, i) => (
            <div key={s} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
              borderRadius: 14, marginBottom: 10, transition: "all 0.4s",
              background: i < loadingStep ? "#F0FFF4" : T.bgSoft,
              opacity: i <= loadingStep ? 1 : 0.4,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: i < loadingStep ? T.green : T.border,
                color: "#fff", fontSize: 14, fontWeight: 700, transition: "all 0.4s",
              }}>{i < loadingStep ? "✓" : ""}</div>
              <span style={{ fontFamily: T.font, fontSize: 15, color: T.text, fontWeight: i < loadingStep ? 600 : 400 }}>{s}</span>
            </div>
          ))}
        </div>
      </Section>
    );
  }

  // — Result —
  if (step === "result" && result) {
    if (submitted) {
      return (
        <Section style={{ minHeight: "60vh", textAlign: "center" }}>
          <div style={{ maxWidth: 480, margin: "40px auto 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontFamily: T.font, fontSize: 32, fontWeight: 700, color: T.text, margin: "0 0 12px" }}>
              {submitted === "lock" ? "You're all set!" : "Counter received!"}
            </h1>
            <p style={{ fontFamily: T.font, fontSize: 17, color: T.muted, lineHeight: 1.6, margin: "0 0 24px" }}>
              {submitted === "lock"
                ? "We'll reach out within a few hours to schedule your free 10-minute video walkthrough and confirm your firm written offer."
                : "Our team will review your number and what you told us, then get back to you — usually within a few hours."}
            </p>
            <div style={{ background: T.bgSoft, borderRadius: 16, padding: 22, textAlign: "left" }}>
              <div style={{ fontFamily: T.font, fontSize: 14, color: T.muted, marginBottom: 6 }}>Your preliminary range</div>
              <div style={{ fontFamily: T.font, fontSize: 26, fontWeight: 700, color: T.text }}>
                {fmt(result.offerLow)} – {fmt(result.offerHigh)}
              </div>
              {timeline && <div style={{ fontFamily: T.font, fontSize: 14, color: T.muted, marginTop: 8 }}>Timeline: {TIMELINES.find((t) => t.id === timeline)?.label}</div>}
              {perks.length > 0 && <div style={{ fontFamily: T.font, fontSize: 14, color: T.muted, marginTop: 4 }}>Included: {perks.map((p) => BONUSES.find((b) => b.id === p)?.title).join(", ")}</div>}
            </div>
          </div>
        </Section>
      );
    }

    return (
      <>
        <Section soft style={{ padding: "60px 24px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.green, marginBottom: 10 }}>✓ ESTIMATE READY</div>
          <p style={{ fontFamily: T.font, fontSize: 15, color: T.muted, margin: "0 0 6px" }}>{prop.address}, {prop.city}, {prop.state}</p>
          <h1 style={{ fontFamily: T.font, fontSize: "clamp(36px, 6vw, 54px)", fontWeight: 700, color: T.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            {fmt(result.offerLow)} – {fmt(result.offerHigh)}
          </h1>
          <p style={{ fontFamily: T.font, fontSize: 15, color: T.muted, margin: 0 }}>
            Preliminary cash offer range · No fees or commissions · Subject to walkthrough
          </p>
        </Section>

        <Section style={{ padding: "40px 24px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {/* Value breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
              {[
                { label: "Est. Market Value", val: `${fmt(result.marketValueLow)} – ${fmt(result.marketValueHigh)}` },
                { label: "After-Repair Value", val: fmt(result.arv) },
                { label: "Est. Repairs", val: `${fmt(result.repairLow)} – ${fmt(result.repairHigh)}` },
                { label: "Est. Closing", val: `${result.closingDays} days` },
              ].map((m) => (
                <div key={m.label} style={{ background: T.bgSoft, borderRadius: 16, padding: 18 }}>
                  <div style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.label}</div>
                  <div style={{ fontFamily: T.font, fontSize: 17, fontWeight: 700, color: T.text }}>{m.val}</div>
                </div>
              ))}
            </div>

            {/* Assessment */}
            <div style={{ background: T.bgSoft, borderRadius: 20, padding: 26, marginBottom: 28 }}>
              <h3 style={{ fontFamily: T.font, fontSize: 17, fontWeight: 600, color: T.text, margin: "0 0 10px" }}>Our take on your home</h3>
              <p style={{ fontFamily: T.font, fontSize: 15, color: T.text, lineHeight: 1.6, margin: "0 0 14px" }}>{result.summary}</p>
              {result.repairNote && <p style={{ fontFamily: T.font, fontSize: 14, color: T.muted, lineHeight: 1.5, margin: "0 0 14px" }}>{result.repairNote}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.keyFactors?.map((f) => (
                  <span key={f} style={{ fontFamily: T.font, fontSize: 13, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 980, padding: "6px 14px", color: T.muted }}>{f}</span>
                ))}
              </div>
            </div>

            {/* Perks */}
            <h3 style={{ fontFamily: T.font, fontSize: 22, fontWeight: 700, color: T.text, margin: "0 0 6px", textAlign: "center" }}>Included with every closing</h3>
            <p style={{ fontFamily: T.font, fontSize: 15, color: T.muted, textAlign: "center", margin: "0 0 20px" }}>Select what would make your move easier — these are on us.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 32 }}>
              {BONUSES.map((b) => {
                const on = perks.includes(b.id);
                return (
                  <div key={b.id} onClick={() => setPerks(on ? perks.filter((p) => p !== b.id) : [...perks, b.id])} style={{
                    padding: 20, borderRadius: 16, cursor: "pointer", transition: "all 0.15s",
                    border: on ? `2px solid ${T.blue}` : `1px solid ${T.border}`,
                    background: on ? "#F0F7FF" : "#fff",
                  }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{b.icon}</div>
                    <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 15, color: T.text, marginBottom: 4 }}>
                      {on ? "✓ " : ""}{b.title}
                    </div>
                    <div style={{ fontFamily: T.font, fontSize: 13, color: T.muted, lineHeight: 1.45 }}>{b.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Timeline */}
            <h3 style={{ fontFamily: T.font, fontSize: 22, fontWeight: 700, color: T.text, margin: "0 0 16px", textAlign: "center" }}>What's your ideal timeline?</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 40 }}>
              {TIMELINES.map((t) => (
                <div key={t.id} onClick={() => setTimeline(t.id)} style={{
                  padding: "18px 16px", borderRadius: 16, cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                  border: timeline === t.id ? `2px solid ${T.blue}` : `1px solid ${T.border}`,
                  background: timeline === t.id ? "#F0F7FF" : "#fff",
                }}>
                  <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 15, color: T.text }}>{t.label}</div>
                  <div style={{ fontFamily: T.font, fontSize: 13, color: T.muted, marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>

            {/* Dual CTA */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {/* Lock in */}
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 20, padding: 26, boxShadow: T.cardShadow }}>
                <h4 style={{ fontFamily: T.font, fontSize: 19, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>🔒 Lock In This Range</h4>
                <p style={{ fontFamily: T.font, fontSize: 14, color: T.muted, margin: "0 0 16px", lineHeight: 1.5 }}>
                  Schedule a free 10-minute video walkthrough and get a firm written offer.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Input value={contact.name} onChange={(v) => setContact({ ...contact, name: v })} placeholder="Full name" />
                  <Input type="tel" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} placeholder="Phone" />
                  <Input type="email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} placeholder="Email" />
                  <Button onClick={() => saveLead("lock")} disabled={!contact.name || !contact.phone}>Schedule Walkthrough</Button>
                </div>
              </div>

              {/* Counter */}
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 20, padding: 26 }}>
                <h4 style={{ fontFamily: T.font, fontSize: 19, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>💬 Think It's Worth More?</h4>
                <p style={{ fontFamily: T.font, fontSize: 14, color: T.muted, margin: "0 0 16px", lineHeight: 1.5 }}>
                  Tell us your number and what our estimate missed — new roof, remodel, anything. A real person will review it.
                </p>
                <Button variant="secondary" onClick={() => setCounterOpen(true)} style={{ width: "100%" }}>Make a Counter Offer</Button>
              </div>
            </div>

            <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, textAlign: "center", marginTop: 36, lineHeight: 1.6 }}>
              This is a preliminary estimate, not a formal appraisal. Your firm offer comes after a quick walkthrough — and it's still zero obligation.
            </p>
          </div>
        </Section>

        {/* Counter modal */}
        {counterOpen && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }} onClick={() => setCounterOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{
              background: "#fff", borderRadius: 24, padding: 30, maxWidth: 440, width: "100%",
              maxHeight: "88vh", overflowY: "auto",
            }}>
              <h3 style={{ fontFamily: T.font, fontSize: 22, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>Your counter offer</h3>
              <p style={{ fontFamily: T.font, fontSize: 14, color: T.muted, margin: "0 0 20px", lineHeight: 1.5 }}>
                Our estimate: {fmt(result.offerLow)} – {fmt(result.offerHigh)}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Input label="What number did you have in mind?" type="number" value={counter.price} onChange={(v) => setCounter({ ...counter, price: v })} placeholder="$" />
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 6, fontFamily: T.font }}>What did our estimate miss?</label>
                  <textarea
                    value={counter.missed}
                    onChange={(e) => setCounter({ ...counter, missed: e.target.value })}
                    rows={3}
                    placeholder="New roof? Remodeled kitchen? Tell us what adds value…"
                    style={{
                      width: "100%", boxSizing: "border-box", fontFamily: T.font, fontSize: 16,
                      padding: "12px 14px", borderRadius: 12, border: `1px solid ${T.border}`,
                      background: T.bgSoft, outline: "none", resize: "vertical",
                    }}
                  />
                </div>
                <Input label="Name" value={counter.name} onChange={(v) => setCounter({ ...counter, name: v })} placeholder="Full name" />
                <Input label="Phone" type="tel" value={counter.phone} onChange={(v) => setCounter({ ...counter, phone: v })} placeholder="Phone" />
                <Input label="Email" type="email" value={counter.email} onChange={(v) => setCounter({ ...counter, email: v })} placeholder="Email" />
                <Button onClick={() => saveLead("counter")} disabled={!counter.price || !counter.name || !counter.phone}>
                  Submit Counter Offer
                </Button>
                <Button variant="ghost" onClick={() => setCounterOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

// ── Footer ───────────────────────────────────

function Footer({ go }) {
  return (
    <footer style={{ background: T.bgSoft, borderTop: `1px solid ${T.border}`, padding: "48px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 28 }}>
          <div>
            <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 8 }}>
              ClearOffer <span style={{ color: T.blue }}>Home</span>
            </div>
            <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, maxWidth: 300, lineHeight: 1.5, margin: 0 }}>
              Southern California real estate investors. We buy homes as-is, on your timeline, with total transparency.
            </p>
          </div>
          <div style={{ display: "flex", gap: 36 }}>
            <div>
              <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10 }}>Company</div>
              {[["About Us", "about"], ["Contact", "contact"], ["Get an Offer", "estimate"]].map(([label, id]) => (
                <div key={id} onClick={() => go(id)} style={{ fontFamily: T.font, fontSize: 13, color: T.muted, marginBottom: 8, cursor: "pointer" }}>{label}</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10 }}>Reach us</div>
              <a href="mailto:offers@clearofferhome.com" style={{ fontFamily: T.font, fontSize: 13, color: T.muted, textDecoration: "none", display: "block", marginBottom: 8 }}>
                offers@clearofferhome.com
              </a>
            </div>
          </div>
        </div>
        <p style={{ fontFamily: T.font, fontSize: 12, color: T.muted, marginTop: 36, lineHeight: 1.6 }}>
          © {new Date().getFullYear()} ClearOffer Home. All estimates are preliminary and subject to in-person verification. We are professional real estate investors; we are not licensed real estate agents or appraisers, and no content on this site constitutes an appraisal, brokerage service, or legal advice.
        </p>
      </div>
    </footer>
  );
}

// ── App ──────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("home");

  const go = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      <Nav page={page} go={go} />
      {page === "home" && <HomePage go={go} />}
      {page === "about" && <AboutPage go={go} />}
      {page === "contact" && <ContactPage />}
      {page === "estimate" && <EstimateFlow go={go} />}
      <Footer go={go} />
    </div>
  );
}
