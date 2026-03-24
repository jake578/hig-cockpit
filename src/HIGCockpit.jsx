import { useState, useRef, useEffect, useCallback } from 'react';

/* ── tiny sparkline ── */
const MiniLine = ({ data, color = '#10b981', w = 80, h = 28 }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
};
const MiniBar = ({ data, color = '#6366f1', w = 80, h = 28 }) => {
  const max = Math.max(...data);
  const bw = w / data.length - 2;
  return <svg width={w} height={h}>{data.map((v, i) => <rect key={i} x={i * (bw + 2)} y={h - (v / max) * h} width={bw} height={(v / max) * h} fill={color} rx="2" />)}</svg>;
};

/* ── mock data ── */
const signalFeed = [
  { id: 1, company: 'Acuity Brands', signal: 'Series C — $85M raised', source: 'Pitchbook', time: '2h ago', type: 'funding', score: 96, sector: 'Industrial Tech', revenue: '$180M', employees: 1200, thesis: 'Industrial IoT / Building Automation', detail: 'Raised $85M Series C led by Insight Partners. Expanding into smart building controls — strong fit for growth equity thesis around industrial digitization.', draftEmail: 'Hi [Name],\n\nCongratulations on the impressive Series C raise — $85M is a strong validation of the smart building controls opportunity.\n\nAt H.I.G. Growth, we\'ve been tracking the industrial IoT space closely, and Acuity\'s trajectory from lighting into full building automation is exactly the kind of platform expansion we look to partner on.\n\nWould you be open to a brief conversation about how we might support the next phase of growth?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 2, company: 'Veritone', signal: 'New CRO hired — ex-Palantir', source: 'Apollo', time: '4h ago', type: 'leadership', score: 91, sector: 'AI / Enterprise Software', revenue: '$145M', employees: 680, thesis: 'AI-powered enterprise analytics', detail: 'Appointed Sarah Chen as CRO, previously VP Sales at Palantir for 6 years. Signals go-to-market acceleration and potential for scaled enterprise motion.', draftEmail: 'Hi Sarah,\n\nCongratulations on joining Veritone as CRO — your Palantir background brings exactly the enterprise scaling expertise the AI analytics market needs right now.\n\nH.I.G. Growth has been following Veritone\'s evolution in the AI-powered analytics space, and leadership transitions like this often mark an inflection point.\n\nWould love to learn about your go-to-market vision and share how we\'ve helped similar companies scale their enterprise motion.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 3, company: 'Cority', signal: 'Debt refinancing — $50M facility', source: 'CB Insights', time: '6h ago', type: 'debt', score: 88, sector: 'EHS Software', revenue: '$95M', employees: 520, thesis: 'Environmental health & safety SaaS', detail: 'Secured $50M revolving credit facility from SVB. May indicate preparation for acquisition-led growth or expansion into adjacent compliance markets.', draftEmail: 'Hi [Name],\n\nI noticed Cority recently secured a new credit facility — smart positioning as the EHS compliance landscape continues to expand with new regulatory requirements.\n\nH.I.G. Growth has deep experience partnering with compliance-oriented SaaS platforms during their scaling phase. We\'ve seen firsthand how the right growth capital can accelerate both organic expansion and strategic M&A in regulated verticals.\n\nWould you have 20 minutes to discuss your growth plans?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 4, company: 'Procore Technologies', signal: 'Lookalike match — 94% similarity to Viewpoint', source: 'Grata', time: '8h ago', type: 'lookalike', score: 85, sector: 'Construction Tech', revenue: '$720M', employees: 3200, thesis: 'Vertical SaaS — Construction', detail: 'Grata flagged Procore as 94% similar to portfolio company Viewpoint. Strong product overlap in construction project management, but Procore has deeper field operations tools.', draftEmail: 'Hi [Name],\n\nH.I.G. Growth has been actively investing in the construction technology vertical, and Procore\'s approach to connecting field operations with project management is compelling.\n\nWe\'d love to share some of our learnings from the space and explore whether there are partnership or growth opportunities worth discussing.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 5, company: 'Bandwidth Inc.', signal: 'Series D — $120M raised', source: 'Pitchbook', time: '1d ago', type: 'funding', score: 93, sector: 'CPaaS / Telecom', revenue: '$530M', employees: 1100, thesis: 'Enterprise communications APIs', detail: 'Closed $120M Series D. Expanding enterprise CPaaS offerings and 911 API capabilities. Growing 35% YoY in enterprise segment.', draftEmail: 'Hi [Name],\n\nCongratulations on the Series D — $120M is a testament to the momentum in enterprise communications APIs.\n\nH.I.G. Growth has been watching the CPaaS space evolve, and Bandwidth\'s unique position with carrier-grade infrastructure combined with the 911 API capabilities creates a differentiated moat.\n\nWould welcome the chance to discuss how we might support your next growth chapter.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 6, company: 'Samsara', signal: 'VP Engineering departed', source: 'Apollo', time: '1d ago', type: 'leadership', score: 79, sector: 'IoT / Fleet Management', revenue: '$860M', employees: 2800, thesis: 'Connected operations / IoT platform', detail: 'VP Engineering left after 4 years. Combined with recent product pivots, may signal strategic uncertainty or upcoming org restructuring.', draftEmail: 'Hi [Name],\n\nH.I.G. Growth has been following Samsara\'s journey in connected operations closely. As your platform continues to expand beyond fleet management into broader industrial IoT, we\'d love to share perspectives on scaling engineering organizations through rapid product expansion.\n\nWould a brief call be of interest?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 7, company: 'Zenoti', signal: 'Acquired competitor Booker — $28M', source: 'CB Insights', time: '2d ago', type: 'debt', score: 86, sector: 'Vertical SaaS — Wellness', revenue: '$110M', employees: 1400, thesis: 'Salon/spa management platform', detail: 'Acquired Booker from Mindbody for $28M, consolidating the salon/spa management space. Funded via existing credit facility. Integration creates 45K+ venue platform.', draftEmail: 'Hi [Name],\n\nThe Booker acquisition is a strong consolidation play — 45K+ venues under one platform creates real scale in a fragmented market.\n\nH.I.G. Growth has partnered with several vertical SaaS platforms through exactly this kind of roll-up strategy. We\'d be happy to share some of our playbooks on post-acquisition integration and accelerating cross-sell.\n\nWorth a conversation?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 8, company: 'Automox', signal: 'Lookalike match — 91% similarity to Tanium', source: 'Grata', time: '2d ago', type: 'lookalike', score: 82, sector: 'Cybersecurity / IT Ops', revenue: '$65M', employees: 350, thesis: 'Cloud-native endpoint management', detail: 'Grata flagged 91% similarity to Tanium. Cloud-native approach to endpoint management and patching. Growing 60%+ YoY, smaller but faster-growing alternative.', draftEmail: 'Hi [Name],\n\nH.I.G. Growth has been tracking the shift from legacy endpoint management to cloud-native approaches, and Automox is clearly leading that transition.\n\nThe 60%+ growth rate at your current scale is exactly the kind of trajectory we look to support with growth capital and operational expertise.\n\nWould you be open to an introductory conversation?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
];

const nurtureCompanies = [
  { id: 101, company: 'Kaseya', stage: 'Active nurture', lastTouch: '3 days ago', nextTouch: 'Mar 17', touchCount: 8, sector: 'IT Management', revenue: '$1.2B', status: 'warm', notes: 'Met at PE conference Q4. CRO interested in growth capital for international expansion. Follow up on EMEA plans.', draftEmail: 'Hi [Name],\n\nGreat connecting at the PE conference last quarter. I wanted to follow up on our conversation about Kaseya\'s EMEA expansion plans.\n\nWe\'ve recently helped two portfolio companies navigate European market entry — would be happy to share some of those lessons over a quick call.\n\nAny availability next week?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 102, company: 'Finastra', stage: 'Active nurture', lastTouch: '1 week ago', nextTouch: 'Mar 18', touchCount: 5, sector: 'FinTech', revenue: '$1.9B', status: 'warm', notes: 'CFO engaged. Exploring minority growth investment for cloud migration. Send updated market comp analysis.', draftEmail: 'Hi [Name],\n\nFollowing up on our discussion about Finastra\'s cloud migration strategy. I\'ve put together an updated market comp analysis showing how similar financial software platforms have approached this transition.\n\nAttached for your review — happy to walk through the key takeaways whenever convenient.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 103, company: 'Hyland Software', stage: 'Early engagement', lastTouch: '2 weeks ago', nextTouch: 'Mar 20', touchCount: 3, sector: 'ECM / Content Services', revenue: '$950M', status: 'cool', notes: 'Initial outreach via mutual connection. CEO responded positively but no meeting set yet. Try industry angle.', draftEmail: 'Hi [Name],\n\nI wanted to share a perspective piece we recently published on the content services platform market — particularly relevant given the AI-driven document intelligence trend reshaping ECM.\n\nGiven Hyland\'s leadership position, I thought this might resonate. Would love to get your take on the market direction.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 104, company: 'Relativity', stage: 'Active nurture', lastTouch: '5 days ago', nextTouch: 'Mar 19', touchCount: 12, sector: 'Legal Tech', revenue: '$340M', employees: 1800, status: 'hot', notes: 'Deep in discussions. VP Corp Dev very engaged. They\'re evaluating growth equity options for AI product buildout. Schedule follow-up with IC team.', draftEmail: 'Hi [Name],\n\nThanks for the productive conversation last week about Relativity\'s AI product roadmap. Our investment committee was very impressed with the vision for AI-assisted review workflows.\n\nAs a next step, we\'d love to arrange a deeper dive with our technology operating partners who\'ve helped scale AI product teams at similar companies.\n\nCan we find time this week?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 105, company: 'Cornerstone OnDemand', stage: 'Re-engage', lastTouch: '6 weeks ago', nextTouch: 'Overdue', touchCount: 4, sector: 'HCM / Learning', revenue: '$910M', status: 'cold', notes: 'Went quiet after initial interest. New product launch (AI skills engine) creates re-engagement opportunity.', draftEmail: 'Hi [Name],\n\nI noticed Cornerstone\'s launch of the AI Skills Engine — it\'s exactly the kind of product innovation we were discussing when we last spoke about the HCM market evolution.\n\nH.I.G. Growth has seen firsthand how AI-native product launches can accelerate growth trajectories, and we\'d love to revisit the conversation about supporting Cornerstone\'s next chapter.\n\nWould you be open to reconnecting?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
];

const targetingCompanies = [
  { id: 201, company: 'Celonis', fit: 97, sector: 'Process Mining', revenue: '$320M', employees: 3000, thesis: 'Process intelligence platform', signals: ['60% YoY growth', 'Expanding into supply chain'], source: 'Grata + Pitchbook' },
  { id: 202, company: 'Braze', fit: 94, sector: 'Customer Engagement', revenue: '$470M', employees: 1600, thesis: 'Cross-channel marketing automation', signals: ['IPO pipeline candidate', 'New AI features launched'], source: 'CB Insights' },
  { id: 203, company: 'Highspot', fit: 92, sector: 'Sales Enablement', revenue: '$190M', employees: 900, thesis: 'Revenue enablement platform', signals: ['Series F potential', 'Enterprise ACV growth 40%'], source: 'Grata' },
  { id: 204, company: 'Ramp', fit: 90, sector: 'Corporate FinTech', revenue: '$350M', employees: 800, thesis: 'Corporate card & spend management', signals: ['Profitable at scale', 'Launched procurement suite'], source: 'Pitchbook' },
  { id: 205, company: 'Abnormal Security', fit: 89, sector: 'Cybersecurity', revenue: '$210M', employees: 600, thesis: 'AI-native email security', signals: ['ARR tripled YoY', 'Series D likely'], source: 'Apollo + CB Insights' },
  { id: 206, company: 'Notion', fit: 87, sector: 'Productivity / Collaboration', revenue: '$280M', employees: 500, thesis: 'Connected workspace platform', signals: ['Enterprise revenue 55% of mix', 'AI features driving expansion'], source: 'Grata' },
];

const outreachQueue = [
  { id: 301, company: 'Acuity Brands', action: 'Send intro email', signal: 'Series C — $85M', status: 'pending_review', reviewer: 'IP Team', priority: 'high' },
  { id: 302, company: 'Veritone', action: 'Send congrats + intro', signal: 'New CRO hired', status: 'pending_review', reviewer: 'IP Team', priority: 'high' },
  { id: 303, company: 'Relativity', action: 'Schedule IC deep dive', signal: 'Active discussions', status: 'approved', reviewer: 'Approved', priority: 'high' },
  { id: 304, company: 'Cority', action: 'Send intro email', signal: 'Debt refinancing', status: 'pending_review', reviewer: 'IP Team', priority: 'medium' },
  { id: 305, company: 'Cornerstone OnDemand', action: 'Re-engagement email', signal: 'AI Skills Engine launch', status: 'approved', reviewer: 'Approved', priority: 'medium' },
  { id: 306, company: 'Bandwidth Inc.', action: 'Send intro email', signal: 'Series D — $120M', status: 'draft', reviewer: 'Needs draft', priority: 'medium' },
];

const TABS = ['Signal feed', 'Outreach queue', 'Nurture management', 'Targeting universe'];
const SIGNAL_TYPES = { funding: { label: 'Funding', color: '#10b981', bg: '#ecfdf5' }, leadership: { label: 'Leadership', color: '#6366f1', bg: '#eef2ff' }, debt: { label: 'Debt / M&A', color: '#f59e0b', bg: '#fffbeb' }, lookalike: { label: 'Lookalike', color: '#8b5cf6', bg: '#f5f3ff' } };

const chatResponses = [
  { kw: ['signal', 'klii', 'alert'], a: "This week we're tracking **12 new KLIIs** across your coverage universe:\n\n• **4 funding events** (Series C+ rounds over $50M)\n• **3 leadership changes** (C-suite or VP-level hires)\n• **2 debt/credit activities** (refinancing or new facilities)\n• **3 lookalike matches** (>85% similarity score)\n\nAcuity Brands and Bandwidth Inc. have the highest signal scores — I'd recommend prioritizing outreach to both this week." },
  { kw: ['nurture', 'follow', 'touch', 'engage'], a: "Here's your nurture status:\n\n• **Relativity** — Hottest lead, 12 touches, VP Corp Dev very engaged. IC deep dive should be scheduled ASAP.\n• **Kaseya** — Warm, follow up on EMEA expansion plans from PE conference.\n• **Finastra** — CFO engaged on cloud migration. Send updated market comps.\n• **Cornerstone OnDemand** — Overdue re-engagement. Their AI Skills Engine launch is a natural re-entry point.\n\n**1 overdue touchpoint** needs attention." },
  { kw: ['outreach', 'email', 'draft', 'write'], a: "I've drafted **6 outreach emails** based on recent signals:\n\n• **3 pending IP review** — Acuity Brands, Veritone, Cority\n• **2 approved and ready to send** — Relativity, Cornerstone\n• **1 needs draft** — Bandwidth Inc.\n\nAll drafts reference the specific signal that triggered them and are tailored to each company's sector context. Want me to generate the Bandwidth draft?" },
  { kw: ['target', 'universe', 'thesis', 'screen'], a: "Your targeting universe currently has **6 high-fit companies** scoring 87+:\n\n• **Celonis** (97) — Process mining leader, 60% YoY growth\n• **Braze** (94) — IPO candidate, cross-channel marketing\n• **Highspot** (92) — Enterprise revenue enablement, ACV growing 40%\n\nThese align with your thesis around scaling enterprise SaaS with strong net retention. Want me to run a deeper screen on any of these?" },
  { kw: ['crm', 'salesforce', 'enrich', 'data'], a: "CRM enrichment status:\n\n• **42 company records** updated this week via Pitchbook/Grata sync\n• **18 new contacts** added from Apollo\n• **7 records** flagged for review (stale data >90 days)\n\nThe Mulesoft integration is pulling from Pitchbook, Grata, Apollo, CB Insights, CapIQ, and FactSet. All enriched data flows into Salesforce automatically.\n\nWant me to flag specific records that need manual review?" },
  { kw: ['east', 'eric', 'scaled', 'outbound'], a: "**East Team (Eric's motion)** — Scaled outbound focus:\n\n• **28 companies** in active outbound cadences\n• **12 new sequences** launched this week\n• CRM enrichment rate: **94%** (up from 87% last month)\n• Structured cadence completion rate: **78%**\n\nThe scaled motion is working — meeting book rate from outbound is up 23% since implementing AI-personalized first touches." },
  { kw: ['west', 'evan', 'signal'], a: "**West Team (Evan's motion)** — Signal-first sourcing:\n\n• **12 new KLIIs** detected this week\n• **3 companies** moved to active outreach from signal triggers\n• Signal-to-meeting conversion: **34%** (vs 8% for cold outbound)\n• Coverage universe: **450 companies** actively monitored\n\nThe signal-first approach continues to outperform cold outreach by 4x on meeting conversion." },
  { kw: ['pipeline', 'deal', 'meeting'], a: "Current pipeline snapshot:\n\n• **$2.4B** in tracked opportunities across 34 companies\n• **6 active discussions** (Relativity leading)\n• **12 meetings** booked this month (vs 9 last month)\n• Average deal cycle: **14 months** from first touch\n\nRelativity is furthest along — recommend scheduling IC deep dive this week to maintain momentum." },
  { kw: ['help', 'what', 'can you', 'how'], a: "I'm your **Growth Sourcing Copilot**. I can help with:\n\n• **Signal monitoring** — Track KLIIs (funding, leadership, debt, lookalikes) across your coverage universe\n• **Email drafting** — Generate personalized outreach tied to specific signals for IP review\n• **Nurture management** — Track engagement history and recommend next touches\n• **Targeting** — Screen companies against your investment thesis\n• **CRM enrichment** — Monitor data quality from Pitchbook, Grata, Apollo, and more\n• **Team analytics** — Compare East (scaled) vs West (signal-first) performance\n\nWhat would you like to dive into?" },
];

const METRICS = [
  { label: 'Companies Tracked', value: '486', sub: '+12 this week', trend: [410, 425, 440, 452, 460, 472, 486], color: '#6366f1' },
  { label: 'KLIIs This Week', value: '12', sub: '4 funding · 3 leadership', trend: [6, 9, 7, 11, 8, 14, 12], color: '#10b981' },
  { label: 'Outreach Sent', value: '34', sub: '82% open rate', trend: [22, 28, 19, 31, 26, 38, 34], color: '#f59e0b' },
  { label: 'Meetings Booked', value: '12', sub: '+33% vs last month', trend: [5, 7, 6, 9, 8, 9, 12], color: '#8b5cf6' },
  { label: 'Pipeline Value', value: '$2.4B', sub: '34 opportunities', trend: [1.6, 1.8, 1.9, 2.0, 2.1, 2.3, 2.4], color: '#ec4899' },
  { label: 'CRM Enrichment', value: '94%', sub: '+7pp this month', trend: [82, 84, 87, 89, 91, 93, 94], color: '#14b8a6' },
];

export default function HIGCockpit() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(signalFeed[0]);
  const [selectedType, setSelectedType] = useState('signal');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [msgs, setMsgs] = useState([{ role: 'assistant', text: 'Good morning! I\'m your **Growth Sourcing Copilot**. I\'m monitoring **486 companies** across your coverage universe.\n\n**12 new KLIIs** detected this week — Acuity Brands (Series C, $85M) and Bandwidth Inc. (Series D, $120M) have the highest signal scores.\n\nAlso, **Relativity** is ready for IC deep dive scheduling, and **Cornerstone OnDemand** has an overdue re-engagement touchpoint.\n\nWhat would you like to focus on?' }]);
  const [input, setInput] = useState('');
  const [filterType, setFilterType] = useState('all');
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const selectItem = useCallback((item, type) => { setSelected(item); setSelectedType(type); }, []);

  const send = useCallback(() => {
    if (!input.trim()) return;
    const q = input.toLowerCase();
    setMsgs(p => [...p, { role: 'user', text: input }]);
    setInput('');
    const match = chatResponses.find(r => r.kw.some(k => q.includes(k)));
    setTimeout(() => {
      setMsgs(p => [...p, { role: 'assistant', text: match ? match.a : "I can help with signal monitoring, email drafting, nurture management, targeting screens, and CRM enrichment. Could you tell me more about what you're looking for?" }]);
    }, 600);
  }, [input]);

  const renderBold = (t) => {
    const parts = t.split(/(\*\*.*?\*\*)/g);
    return parts.map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p);
  };

  /* ── styles ── */
  const s = {
    page: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', color: '#1e293b' },
    nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, background: '#0f172a', color: '#fff', fontSize: 14 },
    brand: { fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 },
    logo: { width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' },
    strip: { display: 'flex', gap: 1, background: '#e2e8f0', borderBottom: '1px solid #e2e8f0' },
    kpi: { flex: 1, background: '#fff', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 },
    kpiLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '.5px' },
    kpiVal: { fontSize: 22, fontWeight: 700 },
    kpiSub: { fontSize: 11, color: '#64748b' },
    body: { display: 'flex', flex: 1, overflow: 'hidden' },
    left: { flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' },
    tabs: { display: 'flex', background: '#fff', borderBottom: '1px solid #e2e8f0' },
    tab: (a) => ({ padding: '12px 20px', fontSize: 13, fontWeight: a ? 600 : 400, color: a ? '#6366f1' : '#64748b', cursor: 'pointer', borderBottom: a ? '2px solid #6366f1' : '2px solid transparent', background: 'none', border: 'none', borderBottomStyle: 'solid' }),
    list: { flex: 1, overflow: 'auto', background: '#fff' },
    row: (a) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: a ? '#f0f0ff' : '#fff', transition: 'background .15s' }),
    badge: (bg, color) => ({ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: bg, color }),
    detail: { width: 420, background: '#fff', overflow: 'auto', borderRight: '1px solid #e2e8f0', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
    chat: { width: 340, display: 'flex', flexDirection: 'column', background: '#fff' },
    chatHead: { padding: '14px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 },
    chatBody: { flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
    bubble: (u) => ({ alignSelf: u ? 'flex-end' : 'flex-start', background: u ? '#6366f1' : '#f1f5f9', color: u ? '#fff' : '#1e293b', padding: '10px 14px', borderRadius: 14, maxWidth: '88%', fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap' }),
    chatInput: { display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid #e2e8f0' },
    input: { flex: 1, padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' },
    sendBtn: { padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btn: (primary) => ({ padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: primary ? '#6366f1' : '#f1f5f9', color: primary ? '#fff' : '#475569' }),
    textarea: { width: '100%', minHeight: 140, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'Inter, sans-serif' },
    filterBtn: (a) => ({ padding: '4px 12px', borderRadius: 99, border: '1px solid ' + (a ? '#6366f1' : '#e2e8f0'), background: a ? '#eef2ff' : '#fff', color: a ? '#6366f1' : '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer' }),
    statusDot: (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }),
  };

  const filteredSignals = filterType === 'all' ? signalFeed : signalFeed.filter(s => s.type === filterType);

  /* ── analytics view ── */
  if (showAnalytics) {
    const chartData = {
      signals: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], funding: [2, 1, 3, 1, 2], leadership: [1, 2, 0, 1, 1], debt: [0, 1, 1, 0, 1], lookalike: [1, 0, 2, 1, 1] },
      outreach: { labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'], sent: [22, 28, 31, 34], opened: [18, 23, 26, 28], replied: [4, 6, 8, 9] },
      pipeline: { labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], value: [1.6, 1.8, 1.9, 2.0, 2.3, 2.4] },
    };
    return (
      <div style={s.page}>
        <nav style={s.nav}>
          <div style={s.brand}><div style={s.logo}>H</div>H.I.G. Growth Sourcing Copilot</div>
          <button onClick={() => setShowAnalytics(false)} style={{ ...s.btn(false), color: '#cbd5e1' }}>← Back to Queue</button>
        </nav>
        <div style={{ flex: 1, overflow: 'auto', padding: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Signal Distribution */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>KLII Signal Distribution (This Week)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(SIGNAL_TYPES).map(([k, v]) => {
                const total = chartData.signals[k].reduce((a, b) => a + b, 0);
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 80, fontSize: 12, fontWeight: 600, color: v.color }}>{v.label}</span>
                    <div style={{ flex: 1, height: 24, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${(total / 12) * 100}%`, height: '100%', background: v.color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{total}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Outreach Performance */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Outreach Performance</h3>
            <div style={{ display: 'flex', gap: 24 }}>
              {[{ label: 'Sent', value: '115', trend: chartData.outreach.sent, color: '#6366f1' }, { label: 'Opened', value: '95', trend: chartData.outreach.opened, color: '#10b981' }, { label: 'Replied', value: '27', trend: chartData.outreach.replied, color: '#f59e0b' }].map(m => (
                <div key={m.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{m.label}</div>
                  <MiniBar data={m.trend} color={m.color} w={60} h={24} />
                </div>
              ))}
            </div>
          </div>
          {/* Pipeline Growth */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Pipeline Value Trend ($B)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, height: 140 }}>
              {chartData.pipeline.value.map((v, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>${v}B</span>
                  <div style={{ width: 40, height: (v / 2.5) * 120, background: 'linear-gradient(180deg, #6366f1, #a5b4fc)', borderRadius: 6 }} />
                  <span style={{ fontSize: 10, color: '#64748b' }}>{chartData.pipeline.labels[i]}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Team Performance */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Team Performance — East vs West</h3>
            <div style={{ display: 'flex', gap: 24 }}>
              {[{ team: 'East (Eric)', subtitle: 'Scaled Outbound', metrics: [{ l: 'Outreach sent', v: '68' }, { l: 'Open rate', v: '78%' }, { l: 'Meetings', v: '7' }, { l: 'CRM enrichment', v: '94%' }], color: '#6366f1' },
               { team: 'West (Evan)', subtitle: 'Signal-First', metrics: [{ l: 'Signals acted on', v: '28' }, { l: 'Signal→Meeting', v: '34%' }, { l: 'Meetings', v: '5' }, { l: 'Coverage universe', v: '450' }], color: '#10b981' }].map(t => (
                <div key={t.team} style={{ flex: 1, padding: 16, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: t.color, marginBottom: 2 }}>{t.team}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>{t.subtitle}</div>
                  {t.metrics.map(m => (
                    <div key={m.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>{m.l}</span>
                      <span style={{ fontWeight: 600 }}>{m.v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── main view ── */
  return (
    <div style={s.page}>
      {/* nav */}
      <nav style={s.nav}>
        <div style={s.brand}><div style={s.logo}>H</div>H.I.G. Growth Sourcing Copilot</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setShowAnalytics(true)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#cbd5e1', padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Analytics</button>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Growth Sourcing Team</span>
        </div>
      </nav>

      {/* metrics strip */}
      <div style={s.strip}>
        {METRICS.map(m => (
          <div key={m.label} style={s.kpi}>
            <span style={s.kpiLabel}>{m.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={s.kpiVal}>{m.value}</span>
              <MiniLine data={m.trend} color={m.color} />
            </div>
            <span style={s.kpiSub}>{m.sub}</span>
          </div>
        ))}
      </div>

      {/* body */}
      <div style={s.body}>
        {/* left panel — list */}
        <div style={s.left}>
          <div style={s.tabs}>
            {TABS.map((t, i) => <button key={t} style={s.tab(tab === i)} onClick={() => { setTab(i); if (i === 0 && filteredSignals.length) { selectItem(filteredSignals[0], 'signal'); } if (i === 1 && outreachQueue.length) { selectItem(outreachQueue[0], 'outreach'); } if (i === 2 && nurtureCompanies.length) { selectItem(nurtureCompanies[0], 'nurture'); } if (i === 3 && targetingCompanies.length) { selectItem(targetingCompanies[0], 'target'); } }}>{t}</button>)}
          </div>

          {/* Tab 0: Signal Feed */}
          {tab === 0 && (
            <>
              <div style={{ display: 'flex', gap: 6, padding: '10px 20px', background: '#fff', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                <button style={s.filterBtn(filterType === 'all')} onClick={() => setFilterType('all')}>All signals</button>
                {Object.entries(SIGNAL_TYPES).map(([k, v]) => <button key={k} style={s.filterBtn(filterType === k)} onClick={() => setFilterType(k)}>{v.label}</button>)}
              </div>
              <div style={s.list}>
                {filteredSignals.map(item => (
                  <div key={item.id} style={s.row(selected?.id === item.id)} onClick={() => selectItem(item, 'signal')}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: SIGNAL_TYPES[item.type].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {item.type === 'funding' ? '💰' : item.type === 'leadership' ? '👤' : item.type === 'debt' ? '🏦' : '🔍'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.company}</div>
                      <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.signal}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={s.badge(SIGNAL_TYPES[item.type].bg, SIGNAL_TYPES[item.type].color)}>{SIGNAL_TYPES[item.type].label}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.time}</span>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: item.score >= 90 ? '#dcfce7' : item.score >= 80 ? '#fef3c7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: item.score >= 90 ? '#166534' : item.score >= 80 ? '#92400e' : '#991b1b', flexShrink: 0 }}>{item.score}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Tab 1: Outreach Queue */}
          {tab === 1 && (
            <div style={s.list}>
              {outreachQueue.map(item => (
                <div key={item.id} style={s.row(selected?.id === item.id)} onClick={() => selectItem(item, 'outreach')}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: item.status === 'approved' ? '#dcfce7' : item.status === 'pending_review' ? '#fef3c7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {item.status === 'approved' ? '✅' : item.status === 'pending_review' ? '⏳' : '📝'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.company}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{item.action}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={s.badge(item.status === 'approved' ? '#dcfce7' : item.status === 'pending_review' ? '#fef3c7' : '#f1f5f9', item.status === 'approved' ? '#166534' : item.status === 'pending_review' ? '#92400e' : '#475569')}>{item.reviewer}</span>
                    <span style={s.badge(item.priority === 'high' ? '#fee2e2' : '#e0e7ff', item.priority === 'high' ? '#991b1b' : '#3730a3')}>{item.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Nurture Management */}
          {tab === 2 && (
            <div style={s.list}>
              {nurtureCompanies.map(item => (
                <div key={item.id} style={s.row(selected?.id === item.id)} onClick={() => selectItem(item, 'nurture')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={s.statusDot(item.status === 'hot' ? '#ef4444' : item.status === 'warm' ? '#f59e0b' : item.status === 'cool' ? '#3b82f6' : '#94a3b8')} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.company}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{item.stage} · {item.sector}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: item.nextTouch === 'Overdue' ? '#ef4444' : '#475569' }}>{item.nextTouch === 'Overdue' ? '⚠️ Overdue' : `Next: ${item.nextTouch}`}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.touchCount} touches · Last: {item.lastTouch}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Targeting Universe */}
          {tab === 3 && (
            <div style={s.list}>
              {targetingCompanies.map(item => (
                <div key={item.id} style={s.row(selected?.id === item.id)} onClick={() => selectItem(item, 'target')}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#6366f1', flexShrink: 0 }}>{item.fit}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.company}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{item.sector} · {item.revenue}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {item.signals.map((sig, i) => <span key={i} style={{ fontSize: 11, color: '#64748b' }}>{sig}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* detail panel */}
        <div style={s.detail}>
          {selectedType === 'signal' && selected?.company && selected?.signal && (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selected.company}</h2>
                  <span style={s.badge(SIGNAL_TYPES[selected.type]?.bg, SIGNAL_TYPES[selected.type]?.color)}>{SIGNAL_TYPES[selected.type]?.label}</span>
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{selected.signal} · {selected.source} · {selected.time}</div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  {[{ l: 'Sector', v: selected.sector }, { l: 'Revenue', v: selected.revenue }, { l: 'Employees', v: selected.employees?.toLocaleString() || '—' }, { l: 'Score', v: selected.score }].map(m => (
                    <div key={m.l} style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>{m.l}</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{m.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>Thesis Fit</div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>{selected.thesis}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>Signal Detail</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{selected.detail}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>AI-Drafted Outreach — For IP Review</div>
                <textarea defaultValue={selected.draftEmail} style={s.textarea} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={s.btn(true)}>Submit for IP Review</button>
                  <button style={s.btn(false)}>Regenerate</button>
                  <button style={s.btn(false)}>Skip</button>
                </div>
              </div>
            </>
          )}

          {selectedType === 'outreach' && selected?.company && selected?.action && (
            <>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selected.company}</h2>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{selected.action}</div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  {[{ l: 'Signal', v: selected.signal }, { l: 'Status', v: selected.status === 'pending_review' ? 'Pending IP Review' : selected.status === 'approved' ? 'Approved' : 'Draft' }, { l: 'Priority', v: selected.priority }].map(m => (
                    <div key={m.l} style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>{m.l}</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              {selected.status === 'approved' && (
                <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 4 }}>✅ Approved by IP Team</div>
                  <div style={{ fontSize: 12, color: '#15803d' }}>This outreach has been reviewed and approved. Ready to send.</div>
                  <button style={{ ...s.btn(true), marginTop: 12, background: '#16a34a' }}>Send Now</button>
                </div>
              )}
              {selected.status === 'pending_review' && (
                <div style={{ padding: 16, background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>⏳ Pending IP Review</div>
                  <div style={{ fontSize: 12, color: '#a16207' }}>This outreach is awaiting review from the IP team before it can be sent.</div>
                </div>
              )}
              {selected.status === 'draft' && (
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>📝 Draft Needed</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>AI draft needs to be generated for this outreach.</div>
                  <button style={s.btn(true)}>Generate Draft</button>
                </div>
              )}
            </>
          )}

          {selectedType === 'nurture' && selected?.company && selected?.stage && (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={s.statusDot(selected.status === 'hot' ? '#ef4444' : selected.status === 'warm' ? '#f59e0b' : selected.status === 'cool' ? '#3b82f6' : '#94a3b8')} />
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selected.company}</h2>
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{selected.stage} · {selected.sector} · {selected.revenue}</div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  {[{ l: 'Touch Count', v: selected.touchCount }, { l: 'Last Touch', v: selected.lastTouch }, { l: 'Next Touch', v: selected.nextTouch }, { l: 'Status', v: selected.status }].map(m => (
                    <div key={m.l} style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>{m.l}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: m.v === 'Overdue' ? '#ef4444' : 'inherit' }}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>Engagement Notes</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{selected.notes}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>AI-Suggested Next Touch</div>
                <textarea defaultValue={selected.draftEmail} style={s.textarea} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={s.btn(true)}>Submit for IP Review</button>
                  <button style={s.btn(false)}>Regenerate</button>
                  <button style={s.btn(false)}>Skip</button>
                </div>
              </div>
            </>
          )}

          {selectedType === 'target' && selected?.company && selected?.fit && (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selected.company}</h2>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: selected.fit >= 95 ? '#dcfce7' : selected.fit >= 90 ? '#e0e7ff' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: selected.fit >= 95 ? '#166534' : selected.fit >= 90 ? '#3730a3' : '#92400e' }}>{selected.fit}</div>
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{selected.sector} · Source: {selected.source}</div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  {[{ l: 'Revenue', v: selected.revenue }, { l: 'Employees', v: selected.employees?.toLocaleString() }, { l: 'Thesis', v: selected.thesis }].map(m => (
                    <div key={m.l} style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>{m.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>Key Signals</div>
                {selected.signals.map((sig, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 6, fontSize: 13, color: '#475569' }}>📡 {sig}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={s.btn(true)}>Add to Coverage</button>
                <button style={s.btn(false)}>Research Deeper</button>
                <button style={s.btn(false)}>Dismiss</button>
              </div>
            </>
          )}
        </div>

        {/* chat */}
        <div style={s.chat}>
          <div style={s.chatHead}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            Claude · Growth Sourcing Copilot
          </div>
          <div style={s.chatBody}>
            {msgs.map((m, i) => <div key={i} style={s.bubble(m.role === 'user')}>{renderBold(m.text)}</div>)}
            <div ref={chatEnd} />
          </div>
          <div style={s.chatInput}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask about signals, nurture, targeting..." style={s.input} />
            <button onClick={send} style={s.sendBtn}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
