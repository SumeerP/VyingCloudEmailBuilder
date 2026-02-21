"use client";

/* eslint-disable */

import { useState, useCallback, useEffect, useRef } from "react";

let _id = 0;
const uid = (p = "c") => `${p}_${++_id}_${Date.now().toString(36)}`;
const PB = "#1e293b", BD = "#334155", BG = "#0f172a";
const iS = { width: "100%", padding: "7px 10px", background: BG, border: `1px solid ${BD}`, borderRadius: 6, color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" };
const lS = { display: "block", fontSize: 10, color: "#64748b", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.8 };

// ─── Brand Kit ───
const DEFAULT_BRAND = {
  version: 1, locked: false, org: "Brand Inc.", logo: "",
  primary: "#0ea5e9", secondary: "#6366f1", accent: "#f59e0b",
  success: "#10b981", danger: "#ef4444",
  textPrimary: "#111827", textSecondary: "#6b7280", textInverse: "#ffffff",
  bgPage: "#f1f5f9", bgContent: "#ffffff", bgMuted: "#f8fafc", dividerColor: "#e2e8f0",
  fontHeading: "Arial, Helvetica, sans-serif", fontBody: "Arial, Helvetica, sans-serif",
  sizeH1: 32, sizeH2: 24, sizeH3: 18, sizeBody: 15, sizeSmall: 13,
  lineHeightBody: 1.6, lineHeightHeading: 1.25,
  fontWeightHeading: "700", fontWeightBody: "400", letterSpacingHeading: 0,
  btnBg: "#0ea5e9", btnText: "#ffffff", btnBgSecondary: "#6366f1", btnTextSecondary: "#ffffff",
  btnRadius: 6, btnFontSize: 15, btnFontWeight: "700", btnPaddingH: 28, btnPaddingV: 13,
  spacingUnit: 8, emailWidth: 600, contentPadding: 20,
  linkColor: "#0ea5e9", linkDecoration: "none",
};

function getBrandPalette(b) {
  return [b.primary, b.secondary, b.accent, b.success, b.danger,
    b.textPrimary, b.textSecondary, b.textInverse, b.bgPage, b.bgContent, b.bgMuted, b.dividerColor];
}

function applyBrandTokens(type, props, brand) {
  if (!brand?.locked) return props;
  const overrides = {};
  if ((type === "heading") && props._brandManaged !== false) {
    overrides.fontFamily = brand.fontHeading;
    overrides.color = brand.textPrimary;
    overrides.fontWeight = brand.fontWeightHeading;
    overrides.lineHeight = brand.lineHeightHeading;
    overrides.fontSize = brand.sizeH2;
  }
  if (type === "text" && props._brandManaged !== false) {
    overrides.fontFamily = brand.fontBody;
    overrides.color = brand.textPrimary;
    overrides.fontWeight = brand.fontWeightBody;
    overrides.lineHeight = brand.lineHeightBody;
    overrides.fontSize = brand.sizeBody;
  }
  if (type === "button" && props._brandManaged !== false) {
    overrides.bgColor = brand.btnBg; overrides.textColor = brand.btnText;
    overrides.borderRadius = brand.btnRadius; overrides.fontSize = brand.btnFontSize;
    overrides.fontWeight = brand.btnFontWeight; overrides.fontFamily = brand.fontBody;
  }
  if (type === "divider" && props._brandManaged !== false) overrides.color = brand.dividerColor;
  return { ...props, ...overrides };
}

function getBrandViolations(type, props, brand) {
  if (!brand || brand.locked) return [];
  const warnings = [];
  const palette = getBrandPalette(brand);
  if ((type === "text" || type === "heading") && props.color && !palette.includes(props.color))
    warnings.push(`Color ${props.color} not in brand palette`);
  if ((type === "text" || type === "heading") && props.fontFamily && props.fontFamily !== "" &&
    props.fontFamily !== brand.fontBody && props.fontFamily !== brand.fontHeading)
    warnings.push(`Font not in brand fonts`);
  if (type === "button" && props.bgColor && ![brand.btnBg, brand.btnBgSecondary, brand.primary, brand.secondary].includes(props.bgColor))
    warnings.push(`Button color not a brand color`);
  return warnings;
}

const BLOCK_CATEGORIES = ["Hero", "Header", "Content", "CTA", "Footer", "Promotional", "Transactional", "Layout"];
function F({ label, children }) { return <div style={{ marginBottom: 10 }}><label style={lS}>{label}</label>{children}</div>; }
function ColorF({ label, value, onChange, brandColors }) {
  return <F label={label}>
    {brandColors?.length > 0 && <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 4 }}>
      {brandColors.filter(Boolean).map(c => <div key={c} onClick={() => onChange(c)} title={c} style={{ width: 18, height: 18, borderRadius: 3, background: c, cursor: "pointer", border: value === c ? "2px solid #fff" : "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }} />)}
    </div>}
    <div style={{ display: "flex", gap: 4 }}>
      <input type="color" value={value || "#000000"} onChange={e => onChange(e.target.value)} style={{ width: 28, height: 28, border: "none", cursor: "pointer", borderRadius: 4 }} />
      <input value={value || ""} onChange={e => onChange(e.target.value)} style={{ ...iS, flex: 1 }} />
    </div>
  </F>;
}
function NumF({ label, value, onChange, min, max }) { return <F label={label}><input type="number" value={value} onChange={e => onChange(+e.target.value)} min={min} max={max} style={iS} /></F>; }
function SelF({ label, value, onChange, opts }) { return <F label={label}><select value={value} onChange={e => onChange(e.target.value)} style={iS}>{opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option>; })}</select></F>; }
function AlignF({ value, onChange }) { return <F label="Align"><div style={{ display: "flex", gap: 4 }}>{["left", "center", "right"].map(a => <button key={a} onClick={() => onChange(a)} style={{ flex: 1, padding: 5, background: value === a ? "#0ea5e9" : BG, border: `1px solid ${BD}`, borderRadius: 4, color: value === a ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 11 }}>{a}</button>)}</div></F>; }
function PadF({ label, value, onChange }) {
  const parts = (value || "0px").split(" ").map(v => parseInt(v) || 0);
  const [t, r, b, l] = parts.length === 4 ? parts : parts.length === 2 ? [parts[0], parts[1], parts[0], parts[1]] : [parts[0], parts[0], parts[0], parts[0]];
  const set = (i, v) => { const p = [t, r, b, l]; p[i] = v; onChange(p.map(x => x + "px").join(" ")); };
  return <F label={label}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>{["T", "R", "B", "L"].map((d, i) => <div key={d}><div style={{ fontSize: 8, color: "#475569", textAlign: "center" }}>{d}</div><input type="number" value={[t, r, b, l][i]} onChange={e => set(i, +e.target.value)} style={{ ...iS, padding: "4px", textAlign: "center", fontSize: 11 }} /></div>)}</div></F>;
}
function BorderF({ border, onChange }) {
  const b = border || { width: 0, style: "solid", color: "#e2e8f0", radius: 0 };
  const set = (k, v) => onChange({ ...b, [k]: v });
  return <div style={{ background: BG, padding: 8, borderRadius: 6, marginBottom: 10, border: `1px solid ${BD}` }}>
    <div style={lS}>Border</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
      <div><div style={{ fontSize: 8, color: "#475569" }}>Width</div><input type="number" value={b.width} onChange={e => set("width", +e.target.value)} style={{ ...iS, padding: "4px" }} /></div>
      <div><div style={{ fontSize: 8, color: "#475569" }}>Radius</div><input type="number" value={b.radius} onChange={e => set("radius", +e.target.value)} style={{ ...iS, padding: "4px" }} /></div>
    </div>
    <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
      <select value={b.style} onChange={e => set("style", e.target.value)} style={{ ...iS, flex: 1, padding: "4px" }}>{["solid", "dashed", "dotted", "double", "none"].map(s => <option key={s}>{s}</option>)}</select>
      <input type="color" value={b.color} onChange={e => set("color", e.target.value)} style={{ width: 28, height: 28, border: "none", cursor: "pointer", borderRadius: 4 }} />
    </div>
  </div>;
}
function Toggle({ label, value, onChange }) { return <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><div onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, background: value ? "#10b981" : "#475569", cursor: "pointer", position: "relative" }}><div style={{ width: 16, height: 16, borderRadius: 8, background: "#fff", position: "absolute", top: 2, left: value ? 18 : 2, transition: "left 0.2s" }} /></div><span style={{ fontSize: 11, color: "#cbd5e1" }}>{label}</span></div>; }
function Section({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen !== false);
  return <div style={{ marginBottom: 8 }}><div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "4px 0", borderBottom: `1px solid ${BD}`, marginBottom: open ? 8 : 0 }}><span style={{ fontSize: 10, color: "#64748b", transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "none" }}>▶</span><span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>{title}</span></div>{open && children}</div>;
}

// ─── AEM Data ───
const CF_MODELS = {
  hero: { label: "Hero Banner", icon: "🎯", fields: { image: "url", headline: "text", subtext: "text", cta: "text", ctaUrl: "url", bgColor: "color" } },
  banner: { label: "Promo Banner", icon: "🏷️", fields: { image: "url", headline: "text", bgColor: "color" } },
  productCard: { label: "Product Card", icon: "🛍️", fields: { image: "url", title: "text", price: "text", originalPrice: "text", cta: "text", ctaUrl: "url" } },
  testimonial: { label: "Testimonial", icon: "💬", fields: { quote: "textarea", author: "text", role: "text", avatar: "url", rating: "number" } },
  articleTeaser: { label: "Article Teaser", icon: "📰", fields: { image: "url", headline: "text", excerpt: "textarea", cta: "text", ctaUrl: "url" } },
  ctaBlock: { label: "CTA Block", icon: "🔘", fields: { headline: "text", subtext: "text", cta: "text", ctaUrl: "url", bgColor: "color", textColor: "color" } },
  socialBar: { label: "Social Bar", icon: "🔗", fields: { networks: "list", align: "text" } },
  footerBlock: { label: "Footer", icon: "🔻", fields: { copyrightText: "text", links: "list", unsubscribeUrl: "url" } },
};
const AEM_FRAGS = {
  hero: [{ id: "cf-h1", title: "Spring Sale", path: "/content/dam/heroes/spring", variations: [{ name: "Default", data: { image: "https://placehold.co/600x220/0ea5e9/fff?text=Spring+Sale+50%25+Off", headline: "Spring Sale — 50% Off", subtext: "Limited time on selected items", cta: "Shop Now", ctaUrl: "#", bgColor: "#0ea5e9" } }, { name: "VIP", data: { image: "https://placehold.co/600x220/8b5cf6/fff?text=VIP+Early+Access", headline: "VIP Early Access", subtext: "Exclusive deals for you", cta: "Access Deals", ctaUrl: "#", bgColor: "#8b5cf6" } }, { name: "Last Chance", data: { image: "https://placehold.co/600x220/ef4444/fff?text=Last+Chance!", headline: "Last Chance!", subtext: "Ends tonight at midnight", cta: "Don't Miss Out", ctaUrl: "#", bgColor: "#ef4444" } }] }],
  banner: [{ id: "cf-b1", title: "Free Shipping", path: "/content/dam/banners/shipping", variations: [{ name: "Default", data: { image: "https://placehold.co/600x70/10b981/fff?text=🚚+Free+Shipping+Over+$50", headline: "Free Shipping Over $50", bgColor: "#10b981" } }, { name: "Holiday", data: { image: "https://placehold.co/600x70/ef4444/fff?text=🎄+Holiday+Free+Shipping", headline: "Holiday Free Shipping!", bgColor: "#ef4444" } }] }],
  productCard: [{ id: "cf-p1", title: "Headphones", path: "/content/dam/products/hp", variations: [{ name: "Default", data: { image: "https://placehold.co/280x280/1e293b/e2e8f0?text=🎧", title: "Wireless Pro", price: "$129.99", originalPrice: "$179.99", cta: "Buy Now", ctaUrl: "#" } }] }],
  testimonial: [{ id: "cf-t1", title: "Sarah Review", path: "/content/dam/testimonials/sarah", variations: [{ name: "Default", data: { quote: "Best purchase ever! Quality is unmatched.", author: "Sarah M.", role: "Verified Buyer", avatar: "https://placehold.co/48/ec4899/fff?text=SM", rating: 5 } }] }],
  articleTeaser: [{ id: "cf-a1", title: "Style Guide", path: "/content/dam/articles/style", variations: [{ name: "Default", data: { image: "https://placehold.co/600x180/6366f1/fff?text=Style+Guide+2026", headline: "Style Guide 2026", excerpt: "Top trends shaping fashion...", cta: "Read More", ctaUrl: "#" } }] }],
  ctaBlock: [{ id: "cf-c1", title: "Newsletter", path: "/content/dam/ctas/newsletter", variations: [{ name: "Default", data: { headline: "Stay in the Loop", subtext: "Exclusive offers weekly.", cta: "Subscribe", ctaUrl: "#", bgColor: "#0f172a", textColor: "#ffffff" } }] }],
  socialBar: [{ id: "cf-s1", title: "Brand Social", path: "/content/dam/social", variations: [{ name: "Default", data: { networks: ["facebook", "twitter", "instagram", "linkedin"], align: "center" } }] }],
  footerBlock: [{ id: "cf-f1", title: "Standard Footer", path: "/content/dam/footer", variations: [{ name: "Default", data: { copyrightText: "© 2026 Brand Inc.", links: ["Privacy", "Terms", "Contact"], unsubscribeUrl: "#unsub" } }] }],
};
const NATIVE = {
  text: { label: "Text Block", icon: "📝", cat: "Content" },
  heading: { label: "Heading", icon: "🔤", cat: "Content" },
  image: { label: "Image", icon: "🖼️", cat: "Content" },
  button: { label: "Button", icon: "🔘", cat: "Content" },
  divider: { label: "Divider", icon: "➖", cat: "Layout" },
  spacer: { label: "Spacer", icon: "↕️", cat: "Layout" },
  columns: { label: "2 Columns", icon: "▥", cat: "Layout" },
  dynamic: { label: "Merge Tag", icon: "⚙️", cat: "Content" },
};

function defProps(t, brand) {
  const b = brand || DEFAULT_BRAND;
  const base = { bgColor: "", border: { width: 0, style: "solid", color: b.dividerColor, radius: 0 }, hideOnMobile: false, hideOnDesktop: false, customClass: "", conditionalAttr: "", conditionalVal: "", _brandManaged: true };
  const sp = b.spacingUnit, cp = b.contentPadding;
  const m = {
    text: { ...base, content: "Edit this text content here.", align: "left", fontSize: b.sizeBody, color: b.textPrimary, fontWeight: b.fontWeightBody, fontFamily: b.fontBody, lineHeight: b.lineHeightBody, letterSpacing: 0, textTransform: "none", textDecoration: "none", padding: `${sp * 1.5}px ${cp}px` },
    heading: { ...base, content: "Section Heading", align: "center", fontSize: b.sizeH2, color: b.textPrimary, fontWeight: b.fontWeightHeading, fontFamily: b.fontHeading, lineHeight: b.lineHeightHeading, letterSpacing: b.letterSpacingHeading, textTransform: "none", padding: `${sp * 2.5}px ${cp}px ${sp}px` },
    image: { ...base, src: "https://placehold.co/600x200/e2e8f0/64748b?text=Drop+Image+Here", alt: "Image description", width: "100%", align: "center", padding: `${sp}px 0`, href: "", retinaSrc: "", mobileWidth: "", border: { width: 0, style: "solid", color: b.dividerColor, radius: 0 } },
    button: { ...base, text: "Click Here →", href: "#", bgColor: b.btnBg, textColor: b.btnText, borderRadius: b.btnRadius, fontSize: b.btnFontSize, fontWeight: b.btnFontWeight, fontFamily: b.fontBody, padding: `${b.btnPaddingV}px ${b.btnPaddingH}px`, align: "center", outerPadding: `${sp * 2.5}px`, fullWidth: false, border: { width: 0, style: "solid", color: b.btnBg, radius: b.btnRadius }, trackingParams: "" },
    divider: { ...base, color: b.dividerColor, thickness: 1, style: "solid", padding: `${sp * 1.5}px ${cp}px`, width: "100%" },
    spacer: { ...base, height: sp * 3, mobileHeight: sp * 2 },
    columns: { ...base, ratio: "50-50", gap: sp * 2, padding: `${sp}px 0`, stackOnMobile: true, mobileOrder: "normal", verticalAlign: "top", children: { left: [], right: [] }, leftBg: "", rightBg: "" },
    dynamic: { ...base, variable: "first_name", fallback: "Friend", prefix: "Hi ", suffix: "!", fontSize: b.sizeBody, color: b.textPrimary, fontFamily: b.fontBody, padding: `${sp * 1.5}px ${cp}px` },
  };
  return m[t] || base;
}
function makeAEM(model) {
  const f = (AEM_FRAGS[model] || [])[0];
  return { _model: model, _fragId: f ? f.id : null, _var: f ? f.variations[0].name : "Default", _mode: "choose", _overrides: {}, _native: {}, bgColor: "", border: { width: 0, style: "solid", color: "#e2e8f0", radius: 0 }, padding: "0", hideOnMobile: false, hideOnDesktop: false };
}
function getAEMData(p) {
  const frags = AEM_FRAGS[p._model] || [];
  const frag = frags.find(f => f.id === p._fragId);
  if (p._mode === "native") return p._native || {};
  if (!frag) return null;
  const v = frag.variations.find(v => v.name === p._var) || frag.variations[0];
  if (!v) return null;
  const d = { ...v.data };
  if (p._overrides) Object.keys(p._overrides).forEach(k => { if (p._overrides[k] !== undefined && p._overrides[k] !== "") d[k] = p._overrides[k]; });
  return d;
}
function deepClone(comps) { return JSON.parse(JSON.stringify(comps)).map(function re(c) { c.id = uid("cp"); if (c.props?.children) Object.keys(c.props.children).forEach(k => { c.props.children[k] = (c.props.children[k] || []).map(re); }); return c; }); }

function StyleWrap({ props, children }) {
  const s = {};
  if (props.bgColor) s.background = props.bgColor;
  if (props.border?.width > 0) { s.border = `${props.border.width}px ${props.border.style} ${props.border.color}`; s.borderRadius = props.border.radius; }
  return Object.keys(s).length > 0 ? <div style={s}>{children}</div> : children;
}

function AEMRender({ model, data }) {
  if (!data) return <div style={{ padding: 20, textAlign: "center", background: "#fefce8", border: "2px dashed #eab308", borderRadius: 4, margin: 4, color: "#854d0e", fontSize: 12 }}>🔗 <strong>{CF_MODELS[model]?.label}</strong> — select fragment</div>;
  if (model === "hero") return <div style={{ background: data.bgColor || "#0ea5e9" }}>{data.image && <img src={data.image} alt={data.headline || ""} style={{ width: "100%", display: "block" }} />}<div style={{ padding: "16px 20px" }}>{data.headline && <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{data.headline}</div>}{data.subtext && <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 6 }}>{data.subtext}</div>}{data.cta && <div style={{ marginTop: 12 }}><a href={data.ctaUrl || "#"} style={{ display: "inline-block", padding: "12px 28px", background: "#fff", color: data.bgColor || "#0ea5e9", borderRadius: 6, textDecoration: "none", fontWeight: 700 }}>{data.cta}</a></div>}</div></div>;
  if (model === "banner") return <div style={{ background: data.bgColor || "#10b981" }}>{data.image ? <img src={data.image} alt="" style={{ width: "100%", display: "block" }} /> : <div style={{ padding: "14px 20px", textAlign: "center", color: "#fff", fontWeight: 600 }}>{data.headline}</div>}</div>;
  if (model === "productCard") return <div style={{ padding: 16, textAlign: "center" }}>{data.image && <img src={data.image} alt="" style={{ width: "100%", maxWidth: 280, borderRadius: 8, marginBottom: 10 }} />}<div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>{data.title}</div><div style={{ fontSize: 18, fontWeight: 700, color: "#0ea5e9", marginTop: 4 }}>{data.price} {data.originalPrice && <span style={{ fontSize: 13, color: "#94a3b8", textDecoration: "line-through" }}>{data.originalPrice}</span>}</div>{data.cta && <a href={data.ctaUrl || "#"} style={{ display: "inline-block", marginTop: 10, padding: "10px 24px", background: "#0ea5e9", color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: 13 }}>{data.cta}</a>}</div>;
  if (model === "testimonial") return <div style={{ padding: "20px 24px", background: "#f8fafc" }}><div style={{ display: "flex", gap: 3, marginBottom: 8 }}>{Array.from({ length: data.rating || 5 }).map((_, i) => <span key={i} style={{ color: "#f59e0b", fontSize: 16 }}>★</span>)}</div><div style={{ fontSize: 15, fontStyle: "italic", color: "#334155", marginBottom: 10, lineHeight: 1.5 }}>"{data.quote}"</div><div style={{ display: "flex", alignItems: "center", gap: 10 }}>{data.avatar && <img src={data.avatar} alt="" style={{ width: 36, height: 36, borderRadius: "50%" }} />}<div><div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{data.author}</div>{data.role && <div style={{ fontSize: 11, color: "#64748b" }}>{data.role}</div>}</div></div></div>;
  if (model === "articleTeaser") return <div>{data.image && <img src={data.image} alt="" style={{ width: "100%", display: "block" }} />}<div style={{ padding: "14px 20px" }}>{data.headline && <div style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 6 }}>{data.headline}</div>}{data.excerpt && <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, marginBottom: 10 }}>{data.excerpt}</div>}{data.cta && <a href={data.ctaUrl || "#"} style={{ color: "#0ea5e9", fontWeight: 600, textDecoration: "none" }}>{data.cta} →</a>}</div></div>;
  if (model === "ctaBlock") return <div style={{ padding: "32px 24px", background: data.bgColor || "#0f172a", textAlign: "center" }}>{data.headline && <div style={{ fontSize: 22, fontWeight: 700, color: data.textColor || "#fff" }}>{data.headline}</div>}{data.subtext && <div style={{ fontSize: 14, color: (data.textColor || "#fff") + "bb", marginTop: 6, marginBottom: 16 }}>{data.subtext}</div>}{data.cta && <a href={data.ctaUrl || "#"} style={{ display: "inline-block", padding: "12px 28px", background: "#0ea5e9", color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 700 }}>{data.cta}</a>}</div>;
  if (model === "socialBar") return <div style={{ padding: "16px 20px", textAlign: data.align || "center" }}>{(data.networks || []).map(n => <span key={n} style={{ display: "inline-block", width: 32, height: 32, background: "#64748b", borderRadius: "50%", margin: "0 4px", lineHeight: "32px", textAlign: "center", fontSize: 13, color: "#fff" }}>{n[0].toUpperCase()}</span>)}</div>;
  if (model === "footerBlock") return <div style={{ padding: "20px 24px", background: "#f8fafc", textAlign: "center" }}><div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>{(data.links || []).map((l, i) => <a key={i} href="#" style={{ fontSize: 12, color: "#0ea5e9", textDecoration: "none" }}>{l}</a>)}</div><div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{data.copyrightText}</div>{data.unsubscribeUrl && <a href={data.unsubscribeUrl} style={{ fontSize: 11, color: "#64748b", textDecoration: "underline" }}>Unsubscribe</a>}</div>;
  return null;
}
function NativeRender({ comp, brand }) {
  const p = (brand?.locked) ? applyBrandTokens(comp.type, comp.props, brand) : comp.props;
  if (comp.type === "text" || comp.type === "heading") return <StyleWrap props={p}><div style={{ padding: p.padding, textAlign: p.align, fontSize: p.fontSize, color: p.color, fontWeight: p.fontWeight, fontFamily: p.fontFamily || "inherit", lineHeight: p.lineHeight, letterSpacing: p.letterSpacing || 0, textTransform: p.textTransform || "none", textDecoration: p.textDecoration || "none" }}>{p.content}</div></StyleWrap>;
  if (comp.type === "image") { const brd = p.border?.width > 0 ? `${p.border.width}px ${p.border.style} ${p.border.color}` : "none"; return <StyleWrap props={{ ...p, border: { width: 0 } }}><div style={{ padding: p.padding, textAlign: p.align }}><img src={p.src} alt={p.alt} style={{ maxWidth: p.width, height: "auto", display: "inline-block", border: brd, borderRadius: p.border?.radius || 0 }} /></div></StyleWrap>; }
  if (comp.type === "button") return <StyleWrap props={{ ...p, bgColor: "", border: { width: 0 } }}><div style={{ padding: p.outerPadding, textAlign: p.fullWidth ? "center" : p.align }}><a href={p.href || "#"} style={{ display: p.fullWidth ? "block" : "inline-block", padding: p.padding, background: p.bgColor, color: p.textColor, borderRadius: p.borderRadius, fontSize: p.fontSize, fontWeight: p.fontWeight || "bold", fontFamily: p.fontFamily || "inherit", textDecoration: "none", textAlign: "center", border: p.border?.width > 0 ? `${p.border.width}px ${p.border.style} ${p.border.color}` : "none" }}>{p.text}</a></div></StyleWrap>;
  if (comp.type === "divider") return <StyleWrap props={p}><div style={{ padding: p.padding }}><hr style={{ border: "none", borderTop: `${p.thickness}px ${p.style} ${p.color}`, margin: 0, width: p.width }} /></div></StyleWrap>;
  if (comp.type === "spacer") return <div style={{ height: p.height }} />;
  if (comp.type === "dynamic") return <div style={{ padding: p.padding, fontSize: p.fontSize, color: p.color, fontFamily: p.fontFamily || "inherit" }}>{p.prefix}<span style={{ background: "#fef3c7", padding: "1px 4px", borderRadius: 3, color: "#92400e", fontFamily: "monospace", fontSize: 11 }}>{`{{${p.variable}|${p.fallback}}}`}</span>{p.suffix}</div>;
  return null;
}


// ─── Brand Kit Panel ───
function BrandKitPanel({ brand, onBrand }) {
  const [view, setView] = useState("colors");
  const set = (k, v) => onBrand(b => ({ ...b, [k]: v }));
  const pal = getBrandPalette(brand);
  return <div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 10, background: brand.locked ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", borderRadius: 8, border: `1px solid ${brand.locked ? "#ef444430" : "#10b98130"}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: brand.locked ? "#fca5a5" : "#6ee7b7" }}>{brand.locked ? "🔒 Brand Locked" : "🔓 Brand Unlocked"}</div>
        <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{brand.locked ? "Tokens enforced on export — authors cannot override" : "Authors can override — violations are flagged with ⚠"}</div>
      </div>
      <div onClick={() => set("locked", !brand.locked)} style={{ width: 40, height: 22, borderRadius: 11, background: brand.locked ? "#ef4444" : "#10b981", cursor: "pointer", position: "relative", flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute", top: 2, left: brand.locked ? 20 : 2, transition: "left 0.2s" }} />
      </div>
    </div>
    <F label="Organization"><input value={brand.org} onChange={e => set("org", e.target.value)} style={iS} /></F>
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 10, padding: "6px 8px", background: BG, borderRadius: 6, border: `1px solid ${BD}` }}>
      {pal.map((c, i) => <div key={i} title={c} style={{ width: 22, height: 22, borderRadius: 4, background: c, border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0 }} />)}
    </div>
    <div style={{ display: "flex", gap: 2, marginBottom: 12, background: BG, borderRadius: 6, padding: 2 }}>
      {[["colors","🎨 Colors"],["type","Aa Type"],["buttons","⬛ Btns"],["layout","📐 Layout"]].map(([v,l]) =>
        <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "5px 2px", background: view === v ? PB : "transparent", border: "none", borderRadius: 4, color: view === v ? "#e2e8f0" : "#64748b", cursor: "pointer", fontSize: 9 }}>{l}</button>)}
    </div>
    {view === "colors" && <div>
      <Section title="Brand Colors" defaultOpen={true}>
        <ColorF label="Primary" value={brand.primary} onChange={v => set("primary", v)} />
        <ColorF label="Secondary" value={brand.secondary} onChange={v => set("secondary", v)} />
        <ColorF label="Accent" value={brand.accent} onChange={v => set("accent", v)} />
        <ColorF label="Success" value={brand.success} onChange={v => set("success", v)} />
        <ColorF label="Danger" value={brand.danger} onChange={v => set("danger", v)} />
      </Section>
      <Section title="Text Colors" defaultOpen={false}>
        <ColorF label="Text Primary" value={brand.textPrimary} onChange={v => set("textPrimary", v)} brandColors={["#111827","#374151","#6b7280","#ffffff"]} />
        <ColorF label="Text Secondary" value={brand.textSecondary} onChange={v => set("textSecondary", v)} />
        <ColorF label="Text Inverse" value={brand.textInverse} onChange={v => set("textInverse", v)} />
        <ColorF label="Link Color" value={brand.linkColor} onChange={v => set("linkColor", v)} brandColors={[brand.primary, brand.secondary, brand.accent]} />
        <SelF label="Link Decoration" value={brand.linkDecoration} onChange={v => set("linkDecoration", v)} opts={["none","underline"]} />
      </Section>
      <Section title="Backgrounds" defaultOpen={false}>
        <ColorF label="Page BG" value={brand.bgPage} onChange={v => set("bgPage", v)} />
        <ColorF label="Content BG" value={brand.bgContent} onChange={v => set("bgContent", v)} />
        <ColorF label="Muted BG" value={brand.bgMuted} onChange={v => set("bgMuted", v)} />
        <ColorF label="Divider" value={brand.dividerColor} onChange={v => set("dividerColor", v)} />
      </Section>
    </div>}
    {view === "type" && <div>
      <Section title="Fonts" defaultOpen={true}>
        <F label="Heading Font"><input value={brand.fontHeading} onChange={e => set("fontHeading", e.target.value)} style={iS} placeholder="Arial, Helvetica, sans-serif" /></F>
        <F label="Body Font"><input value={brand.fontBody} onChange={e => set("fontBody", e.target.value)} style={iS} placeholder="Arial, Helvetica, sans-serif" /></F>
      </Section>
      <Section title="Type Scale" defaultOpen={true}>
        <NumF label="H1" value={brand.sizeH1} onChange={v => set("sizeH1", v)} min={20} max={72} />
        <NumF label="H2" value={brand.sizeH2} onChange={v => set("sizeH2", v)} min={16} max={60} />
        <NumF label="H3" value={brand.sizeH3} onChange={v => set("sizeH3", v)} min={14} max={48} />
        <NumF label="Body" value={brand.sizeBody} onChange={v => set("sizeBody", v)} min={12} max={24} />
        <NumF label="Small" value={brand.sizeSmall} onChange={v => set("sizeSmall", v)} min={10} max={18} />
      </Section>
      <Section title="Style" defaultOpen={false}>
        <SelF label="Heading Weight" value={brand.fontWeightHeading} onChange={v => set("fontWeightHeading", v)} opts={["400","500","600","700","800","900"]} />
        <SelF label="Body Weight" value={brand.fontWeightBody} onChange={v => set("fontWeightBody", v)} opts={["300","400","500"]} />
        <NumF label="Body Line Height" value={brand.lineHeightBody} onChange={v => set("lineHeightBody", v)} min={1} max={3} />
        <NumF label="Heading Line Height" value={brand.lineHeightHeading} onChange={v => set("lineHeightHeading", v)} min={1} max={2} />
      </Section>
      <div style={{ background: brand.bgContent, padding: 14, borderRadius: 8, border: `1px solid ${BD}`, marginTop: 8 }}>
        <div style={{ fontFamily: brand.fontHeading, fontSize: brand.sizeH2, fontWeight: brand.fontWeightHeading, color: brand.textPrimary, lineHeight: brand.lineHeightHeading, marginBottom: 8 }}>Heading Preview</div>
        <div style={{ fontFamily: brand.fontBody, fontSize: brand.sizeBody, fontWeight: brand.fontWeightBody, color: brand.textPrimary, lineHeight: brand.lineHeightBody, marginBottom: 6 }}>Body text. How your email copy looks to recipients.</div>
        <div style={{ fontFamily: brand.fontBody, fontSize: brand.sizeSmall, color: brand.textSecondary }}>Small text · <span style={{ color: brand.linkColor, textDecoration: brand.linkDecoration }}>link style</span></div>
      </div>
    </div>}
    {view === "buttons" && <div>
      <Section title="Primary Button" defaultOpen={true}>
        <ColorF label="Background" value={brand.btnBg} onChange={v => set("btnBg", v)} brandColors={[brand.primary, brand.secondary, brand.accent]} />
        <ColorF label="Text Color" value={brand.btnText} onChange={v => set("btnText", v)} brandColors={["#ffffff", brand.textPrimary]} />
        <NumF label="Border Radius" value={brand.btnRadius} onChange={v => set("btnRadius", v)} min={0} max={32} />
        <NumF label="Font Size" value={brand.btnFontSize} onChange={v => set("btnFontSize", v)} min={12} max={24} />
        <SelF label="Font Weight" value={brand.btnFontWeight} onChange={v => set("btnFontWeight", v)} opts={["500","600","700","800"]} />
        <NumF label="Padding H" value={brand.btnPaddingH} onChange={v => set("btnPaddingH", v)} min={8} max={60} />
        <NumF label="Padding V" value={brand.btnPaddingV} onChange={v => set("btnPaddingV", v)} min={6} max={32} />
      </Section>
      <Section title="Secondary Button" defaultOpen={false}>
        <ColorF label="Background" value={brand.btnBgSecondary} onChange={v => set("btnBgSecondary", v)} brandColors={[brand.primary, brand.secondary, brand.accent]} />
        <ColorF label="Text Color" value={brand.btnTextSecondary} onChange={v => set("btnTextSecondary", v)} brandColors={["#ffffff", brand.textPrimary]} />
      </Section>
      <div style={{ background: brand.bgContent, padding: 16, borderRadius: 8, border: `1px solid ${BD}`, textAlign: "center", marginTop: 8 }}>
        <a href="#" style={{ display: "inline-block", padding: `${brand.btnPaddingV}px ${brand.btnPaddingH}px`, background: brand.btnBg, color: brand.btnText, borderRadius: brand.btnRadius, fontSize: brand.btnFontSize, fontWeight: brand.btnFontWeight, fontFamily: brand.fontBody, textDecoration: "none", marginRight: 8 }}>Primary CTA</a>
        <a href="#" style={{ display: "inline-block", padding: `${brand.btnPaddingV}px ${brand.btnPaddingH}px`, background: brand.btnBgSecondary, color: brand.btnTextSecondary, borderRadius: brand.btnRadius, fontSize: brand.btnFontSize, fontWeight: brand.btnFontWeight, fontFamily: brand.fontBody, textDecoration: "none" }}>Secondary</a>
      </div>
    </div>}
    {view === "layout" && <div>
      <NumF label="Email Width (px)" value={brand.emailWidth} onChange={v => set("emailWidth", v)} min={400} max={800} />
      <NumF label="Content Padding (px)" value={brand.contentPadding} onChange={v => set("contentPadding", v)} min={8} max={60} />
      <NumF label="Spacing Unit (px)" value={brand.spacingUnit} onChange={v => set("spacingUnit", v)} min={4} max={24} />
      <div style={{ marginTop: 12, padding: 10, background: "rgba(99,102,241,0.08)", borderRadius: 6, border: "1px solid #6366f125", fontSize: 9, color: "#94a3b8", lineHeight: 1.6 }}>When Brand is Locked, all HTML exports use brand tokens for fonts, colors, buttons, and spacing — ignoring per-component overrides.</div>
      <button onClick={async () => { try { await window.storage.set("brand_kit", JSON.stringify(brand), true); alert("Brand kit saved globally!"); } catch {} }} style={{ width: "100%", marginTop: 10, padding: 8, background: "#0ea5e9", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>💾 Save Brand Kit</button>
      <button onClick={() => onBrand(() => ({ ...DEFAULT_BRAND }))} style={{ width: "100%", marginTop: 4, padding: 8, background: BD, border: "none", borderRadius: 6, color: "#94a3b8", cursor: "pointer", fontSize: 11 }}>↩ Reset to Defaults</button>
    </div>}
  </div>;
}

// ─── Save Block Modal ───
function SaveBlockModal({ comps, onSave, onClose }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("Content");
  const [tags, setTags] = useState("");
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
    <div style={{ width: 460, background: PB, borderRadius: 14, border: `1px solid ${BD}`, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BD}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: BG }}>
        <div><div style={{ fontSize: 14, fontWeight: 600 }}>💾 Save as Reusable Block</div><div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{comps.length} component{comps.length !== 1 ? "s" : ""} will be saved</div></div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>
      <div style={{ padding: 18 }}>
        <F label="Block Name *"><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring Hero CTA" style={iS} autoFocus /></F>
        <F label="Description"><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this block used for..." rows={2} style={{ ...iS, resize: "vertical" }} /></F>
        <SelF label="Category" value={cat} onChange={setCat} opts={BLOCK_CATEGORIES} />
        <F label="Tags (comma-separated)"><input value={tags} onChange={e => setTags(e.target.value)} placeholder="cta, hero, promotional" style={iS} /></F>
        <div style={{ background: BG, borderRadius: 8, padding: 10, marginBottom: 14, border: `1px solid ${BD}` }}>
          <div style={lS}>Components ({comps.length})</div>
          {comps.slice(0, 6).map((c, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 11, color: "#cbd5e1" }}><span>{c.type === "aem" ? CF_MODELS[c.props._model]?.icon : NATIVE[c.type]?.icon}</span><span>{c.type === "aem" ? CF_MODELS[c.props._model]?.label : NATIVE[c.type]?.label}</span></div>)}
          {comps.length > 6 && <div style={{ fontSize: 9, color: "#475569" }}>+ {comps.length - 6} more</div>}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: BD, border: "none", borderRadius: 6, color: "#94a3b8", cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), desc, cat, tags: tags.split(",").map(t => t.trim()).filter(Boolean), comps: deepClone(comps), createdAt: new Date().toISOString() }); onClose(); }} disabled={!name.trim()} style={{ padding: "8px 20px", background: name.trim() ? "#10b981" : BD, border: "none", borderRadius: 6, color: name.trim() ? "#fff" : "#64748b", cursor: name.trim() ? "pointer" : "default", fontWeight: 600 }}>Save Block</button>
        </div>
      </div>
    </div>
  </div>;
}

// ─── Blocks Library Panel ───
function BlocksPanel({ blocks, onInsert, onDelete, onSave, canvasComps, onDragBlock }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [showSave, setShowSave] = useState(false);
  const allCats = ["All", ...Array.from(new Set(blocks.map(b => b.cat)))];
  const filtered = blocks.filter(b => {
    if (filterCat !== "All" && b.cat !== filterCat) return false;
    if (search) return b.name.toLowerCase().includes(search.toLowerCase()) || (b.tags || []).some(t => t.includes(search.toLowerCase()));
    return true;
  });
  return <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
    <div style={{ padding: "8px 10px 4px", flexShrink: 0 }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search blocks..." style={{ ...iS, marginBottom: 6 }} />
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {allCats.map(c => <button key={c} onClick={() => setFilterCat(c)} style={{ padding: "2px 8px", fontSize: 9, borderRadius: 20, border: `1px solid ${filterCat === c ? "#10b981" : BD}`, background: filterCat === c ? "#10b98118" : "transparent", color: filterCat === c ? "#6ee7b7" : "#64748b", cursor: "pointer" }}>{c}</button>)}
      </div>
    </div>
    <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: "30px 16px" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>{blocks.length === 0 ? "No saved blocks yet" : "No results"}</div>
        <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>{blocks.length === 0 ? "Build something great, then save it as a reusable block below." : "Try different search terms or category."}</div>
      </div>}
      {filtered.map(block => <div key={block.id} style={{ marginBottom: 8, borderRadius: 8, border: `1px solid ${BD}`, overflow: "hidden", background: BG }}>
        <div style={{ height: 44, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, padding: "0 8px", position: "relative" }}>
          {(block.comps || []).slice(0, 6).map((c, i) => <div key={i} style={{ height: 26, flex: 1, maxWidth: 36, background: c.type === "button" ? (c.props.bgColor || "#0ea5e9") : c.type === "image" ? "#e2e8f0" : c.type === "heading" ? "#1e293b" : "#f1f5f9", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }} title={c.type}>{c.type === "aem" ? CF_MODELS[c.props._model]?.icon : NATIVE[c.type]?.icon}</div>)}
          <div style={{ position: "absolute", top: 3, right: 4, background: "#10b98118", border: "1px solid #10b98140", borderRadius: 8, padding: "1px 5px", fontSize: 8, color: "#6ee7b7" }}>{block.cat}</div>
        </div>
        <div style={{ padding: "8px 10px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{block.name}</div>
              {block.desc && <div style={{ fontSize: 9, color: "#64748b", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.desc}</div>}
              <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{block.comps?.length} component{block.comps?.length !== 1 ? "s" : ""} · {new Date(block.createdAt).toLocaleDateString()}</div>
              {(block.tags || []).length > 0 && <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 3 }}>{block.tags.map(t => <span key={t} style={{ fontSize: 8, background: "#1e3a5f", color: "#7dd3fc", padding: "1px 5px", borderRadius: 8 }}>{t}</span>)}</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
              <button draggable onDragStart={e => onDragBlock && onDragBlock(e, block.id)} onClick={() => onInsert(block)} style={{ padding: "4px 10px", background: "#10b981", border: "none", borderRadius: 4, color: "#fff", cursor: "grab", fontSize: 10, fontWeight: 600 }}>+ Insert</button>
              <button onClick={() => onDelete(block.id)} style={{ padding: "3px 8px", background: "#7f1d1d", border: "none", borderRadius: 4, color: "#fca5a5", cursor: "pointer", fontSize: 9 }}>Delete</button>
            </div>
          </div>
        </div>
      </div>)}
    </div>
    <div style={{ padding: 10, borderTop: `1px solid ${BD}`, flexShrink: 0 }}>
      <button onClick={() => setShowSave(true)} disabled={canvasComps.length === 0} style={{ width: "100%", padding: 9, background: canvasComps.length > 0 ? "#065f46" : BD, border: "none", borderRadius: 6, color: canvasComps.length > 0 ? "#6ee7b7" : "#475569", cursor: canvasComps.length > 0 ? "pointer" : "default", fontSize: 11, fontWeight: 600 }}>
        💾 Save Canvas as Block ({canvasComps.length} component{canvasComps.length !== 1 ? "s" : ""})
      </button>
    </div>
    {showSave && <SaveBlockModal comps={canvasComps} onSave={b => { onSave(b); setShowSave(false); }} onClose={() => setShowSave(false)} />}
  </div>;
}


function FragPicker({ model, onSelect, onClose }) {
  const frags = AEM_FRAGS[model] || [];
  const [sel, setSel] = useState(frags[0]?.id || null);
  const [sv, setSv] = useState(frags[0]?.variations?.[0]?.name || "Default");
  const sf = frags.find(f => f.id === sel);
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}><div style={{ width: 680, maxHeight: "80vh", background: PB, borderRadius: 12, border: `1px solid ${BD}`, display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
    <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BD}`, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 14, fontWeight: 600 }}>🔗 {CF_MODELS[model]?.label}</span><button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}>✕</button></div>
    <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", gap: 16 }}>
      <div style={{ flex: 1 }}>{frags.map(f => <div key={f.id} onClick={() => { setSel(f.id); setSv(f.variations[0]?.name); }} style={{ padding: 10, marginBottom: 6, borderRadius: 8, cursor: "pointer", background: sel === f.id ? BG : "transparent", border: `1px solid ${sel === f.id ? "#0ea5e9" : "transparent"}` }}><div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{f.title}</div><div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{f.path}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{f.variations.length} variations</div></div>)}</div>
      {sf && <div style={{ width: 260, background: BG, borderRadius: 8, padding: 12 }}><div style={lS}>Variations</div>{sf.variations.map(v => <div key={v.name} onClick={() => setSv(v.name)} style={{ padding: 8, marginBottom: 4, borderRadius: 6, cursor: "pointer", background: sv === v.name ? PB : "transparent", border: `1px solid ${sv === v.name ? "#0ea5e9" : BD}` }}><div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0" }}>{v.name}</div>{v.data.headline && <div style={{ fontSize: 10, color: "#94a3b8" }}>{v.data.headline}</div>}{v.data.image && <img src={v.data.image} alt="" style={{ width: "100%", height: 40, objectFit: "cover", borderRadius: 4, marginTop: 4 }} />}</div>)}</div>}
    </div>
    <div style={{ padding: "12px 18px", borderTop: `1px solid ${BD}`, display: "flex", justifyContent: "flex-end", gap: 8 }}><button onClick={onClose} style={{ padding: "8px 16px", background: BD, border: "none", borderRadius: 6, color: "#94a3b8", cursor: "pointer" }}>Cancel</button><button onClick={() => sel && onSelect(sel, sv)} disabled={!sel} style={{ padding: "8px 16px", background: sel ? "#0ea5e9" : BD, border: "none", borderRadius: 6, color: sel ? "#fff" : "#64748b", cursor: "pointer", fontWeight: 600 }}>Insert</button></div>
  </div></div>;
}

// ─── HTML Export Engine ───
function generateHTML(comps, gS, meta, brand) {
  const b = brand || DEFAULT_BRAND;
  const esc = s => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  function compToHTML(c) {
    const p = c.props;
    if (c.type === "aem") { const d = getAEMData(p); if (!d) return ""; return aemToHTML(p._model, d); }
    const ew = parseInt(gS.w) || 600;

    // ── TEXT / HEADING ──
    // Fix: use background-color (not shorthand "background:"), add bgcolor attr for Outlook Word engine
    // Fix: add mso-line-height-rule:exactly for Outlook line-height consistency
    if (c.type === "text" || c.type === "heading") {
      const bgAttr = p.bgColor ? ` bgcolor="${p.bgColor}"` : "";
      return `<tr><td${bgAttr} style="padding:${p.padding};text-align:${p.align};font-size:${p.fontSize}px;color:${p.color};font-weight:${p.fontWeight};font-family:${p.fontFamily || b.fontBody || gS.font};line-height:${p.lineHeight};letter-spacing:${p.letterSpacing || 0}px;text-transform:${p.textTransform || "none"};mso-line-height-rule:exactly;${p.bgColor ? `background-color:${p.bgColor};` : ""}">${esc(p.content)}</td></tr>`;
    }

    // ── IMAGE ──
    // Fix: no border-radius in CSS for Outlook (strip it from img style)
    // Fix: add Outlook MSO comment hack to prevent image ghosting, no background-image shorthand
    if (c.type === "image") {
      const brdStyle = p.border?.width > 0 ? `border:${p.border.width}px ${p.border.style} ${p.border.color};` : "border:0;";
      const imgTag = `<img src="${esc(p.src)}" alt="${esc(p.alt || "")}" width="${parseInt(p.width) || ew}" style="display:block;max-width:${p.width};width:100%;height:auto;${brdStyle}" />`;
      return `<tr><td style="padding:${p.padding};text-align:${p.align};">${p.href ? `<a href="${esc(p.href)}" target="_blank" style="text-decoration:none;">` : ""}${imgTag}${p.href ? "</a>" : ""}</td></tr>`;
    }

    // ── BUTTON ──
    // Fix: VML for Outlook (handles border-radius natively via arcsize)
    // Fix: use background-color not shorthand in <a> style for Gmail
    // Fix: mso-hide:all on the non-VML <a> so Outlook only sees VML version
    if (c.type === "button") {
      const btnRadius = p.borderRadius || 6;
      const arcPct = Math.round(btnRadius / 20 * 100);
      const btnPad = p.padding || "14px 32px";
      const widthStyle = p.fullWidth ? `width:100%;` : "";
      const borderStyle = p.border?.width > 0 ? `border:${p.border.width}px ${p.border.style} ${p.border.color};` : "";
      return `<tr><td style="padding:${p.outerPadding || "20px"};text-align:${p.fullWidth ? "center" : (p.align || "center")};">` +
        `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(p.href || "#")}" style="height:auto;v-text-anchor:middle;${widthStyle}mso-wrap-style:none;" arcsize="${arcPct}%" strokecolor="${p.bgColor}" fillcolor="${p.bgColor}"><w:anchorlock/><center style="color:${p.textColor};font-family:${p.fontFamily || gS.font};font-size:${p.fontSize}px;font-weight:${p.fontWeight || "bold"};mso-line-height-rule:exactly;">${esc(p.text)}</center></v:roundrect><![endif]-->` +
        `<!--[if !mso]><!--><a href="${esc(p.href || "#")}" target="_blank" style="display:${p.fullWidth ? "block" : "inline-block"};padding:${btnPad};background-color:${p.bgColor};color:${p.textColor};border-radius:${btnRadius}px;font-size:${p.fontSize}px;font-weight:${p.fontWeight || "bold"};font-family:${p.fontFamily || gS.font};text-decoration:none;text-align:center;${widthStyle}${borderStyle}mso-hide:all;">${esc(p.text)}</a><!--<![endif]-->` +
        `</td></tr>`;
    }

    // ── DIVIDER ──
    // Fix: mso-line-height-rule on both cells; use explicit 0 font-size/line-height
    if (c.type === "divider") {
      return `<tr><td style="padding:${p.padding};font-size:0;line-height:0;mso-line-height-rule:exactly;"><table role="presentation" width="${p.width || "100%"}" border="0" cellpadding="0" cellspacing="0"><tr><td style="border-top:${p.thickness}px ${p.style} ${p.color};font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td></tr></table></td></tr>`;
    }

    // ── SPACER ──
    // Fix: height attribute for Outlook (respects HTML height attr, not CSS height)
    if (c.type === "spacer") {
      return `<tr><td height="${p.height}" style="height:${p.height}px;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td></tr>`;
    }

    // ── DYNAMIC / MERGE TAG ──
    if (c.type === "dynamic") {
      return `<tr><td style="padding:${p.padding};font-size:${p.fontSize}px;color:${p.color};font-family:${p.fontFamily || gS.font};mso-line-height-rule:exactly;">${esc(p.prefix)}{{${p.variable}|${p.fallback}}}${esc(p.suffix)}</td></tr>`;
    }

    // ── 2-COLUMN ──
    // Fix: Outlook uses MSO table with explicit widths (no flexbox)
    // Fix: Gmail Android — inline-block columns degrade gracefully to 100% stacked on narrow viewports
    if (c.type === "columns") {
      const r = p.ratio.split("-").map(Number); const tot = r[0] + r[1];
      const lw = Math.round(r[0] / tot * ew); const rw = Math.round(r[1] / tot * ew);
      const lBg = p.leftBg ? ` bgcolor="${p.leftBg}"` : "";
      const rBg = p.rightBg ? ` bgcolor="${p.rightBg}"` : "";
      const lBgStyle = p.leftBg ? `background-color:${p.leftBg};` : "";
      const rBgStyle = p.rightBg ? `background-color:${p.rightBg};` : "";
      const leftHTML = (p.children?.left || []).map(compToHTML).join("");
      const rightHTML = (p.children?.right || []).map(compToHTML).join("");
      return `<tr><td style="padding:${p.padding};">` +
        `<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
        `<td${lBg} valign="${p.verticalAlign || "top"}" width="${lw}" style="${lBgStyle}"><![endif]-->` +
        `<div class="mobile-stack" style="display:inline-block;vertical-align:${p.verticalAlign || "top"};width:100%;max-width:${lw}px;${lBgStyle}">` +
        `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">${leftHTML}</table></div>` +
        `<!--[if mso]></td><td${rBg} valign="${p.verticalAlign || "top"}" width="${rw}" style="${rBgStyle}"><![endif]-->` +
        `<div class="mobile-stack" style="display:inline-block;vertical-align:${p.verticalAlign || "top"};width:100%;max-width:${rw}px;${rBgStyle}">` +
        `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">${rightHTML}</table></div>` +
        `<!--[if mso]></td></tr></table><![endif]-->` +
        `</td></tr>`;
    }
    return "";
  }

  // ── AEM component HTML ──
  // Fix: use bgcolor attr + background-color CSS (not shorthand), no CSS background-image
  function aemToHTML(model, d) {
    const ew = parseInt(gS.w) || 600;
    if (model === "hero") {
      const bg = d.bgColor || "#0ea5e9";
      return `<tr><td bgcolor="${bg}" style="background-color:${bg};">` +
        (d.image ? `<img src="${esc(d.image)}" alt="${esc(d.headline || "")}" width="${ew}" style="display:block;width:100%;height:auto;border:0;" />` : "") +
        `<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="padding:16px 20px;">` +
        (d.headline ? `<p style="margin:0 0 6px 0;font-size:24px;font-weight:700;color:#ffffff;mso-line-height-rule:exactly;">${esc(d.headline)}</p>` : "") +
        (d.subtext ? `<p style="margin:0 0 12px 0;font-size:14px;color:rgba(255,255,255,0.85);mso-line-height-rule:exactly;">${esc(d.subtext)}</p>` : "") +
        (d.cta ? `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(d.ctaUrl || "#")}" style="height:auto;v-text-anchor:middle;" arcsize="15%" strokecolor="#ffffff" fillcolor="#ffffff"><w:anchorlock/><center style="color:${bg};font-size:15px;font-weight:700;font-family:Arial,sans-serif;">${esc(d.cta)}</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="${esc(d.ctaUrl || "#")}" target="_blank" style="display:inline-block;padding:12px 28px;background-color:#ffffff;color:${bg};border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;mso-hide:all;">${esc(d.cta)}</a><!--<![endif]-->` : "") +
        `</td></tr></table></td></tr>`;
    }
    if (model === "banner") {
      const bg = d.bgColor || "#10b981";
      return `<tr><td bgcolor="${bg}" style="background-color:${bg};">` +
        (d.image ? `<img src="${esc(d.image)}" alt="${esc(d.headline || "")}" width="${ew}" style="display:block;width:100%;height:auto;border:0;" />` :
          `<p style="margin:0;padding:14px 20px;text-align:center;color:#ffffff;font-weight:600;font-size:16px;">${esc(d.headline || "")}</p>`) +
        `</td></tr>`;
    }
    return `<tr><td style="padding:16px;">[${model} content]</td></tr>`;
  }
  const bodyHTML = comps.map(compToHTML).join("");
  const emailWidth = parseInt(gS.w) || 600;
  // ── Gmail: only use simple element selectors (no :hover, :nth-child, etc.)
  // ── Gmail Android dark mode: explicit color-scheme + forced bg/text overrides
  // ── Outlook Word engine: mso-line-height-rule, mso-table fixes, bgcolor attrs
  // ── A11y: lang="en" on <html>, role="presentation" on all layout tables (done inline)
  const styleBlock = `
    /* ── Reset (Outlook, Gmail, Yahoo) ── */
    body,table,td,a,p,span,div{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse!important}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;display:block}
    body{margin:0!important;padding:0!important;width:100%!important;min-width:100%!important}
    /* ── Gmail: no animations (Gmail strips @keyframes but explicit none is safe) ── */
    *{-webkit-animation:none!important;animation:none!important;-webkit-transition:none!important;transition:none!important}
    /* ── Gmail: suppress blue auto-links on iOS/Apple Mail ── */
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}
    /* ── Gmail Android dark mode: opt-out of forced dark inversion ── */
    [data-ogsc] body,[data-ogsb] body{background-color:${gS.bgColor}!important}
    [data-ogsc] .email-body,[data-ogsb] .email-body{background-color:${gS.contentBg}!important;color:#333333!important}
    /* ── Yahoo: class prefix workaround ── */
    .ExternalClass{width:100%}
    .ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div{line-height:100%}
    /* ── Mobile responsive (Gmail Android supports this) ── */
    @media only screen and (max-width:${emailWidth}px){
      .mobile-full{width:100%!important;max-width:100%!important}
      .mobile-hide{display:none!important;max-height:0!important;overflow:hidden!important;mso-hide:all!important}
      .mobile-stack{display:block!important;width:100%!important;max-width:100%!important}
      .mobile-center{text-align:center!important}
      .mobile-padding{padding-left:16px!important;padding-right:16px!important}
    }
  `.replace(/\n\s*/g, " ").trim();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<!--[if !mso]><!-->
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<!--<![endif]-->
<title>${esc(meta.subject)}</title>
<!--[if mso]>
<noscript><xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml></noscript>
<![endif]-->
<style type="text/css">${styleBlock}</style>
</head>
<body style="margin:0!important;padding:0!important;background-color:${gS.bgColor};word-spacing:normal;-webkit-font-smoothing:antialiased;">
<!--[if mso]><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td bgcolor="${gS.bgColor}"><![endif]-->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(meta.preheader || "")}${"\u200c\u00a0".repeat(40)}</div>
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${gS.bgColor}" style="background-color:${gS.bgColor};">
  <tr>
    <td align="center" style="padding:20px 0;">
      <!--[if mso]><table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="${emailWidth}"><tr><td><![endif]-->
      <table role="presentation" class="mobile-full email-body" width="${emailWidth}" border="0" cellpadding="0" cellspacing="0" bgcolor="${gS.contentBg}" style="background-color:${gS.contentBg};font-family:${gS.font};max-width:${emailWidth}px;">
        ${bodyHTML}
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}

// ─── Email Client Definitions ───
const EMAIL_CLIENTS = [
  { id: "gmail-web", label: "Gmail Web", icon: "G", color: "#EA4335", width: 600, darkMode: false, quirks: { removeFlexGap: false, limitFontStacks: true, removePositioning: false }, issues: ["No support for CSS animations", "No support for background-image shorthand", "Some CSS3 selectors stripped"] },
  { id: "gmail-android", label: "Gmail Android", icon: "GA", color: "#EA4335", width: 375, darkMode: false, quirks: { mobile: true }, issues: ["Forces dark mode on some versions", "Limited CSS support"] },
  { id: "outlook-2016", label: "Outlook 2016", icon: "O", color: "#0078D4", width: 600, darkMode: false, quirks: { noFlexbox: true, noBorderRadius: true, noBackgroundImg: true, wordRendering: true }, issues: ["No flexbox support", "No border-radius (use VML)", "No CSS background images", "Uses Word rendering engine"] },
  { id: "outlook-365", label: "Outlook 365", icon: "O365", color: "#0078D4", width: 600, darkMode: false, quirks: { noFlexbox: true, noBorderRadius: true }, issues: ["Similar to Outlook 2016/2019", "Some modern CSS partially supported"] },
  { id: "outlook-mac", label: "Outlook Mac", icon: "OM", color: "#0078D4", width: 600, darkMode: true, quirks: { betterCSS: true }, issues: ["Better CSS support than Windows Outlook", "Dark mode auto-inversion"] },
  { id: "apple-mail", label: "Apple Mail", icon: "✉", color: "#1C8EF9", width: 600, darkMode: true, quirks: { fullSupport: true }, issues: ["Best CSS support overall", "Supports dark mode media queries", "Auto-detects phone numbers/dates"] },
  { id: "apple-iphone", label: "iPhone Mail", icon: "📱", color: "#1C8EF9", width: 390, darkMode: true, quirks: { mobile: true, fullSupport: true }, issues: ["Excellent CSS support", "Supports dark mode", "Small tap targets an issue"] },
  { id: "samsung-mail", label: "Samsung Mail", icon: "S", color: "#1428A0", width: 375, darkMode: false, quirks: { mobile: true, limitedCSS: true }, issues: ["Limited CSS3 support", "Some fonts substituted"] },
  { id: "yahoo-web", label: "Yahoo Mail", icon: "Y!", color: "#6001D2", width: 600, darkMode: false, quirks: { prefixClasses: true }, issues: ["Adds yahoo- prefix to class names", "Some CSS properties stripped", "Wraps content in extra divs"] },
  { id: "thunderbird", label: "Thunderbird", icon: "TB", color: "#0A84FF", width: 600, darkMode: true, quirks: { goodCSS: true }, issues: ["Good CSS support", "Some advanced selectors not supported"] },
];

// ─── Compatibility Rules ───
const CSS_COMPAT = [
  { feature: "CSS Flexbox", clients: { "gmail-web": false, "gmail-android": false, "outlook-2016": false, "outlook-365": false, "outlook-mac": true, "apple-mail": true, "apple-iphone": true, "samsung-mail": false, "yahoo-web": false, "thunderbird": true } },
  { feature: "CSS Grid", clients: { "gmail-web": false, "gmail-android": false, "outlook-2016": false, "outlook-365": false, "outlook-mac": true, "apple-mail": true, "apple-iphone": true, "samsung-mail": false, "yahoo-web": false, "thunderbird": true } },
  { feature: "Border Radius", clients: { "gmail-web": true, "gmail-android": true, "outlook-2016": false, "outlook-365": false, "outlook-mac": true, "apple-mail": true, "apple-iphone": true, "samsung-mail": true, "yahoo-web": true, "thunderbird": true } },
  { feature: "Web Fonts (@font-face)", clients: { "gmail-web": false, "gmail-android": false, "outlook-2016": false, "outlook-365": false, "outlook-mac": true, "apple-mail": true, "apple-iphone": true, "samsung-mail": false, "yahoo-web": false, "thunderbird": true } },
  { feature: "Background Images", clients: { "gmail-web": false, "gmail-android": false, "outlook-2016": false, "outlook-365": false, "outlook-mac": true, "apple-mail": true, "apple-iphone": true, "samsung-mail": true, "yahoo-web": true, "thunderbird": true } },
  { feature: "CSS Animations", clients: { "gmail-web": false, "gmail-android": false, "outlook-2016": false, "outlook-365": false, "outlook-mac": false, "apple-mail": true, "apple-iphone": true, "samsung-mail": false, "yahoo-web": false, "thunderbird": false } },
  { feature: "Dark Mode (prefers-color-scheme)", clients: { "gmail-web": false, "gmail-android": false, "outlook-2016": false, "outlook-365": false, "outlook-mac": true, "apple-mail": true, "apple-iphone": true, "samsung-mail": false, "yahoo-web": false, "thunderbird": true } },
  { feature: "Media Queries", clients: { "gmail-web": true, "gmail-android": true, "outlook-2016": false, "outlook-365": false, "outlook-mac": true, "apple-mail": true, "apple-iphone": true, "samsung-mail": true, "yahoo-web": true, "thunderbird": true } },
  { feature: "SVG Images", clients: { "gmail-web": false, "gmail-android": false, "outlook-2016": false, "outlook-365": false, "outlook-mac": true, "apple-mail": true, "apple-iphone": true, "samsung-mail": false, "yahoo-web": false, "thunderbird": true } },
  { feature: "Position: absolute/fixed", clients: { "gmail-web": false, "gmail-android": false, "outlook-2016": false, "outlook-365": false, "outlook-mac": true, "apple-mail": true, "apple-iphone": true, "samsung-mail": false, "yahoo-web": false, "thunderbird": true } },
  { feature: "VML (Outlook buttons)", clients: { "gmail-web": false, "gmail-android": false, "outlook-2016": true, "outlook-365": true, "outlook-mac": false, "apple-mail": false, "apple-iphone": false, "samsung-mail": false, "yahoo-web": false, "thunderbird": false } },
  { feature: "HTML5 Video", clients: { "gmail-web": false, "gmail-android": false, "outlook-2016": false, "outlook-365": false, "outlook-mac": false, "apple-mail": true, "apple-iphone": true, "samsung-mail": false, "yahoo-web": false, "thunderbird": false } },
];

// ─── Spam Score Analyzer ───
function analyzeSpam(html, meta, comps) {
  const issues = [];
  let score = 0;
  const subj = meta.subject || "";
  // Subject checks
  if (!subj) { issues.push({ sev: "error", msg: "Missing subject line" }); score += 20; }
  if (subj.length > 70) { issues.push({ sev: "warn", msg: `Subject too long (${subj.length} chars, ideal <50)` }); score += 5; }
  if (/[A-Z]{3,}/.test(subj)) { issues.push({ sev: "warn", msg: "Excessive caps in subject line" }); score += 8; }
  if (/[!]{2,}/.test(subj)) { issues.push({ sev: "warn", msg: "Multiple exclamation marks in subject" }); score += 8; }
  if (/free|win|winner|urgent|act now|click here|limited time|guaranteed|cash|prize/i.test(subj)) { issues.push({ sev: "error", msg: "Spam trigger words in subject: " + subj.match(/free|win|winner|urgent|act now|click here|limited time|guaranteed|cash|prize/gi).join(", ") }); score += 15; }
  // Preheader
  if (!meta.preheader) { issues.push({ sev: "warn", msg: "No preheader text — missed inbox preview opportunity" }); score += 3; }
  // From
  if (!meta.fromName) { issues.push({ sev: "warn", msg: "No From Name set" }); score += 5; }
  if (!meta.fromEmail) { issues.push({ sev: "warn", msg: "No From Email set" }); score += 5; }
  // Content checks
  const imgCount = (html.match(/<img/gi) || []).length;
  const textLen = html.replace(/<[^>]+>/g, "").length;
  if (imgCount > 0 && textLen < 100) { issues.push({ sev: "error", msg: "Image-heavy with little text — high spam risk" }); score += 20; }
  if (html.includes("!important") && (html.match(/!important/g) || []).length > 5) { issues.push({ sev: "info", msg: "Many !important rules may affect rendering" }); }
  // Check for unsubscribe
  const hasUnsub = /unsubscribe/i.test(html);
  if (!hasUnsub) { issues.push({ sev: "error", msg: "No unsubscribe link — CAN-SPAM violation risk" }); score += 25; }
  // Image alt texts
  const imgNoAlt = (html.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;
  if (imgNoAlt > 0) { issues.push({ sev: "warn", msg: `${imgNoAlt} image(s) missing alt text` }); score += imgNoAlt * 3; }
  // Positive signals
  if (hasUnsub) { issues.push({ sev: "pass", msg: "✓ Unsubscribe link present" }); }
  if (meta.fromName && meta.fromEmail) { issues.push({ sev: "pass", msg: "✓ From name and email set" }); }
  if (meta.preheader) { issues.push({ sev: "pass", msg: "✓ Preheader text present" }); }
  if (subj && subj.length <= 50) { issues.push({ sev: "pass", msg: "✓ Subject line optimal length" }); }
  return { score: Math.min(100, score), issues };
}

// ─── Accessibility Checker ───
function analyzeA11y(comps, html) {
  const issues = [];
  function checkComps(list) {
    list.forEach(c => {
      if (c.type === "image" && (!c.props.alt || c.props.alt.trim() === "")) issues.push({ sev: "error", msg: `Image missing alt text: ${c.props.src?.substring(0, 40)}...` });
      if (c.type === "button" && c.props.fontSize < 14) issues.push({ sev: "warn", msg: `Button text may be too small (${c.props.fontSize}px, recommended ≥14px)` });
      if ((c.type === "text" || c.type === "heading") && c.props.fontSize < 12) issues.push({ sev: "warn", msg: `Text size ${c.props.fontSize}px may be too small for readability` });
      if (c.type === "text" && c.props.color === "#cccccc" || c.props.color === "#999999") issues.push({ sev: "warn", msg: "Low contrast text color detected" });
      if (c.type === "columns" && c.props.children) { checkComps(c.props.children.left || []); checkComps(c.props.children.right || []); }
    });
  }
  checkComps(comps);
  const links = (html.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi) || []);
  links.forEach(l => { const text = l.replace(/<[^>]+>/g, "").trim(); if (["click here", "here", "link", "read more"].includes(text.toLowerCase())) issues.push({ sev: "warn", msg: `Non-descriptive link text: "${text}"` }); });
  if (!(html.includes('lang="en"') || html.includes("lang='en'"))) issues.push({ sev: "warn", msg: "No lang attribute on <html> tag" });
  else issues.push({ sev: "pass", msg: "✓ lang='en' set on <html> tag" });
  if (issues.filter(i => i.sev === "error").length === 0) issues.push({ sev: "pass", msg: "✓ No critical accessibility errors found" });
  return issues;
}

// ─── Plain Text Generator ───
function generatePlainText(comps, meta) {
  let txt = "";
  if (meta.subject) txt += `SUBJECT: ${meta.subject}\n\n`;
  function processComps(list) {
    list.forEach(c => {
      const p = c.props;
      if (c.type === "text" || c.type === "heading") txt += p.content + "\n\n";
      else if (c.type === "button") txt += `[ ${p.text} ] → ${p.href}\n\n`;
      else if (c.type === "image") txt += `[Image: ${p.alt || "no description"}]\n\n`;
      else if (c.type === "divider") txt += "─".repeat(40) + "\n\n";
      else if (c.type === "dynamic") txt += `${p.prefix}{{${p.variable}|${p.fallback}}}${p.suffix}\n\n`;
      else if (c.type === "aem") { const d = getAEMData(p); if (d) { if (d.headline) txt += d.headline + "\n"; if (d.subtext) txt += d.subtext + "\n"; if (d.cta) txt += `[ ${d.cta} ] → ${d.ctaUrl || "#"}\n`; txt += "\n"; } }
      else if (c.type === "columns" && p.children) { processComps(p.children.left || []); processComps(p.children.right || []); }
    });
  }
  processComps(comps);
  return txt.trim();
}

// ─── Apply Client Quirks to HTML ───
function applyClientQuirks(html, client, darkMode) {
  let out = html;
  if (client.quirks?.noFlexbox) {
    out = out.replace(/display:\s*flex[^;"']*/g, "display:table-cell");
    out = out.replace(/flex-direction:[^;"']*/g, "");
  }
  if (client.quirks?.noBorderRadius) {
    out = out.replace(/border-radius:[^;"']*/g, "");
  }
  if (darkMode || client.quirks?.mobile) {
    // Inject dark mode styles for simulation
  }
  if (darkMode) {
    out = out.replace(
      /<style[^>]*>([\s\S]*?)<\/style>/,
      `<style>$1
      @media (prefers-color-scheme: dark) {
        body { background: #1a1a2e !important; }
        td, div { background-color: #16213e !important; color: #e0e0e0 !important; }
      }
      body { background: #1a1a2e; color: #e0e0e0; }
      </style>`
    );
  }
  return out;
}

// ─── Main ───
// ─── PropEditPanel (top-level to preserve input focus) ───
function PropEditPanel({ selComp, selPath, brand, brandPalette, onUpdate, onDup, onDel, onPick }) {
  if (!selComp) return null;
  const p = selComp.props;
  const set = (k, v) => onUpdate({ ...selComp, props: { ...p, [k]: v } });
  return <div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${BD}` }}>
      <span style={{ fontSize: 16 }}>{selComp.type === "aem" ? CF_MODELS[p._model]?.icon : NATIVE[selComp.type]?.icon}</span>
      <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{selComp.type === "aem" ? CF_MODELS[p._model]?.label : NATIVE[selComp.type]?.label}</div>{selPath?.parentId && <div style={{ fontSize: 9, color: "#64748b" }}>In: {selPath.col}</div>}</div>
      <button onClick={onDup} style={{ width: 20, height: 20, background: "none", border: `1px solid ${BD}`, borderRadius: 4, color: "#94a3b8", cursor: "pointer", fontSize: 9 }}>⧉</button>
      <button onClick={onDel} style={{ width: 20, height: 20, background: "#7f1d1d", border: "none", borderRadius: 4, color: "#fca5a5", cursor: "pointer", fontSize: 9 }}>🗑</button>
    </div>

    {(() => { const viol = getBrandViolations(selComp.type, p, brand); return viol.length > 0 ? <div style={{ padding: "8px 10px", background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b30", borderRadius: 6, marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#f59e0b", marginBottom: 4 }}>⚠ Brand Warnings</div>
      {viol.map((v, i) => <div key={i} style={{ fontSize: 9, color: "#fcd34d", lineHeight: 1.4 }}>• {v}</div>)}
      <button onClick={() => { const fixed = applyBrandTokens(selComp.type, p, { ...brand, locked: true }); onUpdate({ ...selComp, props: { ...fixed, _brandManaged: true } }); }} style={{ marginTop: 6, padding: "3px 8px", background: "#f59e0b", border: "none", borderRadius: 4, color: "#000", cursor: "pointer", fontSize: 9, fontWeight: 600 }}>Fix to brand tokens</button>
    </div> : null; })()}

    {["text","heading","button","divider"].includes(selComp.type) && <div style={{ padding: "6px 8px", background: "rgba(14,165,233,0.06)", borderRadius: 6, marginBottom: 10, border: "1px solid #0ea5e915" }}>
      <Toggle label="Managed by Brand Kit" value={p._brandManaged !== false} onChange={v => set("_brandManaged", v)} />
      <div style={{ fontSize: 9, color: "#475569", marginTop: -4 }}>When on, Brand Lock overrides these styles on export</div>
    </div>}

    {selComp.type === "aem" && <AEMEditorPanel comp={selComp} onChange={onUpdate} onPick={onPick} brandPalette={brandPalette} />}
    {(selComp.type === "text" || selComp.type === "heading") && <div>
      <Section title="Content" defaultOpen={true}><F label="Text"><textarea value={p.content} onChange={e => set("content", e.target.value)} rows={3} style={{ ...iS, resize: "vertical" }} /></F><AlignF value={p.align} onChange={v => set("align", v)} /></Section>
      <Section title="Typography"><NumF label="Font Size" value={p.fontSize} onChange={v => set("fontSize", v)} min={8} max={72} /><ColorF label="Color" value={p.color} onChange={v => set("color", v)} brandColors={brandPalette} /><SelF label="Weight" value={p.fontWeight} onChange={v => set("fontWeight", v)} opts={["normal","bold","100","200","300","400","500","600","700","800","900"]} /><F label="Font Family"><input value={p.fontFamily || ""} onChange={e => set("fontFamily", e.target.value)} placeholder="Arial, Helvetica, sans-serif" style={iS} /></F><NumF label="Line Height" value={p.lineHeight} onChange={v => set("lineHeight", v)} /><NumF label="Letter Spacing (px)" value={p.letterSpacing} onChange={v => set("letterSpacing", v)} /><SelF label="Transform" value={p.textTransform} onChange={v => set("textTransform", v)} opts={["none","uppercase","lowercase","capitalize"]} /><SelF label="Decoration" value={p.textDecoration} onChange={v => set("textDecoration", v)} opts={["none","underline","line-through"]} /></Section>
      <Section title="Spacing & Background" defaultOpen={false}><PadF label="Padding" value={p.padding} onChange={v => set("padding", v)} /><ColorF label="BG Color" value={p.bgColor} onChange={v => set("bgColor", v)} brandColors={brandPalette} /><BorderF border={p.border} onChange={v => set("border", v)} /></Section>
      <Section title="Responsive" defaultOpen={false}><Toggle label="Hide on Mobile" value={p.hideOnMobile} onChange={v => set("hideOnMobile", v)} /><Toggle label="Hide on Desktop" value={p.hideOnDesktop} onChange={v => set("hideOnDesktop", v)} /></Section>
      <Section title="Conditional" defaultOpen={false}><F label="Show if attribute"><input value={p.conditionalAttr || ""} onChange={e => set("conditionalAttr", e.target.value)} placeholder="e.g. loyalty_tier" style={iS} /></F><F label="Equals"><input value={p.conditionalVal || ""} onChange={e => set("conditionalVal", e.target.value)} placeholder="e.g. gold" style={iS} /></F></Section>
    </div>}
    {selComp.type === "image" && <div>
      <Section title="Image" defaultOpen={true}><F label="Source URL"><input value={p.src} onChange={e => set("src", e.target.value)} style={iS} /></F><F label="Alt Text"><input value={p.alt} onChange={e => set("alt", e.target.value)} style={iS} /></F><F label="Link URL"><input value={p.href || ""} onChange={e => set("href", e.target.value)} style={iS} /></F><F label="Width"><input value={p.width} onChange={e => set("width", e.target.value)} style={iS} /></F><AlignF value={p.align} onChange={v => set("align", v)} /></Section>
      <Section title="Border & Spacing" defaultOpen={false}><BorderF border={p.border} onChange={v => set("border", v)} /><PadF label="Padding" value={p.padding} onChange={v => set("padding", v)} /></Section>
      <Section title="Responsive" defaultOpen={false}><Toggle label="Hide on Mobile" value={p.hideOnMobile} onChange={v => set("hideOnMobile", v)} /></Section>
    </div>}
    {selComp.type === "button" && <div>
      <Section title="Button" defaultOpen={true}><F label="Text"><input value={p.text} onChange={e => set("text", e.target.value)} style={iS} /></F><F label="URL"><input value={p.href} onChange={e => set("href", e.target.value)} style={iS} /></F><F label="Tracking Params"><input value={p.trackingParams || ""} onChange={e => set("trackingParams", e.target.value)} style={iS} placeholder="utm_source=email&..." /></F><Toggle label="Full Width" value={p.fullWidth} onChange={v => set("fullWidth", v)} /><AlignF value={p.align} onChange={v => set("align", v)} /></Section>
      <Section title="Style"><ColorF label="BG Color" value={p.bgColor} onChange={v => set("bgColor", v)} brandColors={brandPalette.slice(0,5)} /><ColorF label="Text Color" value={p.textColor} onChange={v => set("textColor", v)} brandColors={["#ffffff", brand?.textPrimary || "#111827"]} /><NumF label="Border Radius" value={p.borderRadius} onChange={v => set("borderRadius", v)} /><NumF label="Font Size" value={p.fontSize} onChange={v => set("fontSize", v)} /><SelF label="Font Weight" value={p.fontWeight || "bold"} onChange={v => set("fontWeight", v)} opts={["normal","bold","600","700","800"]} /><PadF label="Inner Padding" value={p.padding} onChange={v => set("padding", v)} /><BorderF border={p.border} onChange={v => set("border", v)} /></Section>
    </div>}
    {selComp.type === "divider" && <div><ColorF label="Color" value={p.color} onChange={v => set("color", v)} brandColors={brandPalette} /><NumF label="Thickness" value={p.thickness} onChange={v => set("thickness", v)} /><SelF label="Style" value={p.style} onChange={v => set("style", v)} opts={["solid","dashed","dotted","double"]} /><PadF label="Padding" value={p.padding} onChange={v => set("padding", v)} /></div>}
    {selComp.type === "spacer" && <div><NumF label="Height" value={p.height} onChange={v => set("height", v)} /><NumF label="Mobile Height" value={p.mobileHeight || p.height} onChange={v => set("mobileHeight", v)} /></div>}
    {selComp.type === "dynamic" && <div><F label="Variable"><input value={p.variable} onChange={e => set("variable", e.target.value)} style={iS} /></F><F label="Fallback"><input value={p.fallback} onChange={e => set("fallback", e.target.value)} style={iS} /></F><F label="Prefix"><input value={p.prefix} onChange={e => set("prefix", e.target.value)} style={iS} /></F><F label="Suffix"><input value={p.suffix} onChange={e => set("suffix", e.target.value)} style={iS} /></F><NumF label="Font Size" value={p.fontSize} onChange={v => set("fontSize", v)} /><ColorF label="Color" value={p.color} onChange={v => set("color", v)} brandColors={brandPalette} /></div>}
    {selComp.type === "columns" && <div>
      <Section title="Layout" defaultOpen={true}><SelF label="Ratio" value={p.ratio} onChange={v => set("ratio", v)} opts={["50-50","33-67","67-33","40-60","60-40","30-70","70-30"]} /><NumF label="Gap" value={p.gap} onChange={v => set("gap", v)} /><SelF label="V-Align" value={p.verticalAlign || "top"} onChange={v => set("verticalAlign", v)} opts={["top","middle","bottom"]} /><PadF label="Padding" value={p.padding} onChange={v => set("padding", v)} /></Section>
      <Section title="Column Backgrounds" defaultOpen={false}><ColorF label="Left BG" value={p.leftBg} onChange={v => set("leftBg", v)} brandColors={brandPalette} /><ColorF label="Right BG" value={p.rightBg} onChange={v => set("rightBg", v)} brandColors={brandPalette} /></Section>
      <Section title="Mobile" defaultOpen={false}><Toggle label="Stack on Mobile" value={p.stackOnMobile} onChange={v => set("stackOnMobile", v)} /><SelF label="Mobile Order" value={p.mobileOrder || "normal"} onChange={v => set("mobileOrder", v)} opts={[["normal","Left first"],["reverse","Right first"]]} /></Section>
    </div>}
  </div>;
}

// ─── AEMEditorPanel (top-level to preserve input focus) ───
function AEMEditorPanel({ comp, onChange, onPick, brandPalette }) {
  const p = comp.props, model = CF_MODELS[p._model];
  if (!model) return null;
  const set = (k, v) => onChange({ ...comp, props: { ...p, [k]: v } });
  const frags = AEM_FRAGS[p._model] || [];
  const frag = frags.find(f => f.id === p._fragId);
  return <div>
    <Section title="Content Source" defaultOpen={true}>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}><button onClick={() => set("_mode", "choose")} style={{ flex: 1, padding: 6, background: p._mode === "choose" ? "#0ea5e9" : BG, border: `1px solid ${BD}`, borderRadius: 4, color: p._mode === "choose" ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 11 }}>📂 From AEM</button><button onClick={() => set("_mode", "native")} style={{ flex: 1, padding: 6, background: p._mode === "native" ? "#0ea5e9" : BG, border: `1px solid ${BD}`, borderRadius: 4, color: p._mode === "native" ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 11 }}>✏️ Create New</button></div>
      {p._mode === "choose" && <div>
        <button onClick={() => onPick(p._model)} style={{ width: "100%", padding: 10, background: "#7c3aed", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>🔗 {p._fragId ? "Change Fragment" : "Select Fragment"}</button>
        {frag && <div>
          <div style={{ background: BG, padding: 8, borderRadius: 6, marginBottom: 8, border: `1px solid ${BD}` }}><div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{frag.title}</div><div style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace" }}>{frag.path}</div></div>
          <F label={"Variation (" + frag.variations.length + ")"}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{frag.variations.map(v => <div key={v.name} onClick={() => set("_var", v.name)} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, borderRadius: 6, cursor: "pointer", background: p._var === v.name ? "rgba(14,165,233,0.1)" : "transparent", border: `1px solid ${p._var === v.name ? "#0ea5e9" : BD}` }}><div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${p._var === v.name ? "#0ea5e9" : "#475569"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{p._var === v.name && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0ea5e9" }} />}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0" }}>{v.name}</div>{v.data.headline && <div style={{ fontSize: 10, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.data.headline}</div>}</div>{v.data.image && <img src={v.data.image} alt="" style={{ width: 48, height: 28, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />}</div>)}</div>
          </F>
          <Section title="Field Overrides" defaultOpen={false}>{Object.entries(model.fields).filter(([k]) => k !== "networks" && k !== "lists").map(([fld, type]) => { const vari = frag.variations.find(v => v.name === p._var) || frag.variations[0]; const orig = String(vari?.data?.[fld] || ""); const ov = p._overrides?.[fld]; return <F key={fld} label={fld + (ov ? " ●" : "")}>{type === "color" ? <div style={{ display: "flex", gap: 4 }}><input type="color" value={ov || orig || "#000"} onChange={e => set("_overrides", { ...p._overrides, [fld]: e.target.value })} style={{ width: 28, height: 28, border: "none", cursor: "pointer" }} /><input value={ov !== undefined ? ov : orig} onChange={e => set("_overrides", { ...p._overrides, [fld]: e.target.value })} style={{ ...iS, flex: 1 }} /></div> : <input value={ov !== undefined ? ov : orig} onChange={e => set("_overrides", { ...p._overrides, [fld]: e.target.value })} style={iS} placeholder={orig} />}{ov && <button onClick={() => { const o = { ...p._overrides }; delete o[fld]; set("_overrides", o); }} style={{ fontSize: 9, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>↩ Reset</button>}</F>; })}</Section>
        </div>}
      </div>}
      {p._mode === "native" && <div><div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8, padding: 8, background: "#451a03", borderRadius: 6 }}>✏️ Creates new AEM fragment on publish</div>{Object.entries(model.fields).map(([fld, type]) => <F key={fld} label={fld}>{type === "list" ? <input value={(p._native?.[fld] || []).join(", ")} onChange={e => set("_native", { ...p._native, [fld]: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} style={iS} /> : type === "color" ? <div style={{ display: "flex", gap: 4 }}><input type="color" value={p._native?.[fld] || "#000"} onChange={e => set("_native", { ...p._native, [fld]: e.target.value })} style={{ width: 28, height: 28, border: "none" }} /><input value={p._native?.[fld] || ""} onChange={e => set("_native", { ...p._native, [fld]: e.target.value })} style={{ ...iS, flex: 1 }} /></div> : <input value={p._native?.[fld] || ""} onChange={e => set("_native", { ...p._native, [fld]: e.target.value })} style={iS} />}</F>)}</div>}
    </Section>
    <Section title="Spacing & Style" defaultOpen={false}><PadF label="Padding" value={p.padding || "0"} onChange={v => set("padding", v)} /><ColorF label="BG Color" value={p.bgColor} onChange={v => set("bgColor", v)} brandColors={brandPalette} /><BorderF border={p.border} onChange={v => set("border", v)} /></Section>
    <Section title="Responsive" defaultOpen={false}><Toggle label="Hide on Mobile" value={p.hideOnMobile} onChange={v => set("hideOnMobile", v)} /><Toggle label="Hide on Desktop" value={p.hideOnDesktop} onChange={v => set("hideOnDesktop", v)} /></Section>
  </div>;
}


export default function EmailBuilder({ initialBrand, initialBlocks }) {
  const [comps, setComps] = useState([]);
  const [selPath, setSelPath] = useState(null);
  const [meta, setMeta] = useState({ name: "Untitled Email", subject: "", preheader: "", fromName: "", fromEmail: "" });
  const [gS, setGS] = useState({ bgColor: "", contentBg: "", w: 0, font: "" });
  const [brand, setBrand] = useState(initialBrand ? { ...DEFAULT_BRAND, ...initialBrand } : DEFAULT_BRAND);
  const [blocks, setBlocks] = useState(initialBlocks || []);
  const [tab, setTab] = useState("comps");
  const [preview, setPreview] = useState("desktop");
  const [dragIdx, setDragIdx] = useState(null);
  const [abOn, setAbOn] = useState(false);
  const [abCfg, setAbCfg] = useState({ method: "manual", metric: "open_rate", duration: 24, confidence: 95, variants: [{ id: "vA", name: "Variant A", pct: 50, subject: "", comps: [] }, { id: "vB", name: "Variant B", pct: 50, subject: "", comps: [] }] });
  const [activeVar, setActiveVar] = useState("vA");
  const [showPicker, setShowPicker] = useState(null);
  const [showHTML, setShowHTML] = useState(false);
  const [saving, setSaving] = useState(false);
  // Test panel state
  const [testSubTab, setTestSubTab] = useState("preview");
  const [testClient, setTestClient] = useState("gmail-web");
  const [testDark, setTestDark] = useState(false);
  const [testCopied, setTestCopied] = useState(false);
  const testIframeRef = useRef(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [emailId] = useState(() => `email_${Date.now().toString(36)}`);

  // Load brand kit and blocks from shared storage (if not provided via props)
  useEffect(() => {
    if (typeof window === "undefined" || !window.storage) return;
    (async () => {
      if (!initialBrand) {
        try { const bk = await window.storage.get("brand_kit", true); if (bk?.value) setBrand(JSON.parse(bk.value)); } catch {}
      }
      if (!initialBlocks || initialBlocks.length === 0) {
        try { const bl = await window.storage.get("content_blocks", true); if (bl?.value) setBlocks(JSON.parse(bl.value)); } catch {}
      }
    })();
  }, [initialBrand, initialBlocks]);

  // Sync gS with brand defaults when brand changes
  useEffect(() => {
    setGS(s => ({
      bgColor: s.bgColor || brand.bgPage,
      contentBg: s.contentBg || brand.bgContent,
      w: s.w || brand.emailWidth,
      font: s.font || brand.fontBody,
    }));
  }, [brand.bgPage, brand.bgContent, brand.emailWidth, brand.fontBody]);

  const brandPalette = getBrandPalette(brand);

  const ac = abOn ? (abCfg.variants.find(v => v.id === activeVar)?.comps || []) : comps;
  const setAc = fn => { const next = typeof fn === "function" ? fn : () => fn; if (abOn) setAbCfg(p => ({ ...p, variants: p.variants.map(v => v.id === activeVar ? { ...v, comps: next(v.comps) } : v) })); else setComps(next); };
  function findComp(path) { if (!path) return null; if (path.parentId) { const par = ac.find(c => c.id === path.parentId); return par ? (par.props.children?.[path.col] || []).find(c => c.id === path.childId) : null; } return ac.find(c => c.id === path.id); }
  function updateComp(u) { if (selPath?.parentId) setAc(p => p.map(c => c.id === selPath.parentId ? { ...c, props: { ...c.props, children: { ...c.props.children, [selPath.col]: (c.props.children[selPath.col] || []).map(ch => ch.id === u.id ? u : ch) } } } : c)); else setAc(p => p.map(c => c.id === u.id ? u : c)); }
  function delComp() { if (!selPath) return; if (selPath.parentId) setAc(p => p.map(c => c.id === selPath.parentId ? { ...c, props: { ...c.props, children: { ...c.props.children, [selPath.col]: (c.props.children[selPath.col] || []).filter(ch => ch.id !== selPath.childId) } } } : c)); else setAc(p => p.filter(c => c.id !== selPath.id)); setSelPath(null); }
  function dupComp() { const c = findComp(selPath); if (!c) return; const cl = deepClone([c])[0]; if (selPath.parentId) setAc(p => p.map(pc => pc.id === selPath.parentId ? { ...pc, props: { ...pc.props, children: { ...pc.props.children, [selPath.col]: [...(pc.props.children[selPath.col] || []), cl] } } } : pc)); else { const i = ac.findIndex(x => x.id === selPath.id); setAc(p => { const n = [...p]; n.splice(i + 1, 0, cl); return n; }); } }
  function moveComp(dir) { if (selPath?.parentId) setAc(p => p.map(c => { if (c.id !== selPath.parentId) return c; const a = [...(c.props.children[selPath.col] || [])]; const i = a.findIndex(ch => ch.id === selPath.childId); const j = i + dir; if (j < 0 || j >= a.length) return c; [a[i], a[j]] = [a[j], a[i]]; return { ...c, props: { ...c.props, children: { ...c.props.children, [selPath.col]: a } } }; })); else setAc(p => { const i = p.findIndex(c => c.id === selPath.id); const j = i + dir; if (j < 0 || j >= p.length) return p; const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n; }); }

  function onDragPalette(e, type, aem) { e.dataTransfer.setData("text/plain", JSON.stringify({ src: "palette", type, aemModel: aem })); }
  function onDragComp(e, id, idx) { e.dataTransfer.setData("text/plain", JSON.stringify({ src: "reorder", id })); setDragIdx(idx); }
  function handleDrop(e, dropIdx, parentId, col) {
    e.preventDefault(); e.stopPropagation(); setDragIdx(null);
    let raw; try { raw = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
    let nc;
    if (raw.src === "block" && raw.blockId) {
      const blk = blocks.find(b => b.id === raw.blockId);
      if (blk) { const cloned = deepClone(blk.comps); setTimeout(() => { setAc(p => { const n = [...p]; n.splice(dropIdx !== undefined ? dropIdx : n.length, 0, ...cloned); return n; }); }, 0); return; }
    }
    if (raw.src === "palette") { const id = uid("cp"); nc = raw.aemModel ? { id, type: "aem", props: makeAEM(raw.aemModel) } : { id, type: raw.type, props: defProps(raw.type, brand) }; }
    else if (raw.src === "reorder" && raw.id) {
      let found = null;
      setAc(function (prev) { const fi = prev.findIndex(c => c.id === raw.id); if (fi >= 0) { found = prev[fi]; return prev.filter(c => c.id !== raw.id); } return prev.map(c => { if (c.type === "columns" && c.props.children) { const ch = { ...c.props.children }; Object.keys(ch).forEach(k => { const ci = (ch[k] || []).findIndex(x => x.id === raw.id); if (ci >= 0) { found = ch[k][ci]; ch[k] = ch[k].filter(x => x.id !== raw.id); } }); return { ...c, props: { ...c.props, children: ch } }; } return c; }); });
      if (!found) return; nc = found;
    }
    if (!nc) return;
    setTimeout(() => { if (parentId && col) setAc(p => p.map(c => { if (c.id !== parentId) return c; const a = [...(c.props.children[col] || [])]; a.splice(dropIdx !== undefined ? dropIdx : a.length, 0, nc); return { ...c, props: { ...c.props, children: { ...c.props.children, [col]: a } } }; })); else setAc(p => { const n = [...p]; n.splice(dropIdx !== undefined ? dropIdx : n.length, 0, nc); return n; }); setSelPath(parentId ? { parentId, col, childId: nc.id } : { id: nc.id }); }, 0);
  }

  async function saveBlock(blockData) {
    const newBlock = { ...blockData, id: uid("blk") };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    try { await window.storage.set("content_blocks", JSON.stringify(updated), true); } catch {}
  }
  async function deleteBlock(id) {
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated);
    try { await window.storage.set("content_blocks", JSON.stringify(updated), true); } catch {}
  }
  function insertBlock(block) { setAc(p => [...p, ...deepClone(block.comps)]); }
  function onDragBlock(e, blockId) { e.dataTransfer.setData("text/plain", JSON.stringify({ src: "block", blockId })); }

  function enableAB() { setAbCfg(p => ({ ...p, variants: p.variants.map(v => ({ ...v, comps: deepClone(comps) })) })); setAbOn(true); }
  const save = useCallback(async () => { setSaving(true); try { const d = { id: emailId, meta, comps, abOn, abCfg, gS, brand, at: new Date().toISOString() }; await window.storage.set("emails:" + emailId, JSON.stringify(d)); setLastSaved(new Date()); } catch { } setSaving(false); }, [emailId, meta, comps, abOn, abCfg, gS, brand]);

  // Refresh test iframe whenever relevant state changes
  useEffect(() => {
    if (tab !== "test" || testSubTab !== "preview") return;
    const client = EMAIL_CLIENTS.find(c => c.id === testClient);
    if (!client || !testIframeRef.current) return;
    const html = generateHTML(ac, gS, meta, brand);
    const quirked = applyClientQuirks(html, client, testDark);
    const doc = testIframeRef.current.contentDocument || testIframeRef.current.contentWindow?.document;
    if (doc) { doc.open(); doc.write(quirked); doc.close(); }
  }, [tab, testSubTab, testClient, testDark, ac, gS, meta]);

  const selComp = findComp(selPath);
  const totalPct = abCfg.variants.reduce((s, v) => s + v.pct, 0);

  function DropInd({ onDrop: onD }) { const [ov, setOv] = useState(false); return <div onDragOver={e => { e.preventDefault(); e.stopPropagation(); setOv(true); }} onDragLeave={() => setOv(false)} onDrop={e => { setOv(false); onD(e); }} style={{ height: ov ? 8 : 3, background: ov ? "#0ea5e9" : "transparent", transition: "all 0.1s", borderRadius: 2 }} />; }

  function CW({ comp, idx, parentId, col }) {
    const path = parentId ? { parentId, col, childId: comp.id } : { id: comp.id };
    const isSel = selPath && (parentId ? selPath.childId === comp.id && selPath.parentId === parentId : selPath.id === comp.id);
    return <div draggable={!parentId} onDragStart={e => { if (!parentId) onDragComp(e, comp.id, idx); }} onClick={e => { e.stopPropagation(); setSelPath(path); }} style={{ position: "relative", cursor: parentId ? "pointer" : "grab", outline: isSel ? "2px solid #0ea5e9" : "none", outlineOffset: -1, borderRadius: 2, minHeight: 10, opacity: dragIdx === idx && !parentId ? 0.35 : 1 }} onMouseEnter={e => { if (!isSel) e.currentTarget.style.outline = "1px dashed #475569"; }} onMouseLeave={e => { if (!isSel) e.currentTarget.style.outline = isSel ? "2px solid #0ea5e9" : "none"; }}>
      {isSel && <div style={{ position: "absolute", top: -1, right: -1, display: "flex", gap: 1, zIndex: 10, background: "#0ea5e9", borderRadius: "0 0 0 4px", padding: "1px 2px" }}><button onClick={e => { e.stopPropagation(); moveComp(-1); }} style={{ width: 18, height: 18, background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 9 }}>▲</button><button onClick={e => { e.stopPropagation(); moveComp(1); }} style={{ width: 18, height: 18, background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 9 }}>▼</button><button onClick={e => { e.stopPropagation(); dupComp(); }} style={{ width: 18, height: 18, background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 9 }}>⧉</button><button onClick={e => { e.stopPropagation(); delComp(); }} style={{ width: 18, height: 18, background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 9 }}>✕</button></div>}
      {comp.type === "aem" && <div style={{ position: "absolute", top: 2, left: 2, zIndex: 5, background: "#7c3aed", color: "#fff", padding: "1px 5px", borderRadius: 3, fontSize: 8 }}>AEM: {CF_MODELS[comp.props._model]?.label}</div>}
      {(() => { const viol = getBrandViolations(comp.type, comp.props, brand); return viol.length > 0 ? <div style={{ position: "absolute", top: 2, right: isSel ? 78 : 2, zIndex: 5, background: "#f59e0b", color: "#000", padding: "1px 5px", borderRadius: 3, fontSize: 8, cursor: "help" }} title={viol.join("; ")}>⚠ Brand</div> : null; })()}
      {comp.type === "aem" ? <StyleWrap props={comp.props}><AEMRender model={comp.props._model} data={getAEMData(comp.props)} /></StyleWrap> :
        comp.type === "columns" ? (() => {
          const ch = comp.props.children || {}; const r = comp.props.ratio.split("-").map(Number); const tot = r[0] + r[1];
          return <div style={{ padding: comp.props.padding, display: "flex", gap: comp.props.gap, width: "100%", boxSizing: "border-box" }}>
            {Object.keys(ch).map((k, ci) => { const w = Math.round(r[ci] / tot * 100); return <div key={k} onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.outlineColor = "#0ea5e9"; }} onDragLeave={e => { e.currentTarget.style.outlineColor = "#334155"; }} onDrop={e => { e.currentTarget.style.outlineColor = "#334155"; handleDrop(e, undefined, comp.id, k); }} style={{ width: w + "%", flexBasis: w + "%", flexGrow: 0, flexShrink: 0, minHeight: 60, outline: "2px dashed #334155", borderRadius: 4, padding: 2, boxSizing: "border-box", overflow: "hidden", background: k === "left" ? comp.props.leftBg : comp.props.rightBg }}>
              {(ch[k] || []).length === 0 ? <div style={{ padding: 14, textAlign: "center", fontSize: 10, color: "#64748b" }}>Drop into {k}</div> : (ch[k] || []).map((child, ci2) => <div key={child.id}><DropInd onDrop={e => handleDrop(e, ci2, comp.id, k)} /><CW comp={child} idx={ci2} parentId={comp.id} col={k} /></div>)}
            </div>; })}
          </div>;
        })() : <NativeRender comp={comp} brand={brand} />}
    </div>;
  }

  function PropEdit() {
    return <PropEditPanel
      selComp={selComp}
      selPath={selPath}
      brand={brand}
      brandPalette={brandPalette}
      onUpdate={updateComp}
      onDup={dupComp}
      onDel={delComp}
      onPick={setShowPicker}
    />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: BG, color: "#e2e8f0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: "hidden" }}>
      {/* LEFT - widens when test tab active */}
      <div style={{ width: tab === "test" ? 520 : tab === "brand" ? 300 : 268, background: PB, borderRight: `1px solid ${BD}`, display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.25s ease" }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${BD}`, overflowX: "auto" }}>{[["comps","🧩"],["aem","🔗"],["blocks","📦"],["brand","🎨"],["styles","⚙"],["meta","📧"],["ab","🧪"],["test","🔬"]].map(([t, ic]) => {
            const accent = t === "test" ? "#a78bfa" : t === "brand" ? "#f59e0b" : t === "blocks" ? "#10b981" : "#0ea5e9";
            return <button key={t} onClick={() => setTab(t)} style={{ flex: "0 0 auto", padding: "9px 8px", background: tab === t ? BG : "transparent", border: "none", borderBottom: tab === t ? `2px solid ${accent}` : "2px solid transparent", color: tab === t ? accent : "#64748b", cursor: "pointer", fontSize: 11, position: "relative" }}>
              {ic}
              {t === "brand" && brand.locked && <span style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }} />}
            </button>;
          })}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: tab === "test" ? 0 : 10 }}>
          {tab === "comps" && <div>{["Content", "Layout"].map(cat => <div key={cat} style={{ marginBottom: 10 }}><div style={lS}>{cat}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>{Object.entries(NATIVE).filter(([_, d]) => d.cat === cat).map(([k, d]) => <div key={k} draggable onDragStart={e => onDragPalette(e, k, null)} onClick={() => { const id = uid("cp"); setAc(p => [...p, { id, type: k, props: defProps(k, brand) }]); setSelPath({ id }); }} style={{ padding: "7px 4px", background: "rgba(255,255,255,0.03)", border: "1px solid transparent", borderRadius: 6, cursor: "grab", color: "#cbd5e1", fontSize: 10, textAlign: "center", userSelect: "none" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}><div style={{ fontSize: 15 }}>{d.icon}</div>{d.label}</div>)}</div></div>)}
            <div style={{ borderTop: `1px solid ${BD}`, paddingTop: 6 }}><div style={lS}>Layers ({ac.length})</div>{ac.map(c => <div key={c.id} onClick={() => setSelPath({ id: c.id })} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 6px", borderRadius: 4, cursor: "pointer", background: selPath?.id === c.id ? BG : "transparent", border: `1px solid ${selPath?.id === c.id ? "#0ea5e9" : "transparent"}`, fontSize: 10, marginBottom: 1 }}><span>{c.type === "aem" ? CF_MODELS[c.props._model]?.icon : NATIVE[c.type]?.icon}</span><span style={{ flex: 1, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.type === "aem" ? CF_MODELS[c.props._model]?.label : NATIVE[c.type]?.label}</span>{getBrandViolations(c.type, c.props, brand).length > 0 && <span style={{ fontSize: 8, color: "#f59e0b" }} title="Brand violation">⚠</span>}</div>)}</div>
          </div>}
          {tab === "aem" && <div><div style={{ fontSize: 11, color: "#c4b5fd", marginBottom: 10, padding: 8, background: "rgba(124,58,237,0.1)", borderRadius: 6 }}>1:1 model→component mapping. Auto-loads first fragment.</div>{Object.entries(CF_MODELS).map(([k, m]) => <div key={k} draggable onDragStart={e => onDragPalette(e, "aem", k)} onClick={() => { const id = uid("aem"); setAc(p => [...p, { id, type: "aem", props: makeAEM(k) }]); setSelPath({ id }); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: 9, marginBottom: 3, borderRadius: 8, cursor: "grab", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)", userSelect: "none" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.14)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(124,58,237,0.06)"; }}><span style={{ fontSize: 16 }}>{m.icon}</span><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{m.label}</div><div style={{ fontSize: 9, color: "#64748b" }}>{(AEM_FRAGS[k] || []).length} fragments</div></div></div>)}</div>}
          {tab === "blocks" && <BlocksPanel blocks={blocks} onInsert={insertBlock} onDelete={deleteBlock} onSave={saveBlock} canvasComps={ac} onDragBlock={onDragBlock} />}
          {tab === "brand" && <BrandKitPanel brand={brand} onBrand={setBrand} />}
          {tab === "styles" && <div>
            <div style={{ padding: "6px 8px", background: "rgba(245,158,11,0.06)", borderRadius: 6, marginBottom: 10, border: "1px solid #f59e0b20", fontSize: 9, color: "#fcd34d" }}>
              These override brand defaults for this email only.
            </div><ColorF label="Background" value={gS.bgColor} onChange={v => setGS(s => ({ ...s, bgColor: v }))} /><ColorF label="Content BG" value={gS.contentBg} onChange={v => setGS(s => ({ ...s, contentBg: v }))} /><NumF label="Width" value={gS.w} onChange={v => setGS(s => ({ ...s, w: v }))} /><SelF label="Font" value={gS.font} onChange={v => setGS(s => ({ ...s, font: v }))} opts={[["Arial, Helvetica, sans-serif", "Arial"], ["Georgia, Times, serif", "Georgia"], ["Verdana, Geneva, sans-serif", "Verdana"], ["Trebuchet MS, sans-serif", "Trebuchet"], ["Tahoma, Geneva, sans-serif", "Tahoma"]]} /></div>}
          {tab === "meta" && <div><F label="Name"><input value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} style={iS} /></F><F label="Subject"><input value={meta.subject} onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))} style={iS} /></F><F label="Preheader"><textarea value={meta.preheader} onChange={e => setMeta(m => ({ ...m, preheader: e.target.value }))} rows={2} style={{ ...iS, resize: "vertical" }} /><div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>Visible in inbox preview. ~100 chars recommended.</div></F><F label="From Name"><input value={meta.fromName} onChange={e => setMeta(m => ({ ...m, fromName: e.target.value }))} style={iS} /></F><F label="From Email"><input value={meta.fromEmail} onChange={e => setMeta(m => ({ ...m, fromEmail: e.target.value }))} style={iS} /></F></div>}
          {tab === "ab" && <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><div onClick={() => { if (!abOn) enableAB(); else setAbOn(false); }} style={{ width: 40, height: 22, borderRadius: 11, background: abOn ? "#10b981" : "#475569", cursor: "pointer", position: "relative" }}><div style={{ width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute", top: 2, left: abOn ? 20 : 2, transition: "left 0.2s" }} /></div><span style={{ fontSize: 13, fontWeight: 600 }}>A/B Testing</span></div>
            {!abOn && comps.length > 0 && <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8, padding: "6px 8px", background: BG, borderRadius: 4 }}>Copies {comps.length} components into each variant.</div>}
            {abOn && <div>
              <SelF label="Method" value={abCfg.method} onChange={v => setAbCfg(p => ({ ...p, method: v }))} opts={[["manual", "Manual Split"], ["auto", "Auto-Optimize"]]} />
              {abCfg.method === "auto" && <div><SelF label="Metric" value={abCfg.metric} onChange={v => setAbCfg(p => ({ ...p, metric: v }))} opts={[["open_rate", "Open Rate"], ["click_rate", "Click Rate"], ["conversion", "Conversion"]]} /><NumF label="Duration (hrs)" value={abCfg.duration} onChange={v => setAbCfg(p => ({ ...p, duration: v }))} /><NumF label="Confidence %" value={abCfg.confidence} onChange={v => setAbCfg(p => ({ ...p, confidence: v }))} min={80} max={99} /></div>}
              <div style={{ marginBottom: 8, padding: "5px 8px", background: totalPct === 100 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderRadius: 6 }}><div style={{ fontSize: 11, color: totalPct === 100 ? "#6ee7b7" : "#fca5a5", fontWeight: 600 }}>Total: {totalPct}%{totalPct !== 100 ? " ≠ 100%" : " ✓"}</div></div>
              <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>{abCfg.variants.map((v, i) => <div key={v.id} style={{ width: v.pct + "%", background: ["#0ea5e9", "#ec4899", "#f59e0b", "#10b981"][i % 4] }} />)}</div>
              {abCfg.variants.map((v, i) => { const c = ["#0ea5e9", "#ec4899", "#f59e0b", "#10b981"][i % 4]; return <div key={v.id} onClick={() => setActiveVar(v.id)} style={{ padding: 8, marginBottom: 4, borderRadius: 8, cursor: "pointer", background: activeVar === v.id ? BG : "transparent", border: `2px solid ${activeVar === v.id ? c : BD}` }}><div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} /><input value={v.name} onClick={e => e.stopPropagation()} onChange={e => setAbCfg(p => ({ ...p, variants: p.variants.map(x => x.id === v.id ? { ...x, name: e.target.value } : x) }))} style={{ ...iS, flex: 1, padding: "3px 6px", fontWeight: 600 }} />{abCfg.variants.length > 2 && <button onClick={e => { e.stopPropagation(); setAbCfg(p => { const rem = p.variants.filter(x => x.id !== v.id); return { ...p, variants: rem }; }); if (activeVar === v.id) setActiveVar(abCfg.variants[0].id); }} style={{ background: "#7f1d1d", border: "none", borderRadius: 4, color: "#fca5a5", cursor: "pointer", fontSize: 9, padding: "2px 6px" }}>✕</button>}</div><F label={"Traffic: " + v.pct + "%"}><input type="range" min={5} max={95} value={v.pct} onClick={e => e.stopPropagation()} onChange={e => { const np = +e.target.value; const diff = np - v.pct; setAbCfg(p => ({ ...p, variants: p.variants.map(x => x.id === v.id ? { ...x, pct: np } : { ...x, pct: Math.max(5, x.pct - Math.round(diff / (p.variants.length - 1))) }) })); }} style={{ width: "100%", accentColor: c }} /></F><F label="Subject"><input value={v.subject} onClick={e => e.stopPropagation()} onChange={e => setAbCfg(p => ({ ...p, variants: p.variants.map(x => x.id === v.id ? { ...x, subject: e.target.value } : x) }))} style={iS} placeholder={meta.subject || "Default"} /></F><div style={{ fontSize: 9, color: "#64748b" }}>{(v.comps || []).length} components</div></div>; })}
              <button onClick={() => { const id = uid("v"); const src = abCfg.variants.find(v => v.id === activeVar)?.comps || comps; setAbCfg(p => ({ ...p, variants: [...p.variants, { id, name: "Variant " + String.fromCharCode(65 + p.variants.length), pct: 10, subject: "", comps: deepClone(src) }] })); setActiveVar(id); }} style={{ width: "100%", padding: 8, background: BD, border: "none", borderRadius: 6, color: "#94a3b8", cursor: "pointer", fontSize: 11 }}>+ Add Variant (clones current)</button>
            </div>}
          </div>}

          {tab === "test" && (() => {
            const html = generateHTML(ac, gS, meta, brand);
            const client = EMAIL_CLIENTS.find(c => c.id === testClient);
            const spamResult = analyzeSpam(html, meta, ac);
            const a11yIssues = analyzeA11y(ac, html);
            const plainText = generatePlainText(ac, meta);
            const sevColor = { error: "#ef4444", warn: "#f59e0b", info: "#60a5fa", pass: "#10b981" };
            const sevBg = { error: "rgba(239,68,68,0.08)", warn: "rgba(245,158,11,0.08)", info: "rgba(96,165,250,0.08)", pass: "rgba(16,185,129,0.08)" };
            return <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Score bar at top */}
              <div style={{ padding: "8px 12px", borderBottom: `1px solid ${BD}`, display: "flex", gap: 8, background: BG, flexShrink: 0 }}>
                <div style={{ flex: 1, padding: "5px 10px", borderRadius: 6, background: spamResult.score > 50 ? "rgba(239,68,68,0.12)" : spamResult.score > 20 ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)", border: `1px solid ${spamResult.score > 50 ? "#ef444430" : spamResult.score > 20 ? "#f59e0b30" : "#10b98130"}`, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>Spam Risk</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: spamResult.score > 50 ? "#ef4444" : spamResult.score > 20 ? "#f59e0b" : "#10b981" }}>{spamResult.score > 50 ? "HIGH" : spamResult.score > 20 ? "MED" : "LOW"} · {spamResult.score}</div>
                </div>
                <div style={{ flex: 1, padding: "5px 10px", borderRadius: 6, background: a11yIssues.filter(i => i.sev === "error").length > 0 ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", border: "1px solid #10b98130", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>A11y</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: a11yIssues.filter(i => i.sev === "error").length > 0 ? "#ef4444" : "#10b981" }}>{a11yIssues.filter(i => i.sev === "error").length}E · {a11yIssues.filter(i => i.sev === "warn").length}W</div>
                </div>
                <div style={{ flex: 1, padding: "5px 10px", borderRadius: 6, background: "rgba(99,102,241,0.12)", border: "1px solid #6366f130", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>Components</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>{ac.length}</div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: "flex", borderBottom: `1px solid ${BD}`, background: PB, flexShrink: 0, overflowX: "auto" }}>
                {[["preview", "👁 Preview"], ["compat", "🔧 Compat"], ["spam", "📊 Spam"], ["a11y", "♿ A11y"], ["plaintext", "📄 Text"]].map(([id, label]) =>
                  <button key={id} onClick={() => setTestSubTab(id)} style={{ padding: "8px 12px", background: "none", border: "none", borderBottom: testSubTab === id ? "2px solid #a78bfa" : "2px solid transparent", color: testSubTab === id ? "#a78bfa" : "#64748b", cursor: "pointer", fontSize: 10, fontWeight: testSubTab === id ? 600 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>{label}</button>)}
              </div>

              {/* Sub-tab content */}
              <div style={{ flex: 1, overflowY: "auto" }}>

                {/* PREVIEW */}
                {testSubTab === "preview" && <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  {/* Client selector row */}
                  <div style={{ padding: "8px 10px", borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                      {EMAIL_CLIENTS.map(c => <button key={c.id} onClick={() => setTestClient(c.id)} style={{ padding: "3px 8px", fontSize: 9, borderRadius: 20, border: `1px solid ${testClient === c.id ? c.color : BD}`, background: testClient === c.id ? c.color + "22" : "transparent", color: testClient === c.id ? c.color : "#64748b", cursor: "pointer", fontWeight: testClient === c.id ? 600 : 400 }}>{c.label}</button>)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div onClick={() => setTestDark(!testDark)} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                        <div style={{ width: 28, height: 16, borderRadius: 8, background: testDark ? "#6366f1" : "#475569", position: "relative", flexShrink: 0 }}><div style={{ width: 12, height: 12, borderRadius: 6, background: "#fff", position: "absolute", top: 2, left: testDark ? 14 : 2, transition: "left 0.15s" }} /></div>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>Dark mode</span>
                      </div>
                      <span style={{ fontSize: 9, color: "#475569", marginLeft: "auto" }}>{client?.width}px{client?.quirks?.mobile ? " · Mobile" : ""}</span>
                    </div>
                  </div>
                  {/* Client known issues */}
                  {client?.issues?.length > 0 && <div style={{ padding: "6px 10px", background: "rgba(245,158,11,0.06)", borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
                    {client.issues.map((iss, i) => <div key={i} style={{ fontSize: 9, color: "#fbbf24", lineHeight: 1.5 }}>⚠ {iss}</div>)}
                  </div>}
                  {/* Email chrome + iframe */}
                  <div style={{ flex: 1, overflowY: "auto", background: "#e5e7eb", padding: 10 }}>
                    <div style={{ background: testDark ? "#1e1e2e" : "#fff", borderRadius: "8px 8px 0 0", padding: "7px 12px", border: "1px solid #d1d5db", borderBottom: "none", display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} /><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} /><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                      <span style={{ fontSize: 9, color: testDark ? "#6b7280" : "#9ca3af", marginLeft: 4 }}>{client?.label}</span>
                      {testDark && <span style={{ fontSize: 8, background: "#6366f1", color: "#fff", padding: "1px 5px", borderRadius: 8, marginLeft: "auto" }}>dark</span>}
                    </div>
                    <div style={{ background: testDark ? "#16213e" : "#f9fafb", padding: "6px 12px", border: "1px solid #d1d5db", borderBottom: "none" }}>
                      <div style={{ fontSize: 10, color: testDark ? "#94a3b8" : "#6b7280" }}>From: <span style={{ color: testDark ? "#e2e8f0" : "#111" }}>{meta.fromName || "Sender"} &lt;{meta.fromEmail || "sender@brand.com"}&gt;</span></div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: testDark ? "#f1f5f9" : "#111", marginTop: 2 }}>{meta.subject || "(no subject)"}</div>
                      {meta.preheader && <div style={{ fontSize: 9, color: testDark ? "#64748b" : "#9ca3af" }}>{meta.preheader}</div>}
                    </div>
                    <iframe ref={testIframeRef} title="email-client-preview" sandbox="allow-same-origin"
                      style={{ width: "100%", minHeight: 400, border: "1px solid #d1d5db", borderRadius: "0 0 8px 8px", display: "block", background: testDark ? "#1a1a2e" : "#fff" }} />
                  </div>
                </div>}

                {/* COMPAT */}
                {testSubTab === "compat" && <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>✅ Supported &nbsp; ❌ Not supported</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 9 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: "6px 8px", textAlign: "left", color: "#64748b", background: BG, borderBottom: `1px solid ${BD}`, position: "sticky", left: 0, zIndex: 1, whiteSpace: "nowrap" }}>Feature</th>
                          {EMAIL_CLIENTS.map(c => <th key={c.id} style={{ padding: "4px 6px", textAlign: "center", color: c.color, background: BG, borderBottom: `1px solid ${BD}`, minWidth: 36, fontSize: 8 }}>
                            <div style={{ fontSize: 9, fontWeight: 700 }}>{c.icon}</div>
                            <div style={{ whiteSpace: "nowrap", maxWidth: 36, overflow: "hidden", textOverflow: "ellipsis" }}>{c.label.split(" ")[0]}</div>
                          </th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {CSS_COMPAT.map((row, i) => <tr key={row.feature} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                          <td style={{ padding: "5px 8px", color: "#cbd5e1", borderBottom: `1px solid ${BD}20`, whiteSpace: "nowrap", position: "sticky", left: 0, background: i % 2 === 0 ? PB : "#1d2d40", zIndex: 1, fontSize: 9 }}>{row.feature}</td>
                          {EMAIL_CLIENTS.map(c => <td key={c.id} style={{ padding: "5px 6px", textAlign: "center", borderBottom: `1px solid ${BD}20`, fontSize: 11 }}>{row.clients[c.id] ? "✅" : "❌"}</td>)}
                        </tr>)}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Recommendations</div>
                    {[
                      { ok: true, title: "✅ Table layout", desc: "Maximum compatibility — works in all clients including Outlook 2016/Word engine." },
                      { ok: true, title: "✅ background-color (not shorthand)", desc: "Uses background-color property + bgcolor HTML attribute — no background shorthand that Gmail strips." },
                      { ok: true, title: "✅ VML buttons", desc: "Outlook uses VML with arcsize% for rounded corners. Non-Outlook uses standard <a> with border-radius." },
                      { ok: true, title: "✅ No CSS animations", desc: "Export includes animation:none reset — no @keyframes that Gmail/Outlook would strip or error on." },
                      { ok: true, title: "✅ lang='en' on <html>", desc: "Set for accessibility, Gmail rendering, and screen reader compatibility." },
                      { ok: true, title: "✅ mso-line-height-rule", desc: "Added to all text cells to fix Outlook Word engine line-height inconsistencies." },
                      { ok: true, title: "✅ bgcolor HTML attributes", desc: "All colored cells use both CSS background-color AND the bgcolor HTML attr for Outlook Word engine." },
                      { ok: true, title: "✅ Gmail Android dark mode", desc: "color-scheme meta tag + [data-ogsc] overrides prevent forced dark inversion on Gmail Android." },
                      { ok: false, title: "⚠ Web Fonts", desc: "Only Apple Mail + Thunderbird support @font-face. System font stack is the safe fallback." },
                      { ok: false, title: "⚠ Background Images", desc: "Gmail/Outlook don't support CSS background-image. Use <img> tags instead (already done in export)." },
                      { ok: true, title: "✅ Mobile Responsive", desc: "Media queries + .mobile-stack class for column stacking on Gmail Android, iOS Mail, Samsung Mail." },
                    ].map(item => <div key={item.title} style={{ padding: 10, marginBottom: 6, background: item.ok ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)", borderRadius: 6, border: `1px solid ${item.ok ? "#10b98120" : "#f59e0b20"}` }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: item.ok ? "#6ee7b7" : "#fcd34d", marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.5 }}>{item.desc}</div>
                    </div>)}
                  </div>
                </div>}

                {/* SPAM */}
                {testSubTab === "spam" && <div style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", border: `5px solid ${spamResult.score > 50 ? "#ef4444" : spamResult.score > 20 ? "#f59e0b" : "#10b981"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)", flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: spamResult.score > 50 ? "#ef4444" : spamResult.score > 20 ? "#f59e0b" : "#10b981", lineHeight: 1 }}>{spamResult.score}</div>
                      <div style={{ fontSize: 7, color: "#64748b" }}>RISK</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: spamResult.score > 50 ? "#ef4444" : spamResult.score > 20 ? "#f59e0b" : "#10b981" }}>{spamResult.score > 50 ? "High Risk" : spamResult.score > 20 ? "Moderate" : "Looking Good"}</div>
                      <div style={{ background: BD, borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: spamResult.score + "%", background: spamResult.score > 50 ? "#ef4444" : spamResult.score > 20 ? "#f59e0b" : "#10b981", borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 9, color: "#475569", marginTop: 3 }}>0–20 Excellent · 21–50 Moderate · 51+ High Risk</div>
                    </div>
                  </div>
                  {spamResult.issues.map((iss, i) => <div key={i} style={{ display: "flex", gap: 8, padding: "7px 10px", borderRadius: 6, marginBottom: 4, background: sevBg[iss.sev], border: `1px solid ${sevColor[iss.sev]}25` }}>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>{iss.sev === "error" ? "🔴" : iss.sev === "warn" ? "🟡" : iss.sev === "pass" ? "🟢" : "🔵"}</span>
                    <span style={{ fontSize: 10, color: "#cbd5e1", lineHeight: 1.4 }}>{iss.msg}</span>
                  </div>)}
                </div>}

                {/* A11Y */}
                {testSubTab === "a11y" && <div style={{ padding: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                    {[{ label: "Errors", count: a11yIssues.filter(i => i.sev === "error").length, color: "#ef4444" }, { label: "Warnings", count: a11yIssues.filter(i => i.sev === "warn").length, color: "#f59e0b" }, { label: "Passed", count: a11yIssues.filter(i => i.sev === "pass").length, color: "#10b981" }].map(s =>
                      <div key={s.label} style={{ padding: "10px 6px", borderRadius: 8, background: s.color + "12", textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
                        <div style={{ fontSize: 9, color: "#94a3b8" }}>{s.label}</div>
                      </div>)}
                  </div>
                  {a11yIssues.map((iss, i) => <div key={i} style={{ display: "flex", gap: 8, padding: "7px 10px", borderRadius: 6, marginBottom: 4, background: sevBg[iss.sev], border: `1px solid ${sevColor[iss.sev]}25` }}>
                    <span style={{ fontSize: 11, flexShrink: 0 }}>{iss.sev === "error" ? "🔴" : iss.sev === "warn" ? "🟡" : iss.sev === "pass" ? "🟢" : "🔵"}</span>
                    <span style={{ fontSize: 10, color: "#cbd5e1", lineHeight: 1.4 }}>{iss.msg}</span>
                  </div>)}
                  <div style={{ marginTop: 12, padding: 10, background: "rgba(99,102,241,0.08)", borderRadius: 8, border: "1px solid #6366f125" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#a5b4fc", marginBottom: 6 }}>WCAG 2.1 Checklist</div>
                    {["All images have meaningful alt text", "Body text ≥ 14px", "Headings ≥ 22px", "Color contrast ≥ 4.5:1", "Descriptive link text (not 'click here')", "CTA buttons ≥ 44px tap target", "HTML lang attribute set", "Plain text version provided"].map((item, i) =>
                      <div key={i} style={{ display: "flex", gap: 6, padding: "3px 0", fontSize: 9, color: "#94a3b8" }}><span>□</span>{item}</div>)}
                  </div>
                </div>}

                {/* PLAIN TEXT */}
                {testSubTab === "plaintext" && <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ padding: "8px 10px", borderBottom: `1px solid ${BD}`, display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: "#64748b", flex: 1 }}>Auto-generated plain text version</span>
                    <button onClick={() => { navigator.clipboard.writeText(plainText); setTestCopied(true); setTimeout(() => setTestCopied(false), 2000); }} style={{ padding: "4px 10px", background: testCopied ? "#065f46" : BD, border: "none", borderRadius: 4, color: testCopied ? "#6ee7b7" : "#94a3b8", cursor: "pointer", fontSize: 10 }}>{testCopied ? "✓ Copied" : "📋 Copy"}</button>
                  </div>
                  <textarea value={plainText} readOnly style={{ flex: 1, background: BG, border: "none", color: "#cbd5e1", fontFamily: "'Courier New', monospace", fontSize: 11, padding: 12, resize: "none", outline: "none", lineHeight: 1.7, minHeight: 300 }} />
                </div>}

              </div>
            </div>;
          })()}
        </div>
        <div style={{ borderTop: `1px solid ${BD}`, padding: 8 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: 7, background: saving ? BD : "#065f46", border: "none", borderRadius: 6, color: saving ? "#64748b" : "#6ee7b7", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{saving ? "..." : "💾 Save"}</button>
            <button onClick={() => setShowHTML(true)} style={{ flex: 1, padding: 7, background: "#1e3a5f", border: "none", borderRadius: 6, color: "#7dd3fc", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>📄 HTML</button>
            <button onClick={() => setTab("test")} style={{ flex: 1, padding: 7, background: "#3b1f6e", border: "none", borderRadius: 6, color: "#c4b5fd", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>🔬 Test</button>
          </div>
          {lastSaved && <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>Saved: {lastSaved.toLocaleTimeString()}</div>}
        </div>
      </div>

      {/* CANVAS */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "7px 14px", background: PB, borderBottom: `1px solid ${BD}`, gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>✉️ {meta.name}</span>
          {abOn && <div style={{ display: "flex", gap: 3 }}>{abCfg.variants.map((v, i) => <button key={v.id} onClick={() => setActiveVar(v.id)} style={{ padding: "4px 10px", background: activeVar === v.id ? ["#0ea5e9", "#ec4899", "#f59e0b", "#10b981"][i % 4] : BD, border: "none", borderRadius: 4, color: activeVar === v.id ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 11, fontWeight: 500 }}>{v.name} ({v.pct}%)</button>)}</div>}
          <div style={{ display: "flex", gap: 3, background: BG, borderRadius: 6, padding: 2 }}><button onClick={() => setPreview("desktop")} style={{ padding: "4px 10px", background: preview === "desktop" ? BD : "transparent", border: "none", borderRadius: 4, color: preview === "desktop" ? "#e2e8f0" : "#64748b", cursor: "pointer", fontSize: 11 }}>🖥️</button><button onClick={() => setPreview("mobile")} style={{ padding: "4px 10px", background: preview === "mobile" ? BD : "transparent", border: "none", borderRadius: 4, color: preview === "mobile" ? "#e2e8f0" : "#64748b", cursor: "pointer", fontSize: 11 }}>📱</button></div>
          <button onClick={() => setTab("test")} style={{ padding: "4px 12px", background: "rgba(99,102,241,0.15)", border: "1px solid #6366f140", borderRadius: 6, color: "#a5b4fc", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>🔬 Test</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", padding: "20px 16px", background: BG }} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e)}>
          <div style={{ width: preview === "mobile" ? 375 : gS.w, maxWidth: "100%", transition: "width 0.3s" }}>
            <div style={{ background: PB, borderRadius: "8px 8px 0 0", padding: "7px 14px", border: `1px solid ${BD}`, borderBottom: "none" }}><div style={{ fontSize: 10, color: "#64748b" }}>Subject: <span style={{ color: "#e2e8f0" }}>{(abOn && abCfg.variants.find(v => v.id === activeVar)?.subject) || meta.subject || "(no subject)"}</span></div></div>
            <div style={{ background: gS.bgColor, padding: "20px 0", minHeight: 400, border: `1px solid ${BD}`, borderTop: "none" }}>
              <div style={{ maxWidth: gS.w, margin: "0 auto", background: gS.contentBg, fontFamily: gS.font, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }} onClick={() => setSelPath(null)}>
                {ac.length === 0 ? <div style={{ padding: 50, textAlign: "center" }}><div style={{ fontSize: 32, marginBottom: 8 }}>✉️</div><div style={{ fontSize: 14, color: "#94a3b8" }}>Drag components here to start</div></div> : ac.map((comp, i) => <div key={comp.id}><DropInd onDrop={e => handleDrop(e, i)} /><CW comp={comp} idx={i} /></div>)}
                {ac.length > 0 && <DropInd onDrop={e => handleDrop(e, ac.length)} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      {selComp && <div style={{ width: 300, background: PB, borderLeft: `1px solid ${BD}`, display: "flex", flexDirection: "column", flexShrink: 0 }}><div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${BD}` }}><span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#94a3b8" }}>Properties</span><button onClick={() => setSelPath(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>✕</button></div><div style={{ flex: 1, overflowY: "auto", padding: 10 }}><PropEdit /></div></div>}

      {showPicker && <FragPicker model={showPicker} onClose={() => setShowPicker(null)} onSelect={(fId, vName) => { if (selComp?.type === "aem") updateComp({ ...selComp, props: { ...selComp.props, _fragId: fId, _var: vName } }); setShowPicker(null); }} />}

      {showHTML && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowHTML(false)}><div style={{ width: 800, maxHeight: "85vh", background: PB, borderRadius: 12, border: `1px solid ${BD}`, display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BD}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><span style={{ fontSize: 14, fontWeight: 600 }}>📄 Email HTML Export</span><span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>Table-based • Inline CSS • Outlook VML • Gmail-safe</span></div>
          <div style={{ display: "flex", gap: 6 }}><button onClick={() => { navigator.clipboard.writeText(generateHTML(ac, gS, meta, brand)); }} style={{ padding: "6px 14px", background: "#065f46", border: "none", borderRadius: 6, color: "#6ee7b7", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>📋 Copy</button><button onClick={() => setShowHTML(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}>✕</button></div>
        </div>
        <div style={{ padding: "10px 18px", background: BG, display: "flex", gap: 6, flexWrap: "wrap" }}>{["✅ Table layout", "✅ bgcolor attributes", "✅ MSO conditionals", "✅ VML buttons", "✅ Preheader", "✅ Mobile responsive", "✅ No animation leaks", "✅ lang=en", "✅ Gmail dark mode fix", "✅ mso-line-height"].map(t => <span key={t} style={{ fontSize: 10, color: "#6ee7b7", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 4 }}>{t}</span>)}</div>
        <pre style={{ flex: 1, overflowY: "auto", padding: 18, margin: 0, fontSize: 11, color: "#94a3b8", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.5 }}>{generateHTML(ac, gS, meta, brand)}</pre>
      </div></div>}
    </div>
  );
}
