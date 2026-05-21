import { useState, useRef, useEffect } from "react";

const C = {
  bg: "#FAF8F2",
  dark: "#1C2B1A",
  gold: "#C8913A",
  goldLight: "#F5E6CC",
  text: "#1A1A1A",
  muted: "#6B7280",
  white: "#FFFFFF",
  mint: "#EEF3EC",
  border: "#DDD8CF",
  mintBorder: "#C2D5BF",
};

const CONDITIONS = [
  { v: "excellent", icon: "✨", label: "Excellent",   sub: "Move-in ready, recently updated" },
  { v: "good",      icon: "👍", label: "Good",        sub: "Minor cosmetic updates needed" },
  { v: "fair",      icon: "🔧", label: "Fair",        sub: "Some repairs needed" },
  { v: "poor",      icon: "⚠️", label: "Poor",        sub: "Significant repairs needed" },
  { v: "distressed",icon: "🔨", label: "Distressed",  sub: "Major renovation required" },
];

const REASONS = [
  "Relocating","Inherited property","Financial hardship",
  "Divorce","Avoiding foreclosure","Downsizing","Tired landlord","Just exploring","Other",
];

const TIMELINES = [
  { v: "asap",      label: "As Soon As Possible", sub: "7–14 days",  icon: "⚡" },
  { v: "flexible",  label: "I Have Some Time",    sub: "30–60 days", icon: "📅" },
  { v: "exploring", label: "Just Exploring",      sub: "No rush",    icon: "🔍" },
];

const BONUSES = [
  {
    id: "cleanout", icon: "🗑️",
    title: "The Cleanout Guarantee",
    desc: "Leave whatever you don't want. Furniture, trash, debris — we handle the dumpsters and the labor. Walk away clean.",
  },
  {
    id: "moving", icon: "🚛",
    title: "The Moving Bridge",
    desc: "We'll cover up to $1,500 in moving expenses or drop a secure POD in your driveway for 14 days. Your move, our bill.",
  },
  {
    id: "grace", icon: "🏠",
    title: "The Post-Close Grace Period",
    desc: "Get paid at closing and stay in the home for up to 14 extra days — giving you time to secure your next place without rushing.",
  },
];

const LOADING_STEPS = [
  "Locating your property…",
  "Pulling local comparables…",
  "AI analyzing room conditions…",
  "Calculating estimated repair costs…",
];

const DIFFERENTIATORS = [
  { icon: "📊", title: "No lowball ambushes", desc: "We show you the math upfront. You see the repair estimates and ARV before you decide anything." },
  { icon: "🤫", title: "No neighborhood signs", desc: "Your neighbors won't know you're selling until the moving truck arrives. Total discretion." },
  { icon: "🏗️", title: "Local engineering, not guessing", desc: "Most investors guess at repairs and lowball you to be safe. We use construction engineers to price accurately — more equity in your pocket." },
];

const fmt = (n) => n ? "$" + Math.round(n).toLocaleString() : "$—";

const inp = (extra = {}) => ({
  width: "100%", padding: "0.75rem 1rem", borderRadius: 8,
  border: `1.5px solid ${C.border}`, fontFamily: "system-ui, sans-serif",
  fontSize: 15, boxSizing: "border-box", background: C.white,
  outline: "none", color: C.text, ...extra,
});

export default function App() {
  const [page, setPage]           = useState("landing");
  const [step, setStep]           = useState(1);
  const [heroAddress, setHeroAddress] = useState("");
  const [form, setForm]           = useState({
    address:"", city:"", state:"CA", zip:"",
    beds:"", baths:"", sqft:"", yearBuilt:"",
    condition:"", reason:"", name:"", phone:"", email:"",
  });
  const [photos, setPhotos]       = useState([]);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lockedIn, setLockedIn]   = useState(false);
  const [timeline, setTimeline]   = useState("");
  const [showCounter, setShowCounter]         = useState(false);
  const [counterSubmitted, setCounterSubmitted] = useState(false);
  const [counter, setCounter]     = useState({ price:"", missed:"", committed: false });
  const [selectedBonuses, setSelectedBonuses] = useState([]);
  const [loadStep, setLoadStep]   = useState(0);
  const fileRef = useRef();

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setC = (k, v) => setCounter(c => ({ ...c, [k]: v }));

  const toggleBonus = (id) =>
    setSelectedBonuses(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );

  const handleFiles = async (files) => {
    const next = [];
    for (const f of Array.from(files).slice(0, 6)) {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      next.push({ name: f.name, preview: b64, data: b64.split(",")[1], type: f.type });
    }
    setPhotos(p => [...p, ...next].slice(0, 6));
  };

  // Animated loading steps
  useEffect(() => {
    if (page !== "loading") return;
    setLoadStep(0);
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadStep(i + 1), (i + 1) * 1800)
    );
    return () => timers.forEach(clearTimeout);
  }, [page]);

  const startWithAddress = () => {
    if (heroAddress.trim()) set("address", heroAddress.trim());
    setPage("form");
    setStep(1);
  };

  const getEstimate = async () => {
    setPage("loading");
    setError("");
    try {
      const content = [];
      photos.slice(0, 4).forEach(p =>
        content.push({ type: "image", source: { type: "base64", media_type: p.type, data: p.data } })
      );
      content.push({
        type: "text",
        text: `Analyze this property for a real estate wholesaler and return ONLY a JSON object, no markdown, no backticks.

Property:
- Address: ${form.address}, ${form.city}, ${form.state} ${form.zip}
- Beds: ${form.beds} | Baths: ${form.baths} | Sqft: ${form.sqft} | Year: ${form.yearBuilt}
- Condition: ${form.condition}
- Seller reason: ${form.reason}
- Photos provided: ${photos.length}

Return this exact JSON shape with realistic values for that market:
{
  "marketLow": NUMBER,
  "marketHigh": NUMBER,
  "arv": NUMBER,
  "offerLow": NUMBER,
  "offerHigh": NUMBER,
  "repairLow": NUMBER,
  "repairHigh": NUMBER,
  "timeline": "7-21 days",
  "factors": ["factor 1","factor 2","factor 3","factor 4"],
  "conditionNote": "2 sentence note on condition",
  "summary": "2-3 sentence opportunity summary for the seller"
}

Cash offer should be 55-72% of ARV depending on condition. Use realistic Southern California market data.`,
      });

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content }],
        }),
      });

      const data = await resp.json();
      const raw = (data.content.find(b => b.type === "text")?.text || "")
        .replace(/```json|```/g, "").trim();
      setResult(JSON.parse(raw));
      setPage("result");
    } catch {
      setError("Something went wrong — please try again.");
      setPage("form");
    }
  };

  const submitToAirtable = async (isCounter = false) => {
    try {
      const atResp = await fetch("https://api.airtable.com/v0/appuUlvNaPDNTtjUV/tblegcH03z8ZVjYQh", {
        method: "POST",
        headers: {
          "Authorization": `Bearer pateQVdIlawAGFGHb.a9623ba023f8eaf49d8e4c625d11e14f09412468a6a29736fa36464d5d07c7cb`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{
            fields: {
              "Full Name": form.name || "",
              "Phone": form.phone || "",
              "Email": form.email || "",
              "Address": form.address || "",
              "City": form.city || "",
              "State": form.state || "",
              "Zip": form.zip || "",
              "Condition": form.condition || "",
              "Reason for Selling": form.reason || "",
              "Timeline": timeline || "",
              "Ai Offer Low": result?.offerLow || 0,
              "Ai Offer High": result?.offerHigh || 0,
              "Counter Offer Price": counter.price ? Number(counter.price) : 0,
              "What Ai Missed": counter.missed || "",
              "Bonus Selected": selectedBonuses.join(", "),
              "Lead Date": new Date().toISOString().split("T")[0],
              "Status": "New Lead",
            }
          }]
        }),
      });
      const atData = await atResp.json();
      console.log("Airtable response:", JSON.stringify(atData));
    } catch (e) {
      console.log("Airtable error:", e);
    }
  };

  const resetAll = () => {
    setPage("landing"); setResult(null); setPhotos([]); setSubmitted(false);
    setLockedIn(false); setCounterSubmitted(false); setTimeline("");
    setCounter({ price:"", missed:"", committed: false }); setSelectedBonuses([]);
    setHeroAddress(""); setForm({ address:"", city:"", state:"CA", zip:"",
      beds:"", baths:"", sqft:"", yearBuilt:"", condition:"", reason:"",
      name:"", phone:"", email:"" });
  };

  // ─── LANDING ────────────────────────────────────────────────────────────────
  if (page === "landing") return (
    <div style={{ fontFamily: "Georgia, serif", background: C.bg, minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* Nav */}
      <nav style={{ padding:"1.2rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${C.border}`, background:C.white }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, background:C.dark, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏠</div>
          <span style={{ fontWeight:700, fontSize:18, color:C.dark }}>FairExit AI</span>
        </div>
        <button onClick={startWithAddress} style={{ background:C.dark, color:C.white, border:"none", borderRadius:8, padding:"0.6rem 1.4rem", fontFamily:"Georgia, serif", fontSize:15, cursor:"pointer" }}>
          Get My Estimate →
        </button>
      </nav>

      {/* ── HERO ── */}
      <div style={{ background:C.dark, padding:"5rem 2rem 4rem", textAlign:"center", position:"relative", overflow:"hidden" }}>
        {/* Subtle grid texture */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(200,145,58,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(200,145,58,0.04) 1px,transparent 1px)", backgroundSize:"48px 48px", pointerEvents:"none" }} />

        <div style={{ maxWidth:680, margin:"0 auto", position:"relative" }}>
          <div style={{ display:"inline-block", background:"rgba(200,145,58,0.15)", color:C.gold, fontSize:13, fontFamily:"system-ui", padding:"0.4rem 1.1rem", borderRadius:20, marginBottom:"1.5rem", border:`1px solid rgba(200,145,58,0.3)` }}>
            No agents &nbsp;·&nbsp; No showings &nbsp;·&nbsp; No obligation
          </div>

          <h1 style={{ fontSize:"clamp(1.8rem,5vw,3.2rem)", lineHeight:1.15, color:C.white, margin:"0 0 1.25rem", fontWeight:700 }}>
            Skip the Realtor.<br/>Skip the Repairs.<br/><span style={{ color:C.gold }}>Get Your Cash Number Now.</span>
          </h1>

          <p style={{ fontSize:17, color:"rgba(255,255,255,0.65)", lineHeight:1.75, fontFamily:"system-ui", maxWidth:500, margin:"0 auto 2.5rem" }}>
            Our AI vision analyzes your home's as-is condition and generates a preliminary cash offer in 60 seconds. No phone calls required to see your range.
          </p>

          {/* Hero input */}
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:14, padding:"1.5rem", maxWidth:520, margin:"0 auto", border:`1px solid rgba(255,255,255,0.12)` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.1)", borderRadius:8, padding:"0.75rem 1rem", marginBottom:12, border:`1px solid rgba(255,255,255,0.15)` }}>
              <span style={{ fontSize:16 }}>📍</span>
              <input
                value={heroAddress}
                onChange={e => setHeroAddress(e.target.value)}
                onKeyDown={e => e.key === "Enter" && startWithAddress()}
                placeholder="Enter your property address…"
                style={{ background:"transparent", border:"none", outline:"none", color:C.white, fontFamily:"system-ui", fontSize:15, flex:1 }}
              />
            </div>
            <div onClick={() => fileRef.current?.click()} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.06)", borderRadius:8, padding:"0.75rem 1rem", marginBottom:16, border:`1px dashed rgba(255,255,255,0.2)`, cursor:"pointer" }}>
              <span style={{ fontSize:16 }}>📸</span>
              <span style={{ color:"rgba(255,255,255,0.55)", fontFamily:"system-ui", fontSize:14 }}>
                {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? "s" : ""} selected` : "Tap to upload 3–5 photos of your most dated rooms"}
              </span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => handleFiles(e.target.files)} style={{ display:"none" }} />
            <button onClick={startWithAddress} style={{ width:"100%", background:C.gold, color:C.dark, border:"none", borderRadius:8, padding:"1rem", fontSize:17, fontFamily:"Georgia, serif", cursor:"pointer", fontWeight:700 }}>
              Generate My Cash Range →
            </button>
            <p style={{ color:"rgba(255,255,255,0.3)", fontFamily:"system-ui", fontSize:12, marginTop:"0.75rem", marginBottom:0 }}>
              Takes 60 seconds · No sign-up required
            </p>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ background:C.white, padding:"4rem 2rem", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <h2 style={{ textAlign:"center", fontSize:26, color:C.dark, margin:"0 0 0.5rem" }}>How It Works</h2>
          <p style={{ textAlign:"center", fontFamily:"system-ui", color:C.muted, marginBottom:"2.5rem" }}>Three steps. No commitment.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"2rem" }}>
            {[
              { n:"1", t:"Describe your home",    d:"Address, beds, baths, condition. Under a minute." },
              { n:"2", t:"Upload a few photos",   d:"Exterior, kitchen, bathrooms. Totally optional." },
              { n:"3", t:"Get your cash range",   d:"Instant estimate. No pressure to move forward." },
            ].map(s => (
              <div key={s.n} style={{ textAlign:"center" }}>
                <div style={{ width:50, height:50, background:C.dark, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem", color:C.gold, fontSize:20, fontWeight:700 }}>{s.n}</div>
                <h3 style={{ fontSize:16, color:C.dark, margin:"0 0 0.4rem" }}>{s.t}</h3>
                <p style={{ fontSize:14, color:C.muted, fontFamily:"system-ui", lineHeight:1.6, margin:0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHY WE'RE DIFFERENT ── */}
      <div style={{ padding:"4rem 2rem", background:C.bg }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <h2 style={{ textAlign:"center", fontSize:26, color:C.dark, margin:"0 0 0.4rem" }}>Why we're different.</h2>
          <p style={{ textAlign:"center", fontFamily:"system-ui", color:C.muted, marginBottom:"2.5rem" }}>Not your typical "We Buy Ugly Houses" investor.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"1.5rem" }}>
            {DIFFERENTIATORS.map(d => (
              <div key={d.title} style={{ background:C.white, borderRadius:12, padding:"1.5rem", border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:28, marginBottom:"0.75rem" }}>{d.icon}</div>
                <h3 style={{ fontSize:15, color:C.dark, margin:"0 0 0.5rem", fontFamily:"system-ui", fontWeight:700 }}>{d.title}</h3>
                <p style={{ fontSize:13, color:C.muted, fontFamily:"system-ui", lineHeight:1.6, margin:0 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div style={{ background:C.white, borderTop:`1px solid ${C.border}`, padding:"1.75rem 2rem", display:"flex", justifyContent:"center", flexWrap:"wrap", gap:"2rem" }}>
        {["✓ Cash offers only","✓ No commissions","✓ Close in 7–21 days","✓ No obligation to accept"].map(t => (
          <span key={t} style={{ fontSize:14, color:C.dark, fontFamily:"system-ui" }}>{t}</span>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{ background:C.dark, padding:"4rem 2rem", textAlign:"center" }}>
        <h2 style={{ color:C.white, fontSize:26, margin:"0 0 0.75rem" }}>Curious what your home is worth?</h2>
        <p style={{ color:"rgba(255,255,255,0.6)", fontFamily:"system-ui", margin:"0 0 2rem" }}>No agents. No showings. Just an honest number.</p>
        <button onClick={startWithAddress} style={{ background:C.gold, color:C.dark, border:"none", borderRadius:10, padding:"1rem 2.5rem", fontSize:17, fontFamily:"Georgia, serif", cursor:"pointer", fontWeight:700 }}>
          Get My Free Estimate →
        </button>
      </div>
    </div>
  );

  // ─── LOADING ─────────────────────────────────────────────────────────────────
  if (page === "loading") return (
    <div style={{ fontFamily:"Georgia, serif", background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes checkIn{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ maxWidth:400, width:"100%", padding:"2rem" }}>
        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <div style={{ width:52, height:52, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.dark}`, borderRadius:"50%", animation:"spin 0.9s linear infinite", margin:"0 auto 1.25rem" }} />
          <h2 style={{ color:C.dark, margin:"0 0 0.25rem", fontSize:22 }}>Analyzing your property…</h2>
          <p style={{ color:C.muted, fontFamily:"system-ui", margin:0, fontSize:14 }}>This takes about 8 seconds</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {LOADING_STEPS.map((label, i) => {
            const done = loadStep > i;
            const active = loadStep === i;
            return (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:12, opacity: done || active ? 1 : 0.35, transition:"opacity 0.4s" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background: done ? C.dark : active ? C.gold + "33" : C.border, border: done ? "none" : `2px solid ${active ? C.gold : C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.4s" }}>
                  {done
                    ? <span style={{ color:C.gold, fontSize:14, animation:"checkIn 0.3s ease" }}>✓</span>
                    : active
                      ? <div style={{ width:10, height:10, borderRadius:"50%", background:C.gold }} />
                      : null
                  }
                </div>
                <span style={{ fontFamily:"system-ui", fontSize:15, color: done ? C.dark : C.muted }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ─── RESULT ──────────────────────────────────────────────────────────────────
  if (page === "result" && result) return (
    <div style={{ fontFamily:"Georgia, serif", background:C.bg, minHeight:"100vh", padding:"2rem 1rem" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── COUNTER MODAL ── */}
      {showCounter && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:C.white, borderRadius:16, padding:"2rem", maxWidth:480, width:"100%", position:"relative", animation:"fadeUp 0.25s ease" }}>
            <button onClick={() => setShowCounter(false)} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.muted }}>✕</button>

            {!counterSubmitted ? (
              <>
                <div style={{ fontSize:28, marginBottom:"0.6rem" }}>💬</div>
                <h2 style={{ fontSize:22, color:C.dark, margin:"0 0 0.4rem" }}>Challenge the AI</h2>
                <p style={{ fontFamily:"system-ui", fontSize:14, color:C.muted, margin:"0 0 1.75rem", lineHeight:1.6 }}>
                  The AI only knows what it can see. Tell us what it missed — our human team reviews every counter personally.
                </p>

                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <label style={{ display:"block", fontFamily:"system-ui", fontSize:13, fontWeight:600, color:C.dark, marginBottom:6 }}>What number did you have in mind?</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontFamily:"system-ui", fontSize:16, color:C.muted }}>$</span>
                      <input type="number" placeholder="450,000" value={counter.price} onChange={e => setC("price", e.target.value)} style={inp({ paddingLeft:"1.75rem" })} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display:"block", fontFamily:"system-ui", fontSize:13, fontWeight:600, color:C.dark, marginBottom:6 }}>What did the AI miss?</label>
                    <textarea rows={3} value={counter.missed} onChange={e => setC("missed", e.target.value)}
                      placeholder="e.g. New roof installed 2022, full HVAC replacement, renovated kitchen not visible in photos, permitted addition…"
                      style={inp({ resize:"vertical", lineHeight:1.6 })} />
                    <p style={{ fontFamily:"system-ui", fontSize:12, color:C.muted, margin:"4px 0 0" }}>Improvements, repairs, or features not visible in photos</p>
                  </div>

                  <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer", padding:"1rem", background:C.mint, borderRadius:8, border:`1px solid ${C.mintBorder}` }}>
                    <input type="checkbox" checked={counter.committed} onChange={e => setC("committed", e.target.checked)} style={{ marginTop:3, flexShrink:0, width:16, height:16, accentColor:C.dark }} />
                    <span style={{ fontFamily:"system-ui", fontSize:14, color:"#2D4A2C", lineHeight:1.55 }}>
                      If our team can get close to my number after a quick 10-minute video walkthrough, I'm open to moving forward.
                    </span>
                  </label>

                  <div>
                    <label style={{ display:"block", fontFamily:"system-ui", fontSize:13, fontWeight:600, color:C.dark, marginBottom:6 }}>Your contact info</label>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {[
                        { ph:"Your name",     k:"name",  t:"text"  },
                        { ph:"Phone number", k:"phone", t:"tel"   },
                        { ph:"Email address",k:"email", t:"email" },
                      ].map(f => (
                        <input key={f.k} type={f.t} placeholder={f.ph} value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                          style={inp()} />
                      ))}
                    </div>
                  </div>

                  <button onClick={() => { if (counter.price && form.name && form.phone) { setCounterSubmitted(true); submitToAirtable(true); } }} disabled={!counter.price || !form.name || !form.phone}
                    style={{ background: (counter.price && form.name && form.phone) ? C.dark : C.border, color:C.white, border:"none", borderRadius:8, padding:"0.9rem", fontSize:16, fontFamily:"Georgia, serif", cursor: (counter.price && form.name && form.phone) ? "pointer" : "not-allowed", fontWeight:700 }}>
                    Submit My Counter →
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"1rem 0" }}>
                <div style={{ fontSize:40, marginBottom:"1rem" }}>🤝</div>
                <h2 style={{ color:C.dark, margin:"0 0 0.75rem" }}>Counter received.</h2>
                <p style={{ fontFamily:"system-ui", color:C.muted, lineHeight:1.7, margin:"0 0 1.5rem" }}>
                  Our team is reviewing your number and what you shared. We'll reach out within a few hours — to talk through the numbers, not pressure you.
                </p>
                {counter.committed && (
                  <div style={{ background:C.mint, border:`1px solid ${C.mintBorder}`, borderRadius:8, padding:"0.75rem 1rem", fontFamily:"system-ui", fontSize:14, color:"#2D4A2C", marginBottom:"1.5rem" }}>
                    ✓ You're open to a walkthrough if we hit your number — noted.
                  </div>
                )}
                <button onClick={() => setShowCounter(false)} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"0.7rem 1.5rem", fontFamily:"system-ui", fontSize:14, cursor:"pointer", color:C.dark }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth:620, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"2rem", animation:"fadeUp 0.4s ease" }}>
          <div style={{ display:"inline-block", background:"#D4EDDA", color:"#155724", padding:"0.35rem 1rem", borderRadius:20, fontSize:13, fontFamily:"system-ui", marginBottom:"1rem" }}>✓ Estimate ready</div>
          <h1 style={{ fontSize:26, color:C.dark, margin:"0 0 0.25rem" }}>Your Preliminary AI Cash Range</h1>
          <p style={{ color:C.muted, fontFamily:"system-ui", margin:0 }}>{form.address}{form.city ? `, ${form.city}` : ""}{form.state ? `, ${form.state}` : ""}</p>
        </div>

        {/* Main offer */}
        <div style={{ background:C.dark, borderRadius:16, padding:"2.25rem 2rem", marginBottom:"1.25rem", textAlign:"center", animation:"fadeUp 0.4s ease 0.1s both" }}>
          <p style={{ color:"rgba(255,255,255,0.5)", fontFamily:"system-ui", fontSize:12, margin:"0 0 0.5rem", textTransform:"uppercase", letterSpacing:"0.08em" }}>Preliminary AI Cash Offer Range</p>
          <div style={{ color:C.gold, fontSize:"clamp(2rem,7vw,3rem)", fontWeight:700, margin:"0 0 0.25rem", letterSpacing:"-0.5px" }}>
            {fmt(result.offerLow)} – {fmt(result.offerHigh)}
          </div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontFamily:"system-ui", fontSize:12, margin:0 }}>Cash · No commissions · Subject to in-person inspection</p>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:"1.25rem", animation:"fadeUp 0.4s ease 0.15s both" }}>
          {[
            { l:"Est. Market Value", v:`${fmt(result.marketLow)}–${fmt(result.marketHigh)}` },
            { l:"After-Repair Value", v:fmt(result.arv) },
            { l:"Est. Closing",       v:result.timeline },
          ].map(s => (
            <div key={s.l} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:"1rem", textAlign:"center" }}>
              <p style={{ fontFamily:"system-ui", fontSize:11, color:C.muted, margin:"0 0 0.25rem", textTransform:"uppercase", letterSpacing:"0.04em" }}>{s.l}</p>
              <p style={{ fontFamily:"system-ui", fontSize:14, fontWeight:700, color:C.dark, margin:0 }}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Key factors */}
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:"1.5rem", marginBottom:"1.25rem" }}>
          <h3 style={{ fontSize:17, color:C.dark, margin:"0 0 1rem" }}>Key Value Factors</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {result.factors.map((f, i) => (
              <div key={i} style={{ display:"flex", gap:10, fontFamily:"system-ui", fontSize:14, color:C.text, alignItems:"flex-start" }}>
                <span style={{ color:C.gold, flexShrink:0, marginTop:1 }}>◆</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Condition + repairs */}
        <div style={{ background:C.mint, border:`1px solid ${C.mintBorder}`, borderRadius:12, padding:"1.5rem", marginBottom:"1.25rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div style={{ flex:1 }}>
              <h3 style={{ fontSize:16, color:C.dark, margin:"0 0 0.5rem" }}>Estimated Repair Budget</h3>
              <p style={{ fontFamily:"system-ui", fontSize:14, color:"#2D4A2C", lineHeight:1.6, margin:0 }}>{result.conditionNote}</p>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <span style={{ fontFamily:"system-ui", fontWeight:700, color:C.dark, fontSize:16 }}>{fmt(result.repairLow)}–{fmt(result.repairHigh)}</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:"1.5rem", marginBottom:"1.5rem" }}>
          <h3 style={{ fontSize:16, color:C.dark, margin:"0 0 0.75rem" }}>Our Assessment</h3>
          <p style={{ fontFamily:"system-ui", fontSize:15, color:C.text, lineHeight:1.7, margin:0 }}>{result.summary}</p>
        </div>

        {/* ── UNLOCKABLE BONUSES ── */}
        <div style={{ background:C.dark, borderRadius:16, padding:"1.75rem", marginBottom:"1.25rem" }}>
          <p style={{ color:C.gold, fontFamily:"system-ui", fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 0.3rem" }}>Included With Every Closing</p>
          <h3 style={{ color:C.white, fontSize:19, margin:"0 0 0.4rem" }}>We don't just buy the house. We fund the exit.</h3>
          <p style={{ color:"rgba(255,255,255,0.5)", fontFamily:"system-ui", fontSize:13, margin:"0 0 1.25rem", lineHeight:1.55 }}>
            Select the perks that make this transition easier. If we close, these are on us.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {BONUSES.map(b => {
              const sel = selectedBonuses.includes(b.id);
              return (
                <label key={b.id} onClick={() => toggleBonus(b.id)}
                  style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"1rem", borderRadius:10, background: sel ? "rgba(200,145,58,0.15)" : "rgba(255,255,255,0.06)", border:`1.5px solid ${sel ? C.gold : "rgba(255,255,255,0.1)"}`, cursor:"pointer", transition:"all 0.2s" }}>
                  <div style={{ width:20, height:20, borderRadius:4, background: sel ? C.gold : "transparent", border: sel ? "none" : "2px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1, transition:"all 0.2s" }}>
                    {sel && <span style={{ color:C.dark, fontSize:13, fontWeight:700 }}>✓</span>}
                  </div>
                  <div>
                    <p style={{ fontFamily:"system-ui", fontSize:14, fontWeight:700, color:C.white, margin:"0 0 3px" }}>
                      <span style={{ marginRight:6 }}>{b.icon}</span>{b.title}
                    </p>
                    <p style={{ fontFamily:"system-ui", fontSize:13, color:"rgba(255,255,255,0.5)", margin:0, lineHeight:1.5 }}>{b.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {selectedBonuses.length > 0 && (
            <p style={{ fontFamily:"system-ui", fontSize:13, color:C.gold, marginTop:"1rem", marginBottom:0, textAlign:"center" }}>
              ✓ {selectedBonuses.length} perk{selectedBonuses.length > 1 ? "s" : ""} selected — we'll include {selectedBonuses.length > 1 ? "these" : "this"} in your written offer
            </p>
          )}
        </div>

        {/* ── TIMELINE ── */}
        {!lockedIn && !counterSubmitted && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:"1.5rem", marginBottom:"1.25rem" }}>
            <h3 style={{ fontSize:16, color:C.dark, margin:"0 0 0.25rem" }}>What's your ideal timeline?</h3>
            <p style={{ fontFamily:"system-ui", fontSize:13, color:C.muted, margin:"0 0 1rem" }}>Helps us structure the right offer for your situation</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {TIMELINES.map(t => (
                <button key={t.v} onClick={() => setTimeline(t.v)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"0.85rem 1rem", borderRadius:8, border:`1.5px solid ${timeline===t.v ? C.dark : C.border}`, background: timeline===t.v ? C.mint : C.bg, cursor:"pointer", textAlign:"left" }}>
                  <span style={{ fontSize:18 }}>{t.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"system-ui", fontSize:14, fontWeight:600, color:C.dark }}>{t.label}</div>
                    <div style={{ fontFamily:"system-ui", fontSize:12, color:C.muted }}>{t.sub}</div>
                  </div>
                  {timeline===t.v && <span style={{ color:C.dark }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── DUAL CTA ── */}
        {!lockedIn && !counterSubmitted && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:"1.5rem" }}>
            {/* Lock In */}
            <div style={{ background:C.dark, borderRadius:12, padding:"1.5rem" }}>
              <div style={{ fontSize:26, marginBottom:"0.5rem" }}>🔒</div>
              <h3 style={{ color:C.white, fontSize:15, margin:"0 0 0.4rem" }}>Lock In This Range</h3>
              <p style={{ color:"rgba(255,255,255,0.5)", fontFamily:"system-ui", fontSize:12, margin:"0 0 1rem", lineHeight:1.5 }}>
                Schedule a free 10-min video walkthrough to get a firm written offer
              </p>
              {!submitted ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { ph:"Your name",     k:"name",  t:"text" },
                    { ph:"Phone number", k:"phone", t:"tel"  },
                    { ph:"Email",        k:"email", t:"email"},
                  ].map(f => (
                    <input key={f.k} type={f.t} placeholder={f.ph} value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                      style={{ padding:"0.65rem 0.85rem", borderRadius:8, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", color:C.white, fontFamily:"system-ui", fontSize:13, outline:"none" }} />
                  ))}
                  <button onClick={() => { setSubmitted(true); setLockedIn(true); submitToAirtable(false); }}
                    style={{ background:C.gold, color:C.dark, border:"none", borderRadius:8, padding:"0.75rem", fontSize:14, fontFamily:"Georgia, serif", cursor:"pointer", fontWeight:700, marginTop:2 }}>
                    Schedule Walkthrough →
                  </button>
                </div>
              ) : (
                <p style={{ color:C.gold, fontFamily:"system-ui", fontSize:13, margin:0 }}>✓ We'll be in touch within 24 hours</p>
              )}
            </div>

            {/* Counter */}
            <div style={{ background:C.bg, border:`2px solid ${C.border}`, borderRadius:12, padding:"1.5rem", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
              <div style={{ fontSize:26, marginBottom:"0.5rem" }}>💬</div>
              <h3 style={{ color:C.dark, fontSize:15, margin:"0 0 0.4rem" }}>Challenge the AI</h3>
              <p style={{ color:C.muted, fontFamily:"system-ui", fontSize:12, margin:"0 0 1rem", lineHeight:1.5 }}>
                Think your home is worth more? Tell us your number and what we missed.
              </p>
              <button onClick={() => setShowCounter(true)}
                style={{ background:C.white, color:C.dark, border:`2px solid ${C.dark}`, borderRadius:8, padding:"0.75rem 1rem", fontSize:13, fontFamily:"Georgia, serif", cursor:"pointer", fontWeight:700, width:"100%" }}>
                Make a Counter Offer →
              </button>
              <p style={{ color:C.muted, fontFamily:"system-ui", fontSize:11, margin:"0.6rem 0 0" }}>No commitment required</p>
            </div>
          </div>
        )}

        {/* Post-action state */}
        {(lockedIn || counterSubmitted) && (
          <div style={{ background:C.dark, borderRadius:16, padding:"2rem", textAlign:"center", marginBottom:"1.5rem" }}>
            <div style={{ fontSize:40, marginBottom:"1rem" }}>{lockedIn ? "🎉" : "🤝"}</div>
            <h2 style={{ color:C.white, margin:"0 0 0.75rem" }}>
              {lockedIn ? `You're all set${form.name ? `, ${form.name}` : ""}!` : "Counter received."}
            </h2>
            <p style={{ color:"rgba(255,255,255,0.65)", fontFamily:"system-ui", lineHeight:1.65, margin:0 }}>
              {lockedIn
                ? `We'll reach out within 24 hours to schedule your walkthrough. Expect a call or text${form.phone ? ` to ${form.phone}` : ""}.`
                : "Our team will review your number and reach out within a few hours — not to pressure you, just to talk through the math."}
            </p>
            {timeline && (
              <div style={{ display:"inline-block", background:"rgba(255,255,255,0.1)", borderRadius:8, padding:"0.5rem 1rem", marginTop:"1rem", fontFamily:"system-ui", fontSize:13, color:"rgba(255,255,255,0.7)" }}>
                Timeline noted: {TIMELINES.find(t => t.v===timeline)?.label}
              </div>
            )}
            {selectedBonuses.length > 0 && (
              <div style={{ marginTop:"0.75rem", fontFamily:"system-ui", fontSize:13, color:C.gold }}>
                Perks requested: {selectedBonuses.map(id => BONUSES.find(b => b.id===id)?.title).join(", ")}
              </div>
            )}
          </div>
        )}

        {/* Why different — result page reinforcement */}
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:"1.5rem", marginBottom:"1.5rem" }}>
          <h3 style={{ fontSize:16, color:C.dark, margin:"0 0 1rem", fontFamily:"system-ui", fontWeight:700 }}>Why sellers choose us over traditional investors</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              "No lowball ambushes — you see the math before you decide anything",
              "No neighborhood signs — your neighbors won't know until the truck arrives",
              "Local construction engineers price the repairs — no guessing, more equity for you",
            ].map(t => (
              <div key={t} style={{ display:"flex", gap:8, fontFamily:"system-ui", fontSize:14, color:C.text, alignItems:"flex-start" }}>
                <span style={{ color:"#2D8A4E", flexShrink:0 }}>✓</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign:"center", color:C.muted, fontFamily:"system-ui", fontSize:12, lineHeight:1.6 }}>
          This is an AI-generated preliminary estimate — not a formal appraisal. Final offer subject to in-person inspection and market conditions.
        </p>

        <div style={{ textAlign:"center", marginTop:"1.5rem", marginBottom:"1rem" }}>
          <button onClick={resetAll} style={{ background:"none", border:"none", color:C.muted, fontFamily:"system-ui", fontSize:14, cursor:"pointer", textDecoration:"underline" }}>
            Start over
          </button>
        </div>
      </div>
    </div>
  );

  // ─── FORM ────────────────────────────────────────────────────────────────────
  const canProceed1 = form.address && form.beds && form.baths && form.sqft && form.condition;

  return (
    <div style={{ fontFamily:"Georgia, serif", background:C.bg, minHeight:"100vh", padding:"2rem 1rem" }}>
      <div style={{ maxWidth:540, margin:"0 auto" }}>
        <button onClick={() => step===1 ? setPage("landing") : setStep(s => s-1)}
          style={{ background:"none", border:"none", color:C.muted, fontFamily:"system-ui", fontSize:14, cursor:"pointer", marginBottom:"1.5rem", padding:0 }}>
          ← Back
        </button>

        <div style={{ display:"flex", gap:8, marginBottom:"2rem" }}>
          {[1,2].map(s => (
            <div key={s} style={{ flex:1, height:4, borderRadius:2, background: s<=step ? C.dark : C.border, transition:"background 0.3s" }} />
          ))}
        </div>

        <p style={{ fontFamily:"system-ui", fontSize:13, color:C.muted, margin:"0 0 0.4rem" }}>Step {step} of 2</p>

        {step === 1 && (
          <div>
            <h2 style={{ fontSize:26, color:C.dark, margin:"0 0 0.4rem" }}>Tell us about your home</h2>
            <p style={{ fontFamily:"system-ui", color:C.muted, fontSize:15, margin:"0 0 2rem" }}>Basic info helps us give you the most accurate number.</p>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label style={{ display:"block", fontFamily:"system-ui", fontSize:13, color:C.dark, marginBottom:6 }}>Street address</label>
                <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St" style={inp()} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10 }}>
                {[
                  { l:"City",  k:"city",  p:"City"  },
                  { l:"State", k:"state", p:"CA"    },
                  { l:"ZIP",   k:"zip",   p:"90001" },
                ].map(f => (
                  <div key={f.k}>
                    <label style={{ display:"block", fontFamily:"system-ui", fontSize:13, color:C.dark, marginBottom:6 }}>{f.l}</label>
                    <input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.p} style={inp()} />
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10 }}>
                {[
                  { l:"Beds", k:"beds", p:"3" },{ l:"Baths", k:"baths", p:"2" },
                  { l:"Sq Ft", k:"sqft", p:"1200" },{ l:"Year Built", k:"yearBuilt", p:"1985" },
                ].map(f => (
                  <div key={f.k}>
                    <label style={{ display:"block", fontFamily:"system-ui", fontSize:13, color:C.dark, marginBottom:6 }}>{f.l}</label>
                    <input type="number" value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.p} style={inp({ paddingLeft:"0.75rem" })} />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display:"block", fontFamily:"system-ui", fontSize:13, color:C.dark, marginBottom:8 }}>Property condition</label>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {CONDITIONS.map(opt => (
                    <button key={opt.v} onClick={() => set("condition", opt.v)}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"0.85rem 1rem", borderRadius:8, border:`1.5px solid ${form.condition===opt.v ? C.dark : C.border}`, background: form.condition===opt.v ? C.mint : C.white, cursor:"pointer", textAlign:"left" }}>
                      <span style={{ fontSize:20 }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontFamily:"system-ui", fontSize:14, fontWeight:600, color:C.dark }}>{opt.label}</div>
                        <div style={{ fontFamily:"system-ui", fontSize:12, color:C.muted }}>{opt.sub}</div>
                      </div>
                      {form.condition===opt.v && <span style={{ marginLeft:"auto", color:C.dark }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display:"block", fontFamily:"system-ui", fontSize:13, color:C.dark, marginBottom:8 }}>
                  Reason for selling? <span style={{ color:C.muted, fontWeight:400 }}>(helps us tailor your offer)</span>
                </label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {REASONS.map(r => (
                    <button key={r} onClick={() => set("reason", r)}
                      style={{ padding:"0.5rem 1rem", borderRadius:20, border:`1.5px solid ${form.reason===r ? C.dark : C.border}`, background: form.reason===r ? C.dark : C.white, color: form.reason===r ? C.white : C.text, fontFamily:"system-ui", fontSize:13, cursor:"pointer" }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!canProceed1}
              style={{ background: canProceed1 ? C.dark : C.border, color:C.white, border:"none", borderRadius:10, padding:"1rem 2rem", fontSize:16, fontFamily:"Georgia, serif", cursor: canProceed1 ? "pointer" : "not-allowed", marginTop:"2rem", width:"100%" }}>
              Continue → Add Photos
            </button>
            {error && <p style={{ color:"red", fontFamily:"system-ui", marginTop:"1rem", fontSize:14 }}>{error}</p>}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize:26, color:C.dark, margin:"0 0 0.4rem" }}>Add some photos</h2>
            <p style={{ fontFamily:"system-ui", color:C.muted, fontSize:15, margin:"0 0 2rem", lineHeight:1.65 }}>
              More photos = sharper estimate. Exterior, kitchen, bathrooms, and any damage are most useful.
              <br /><strong style={{ color:C.dark }}>This step is optional</strong> — skip it and still get an estimate.
            </p>

            <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => handleFiles(e.target.files)} style={{ display:"none" }} />

            <div onClick={() => fileRef.current.click()}
              style={{ border:`2px dashed ${C.border}`, borderRadius:12, padding:"3rem 2rem", textAlign:"center", cursor:"pointer", background:C.white, marginBottom:"1.25rem" }}>
              <div style={{ fontSize:36, marginBottom:"0.75rem" }}>📷</div>
              <p style={{ fontFamily:"system-ui", color:C.dark, fontWeight:600, margin:"0 0 0.25rem" }}>Click to upload photos</p>
              <p style={{ fontFamily:"system-ui", color:C.muted, fontSize:13, margin:0 }}>Up to 6 photos · JPG or PNG</p>
            </div>

            {photos.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:"1.25rem" }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position:"relative", aspectRatio:"4/3", borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}` }}>
                    <img src={p.preview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    <button onClick={() => setPhotos(photos.filter((_,j) => j!==i))}
                      style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,0.65)", color:C.white, border:"none", borderRadius:"50%", width:24, height:24, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={getEstimate}
              style={{ background:C.dark, color:C.white, border:"none", borderRadius:10, padding:"1rem 2rem", fontSize:16, fontFamily:"Georgia, serif", cursor:"pointer", width:"100%" }}>
              {photos.length > 0
                ? `Get My Estimate with ${photos.length} Photo${photos.length>1?"s":""} →`
                : "Get My Estimate (No Photos) →"}
            </button>

            <p style={{ textAlign:"center", fontFamily:"system-ui", fontSize:13, color:C.muted, marginTop:"1rem" }}>
              Photos are used only for this estimate and never stored or shared.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
