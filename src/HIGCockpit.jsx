import { useState, useRef, useEffect, useCallback } from 'react';

/* ── tiny sparkline components ── */
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

/* ── score & priority helpers ── */
const ScoreBadge = ({ score }) => {
  const bg = score >= 90 ? '#dcfce7' : score >= 80 ? '#fef3c7' : score >= 70 ? '#e0e7ff' : '#f1f5f9';
  const color = score >= 90 ? '#166534' : score >= 80 ? '#92400e' : score >= 70 ? '#3730a3' : '#64748b';
  return <div style={{ width: 34, height: 34, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{score}</div>;
};
const PriorityDot = ({ priority }) => {
  const c = priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f59e0b' : priority === 'medium' ? '#6366f1' : '#94a3b8';
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block', flexShrink: 0 }} />;
};
const priorityOf = (score) => score >= 90 ? 'critical' : score >= 80 ? 'high' : score >= 70 ? 'medium' : 'low';
const borderColor = (p) => p === 'critical' ? '#ef4444' : p === 'high' ? '#f59e0b' : p === 'medium' ? '#6366f1' : '#cbd5e1';

/* ── mock data ── */
const ALL_ITEMS = [
  // Signal Feed — Hot signals
  { id: 1, tab: 'Signals', company: 'Acuity Brands', signal: 'Series C — $85M raised', source: 'Pitchbook', time: '2h ago', type: 'funding', score: 96, sector: 'Industrial Tech', revenue: '$180M', employees: 1200, thesis: 'Industrial IoT / Building Automation', detail: 'Raised $85M Series C led by Insight Partners. Expanding into smart building controls — strong fit for growth equity thesis around industrial digitization.', message: 'Hi [Name],\n\nCongratulations on the impressive Series C raise — $85M is a strong validation of the smart building controls opportunity.\n\nAt H.I.G. Growth, we\'ve been tracking the industrial IoT space closely, and Acuity\'s trajectory from lighting into full building automation is exactly the kind of platform expansion we look to partner on.\n\nWould you be open to a brief conversation about how we might support the next phase of growth?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 2, tab: 'Signals', company: 'Veritone', signal: 'New CRO hired — ex-Palantir', source: 'Apollo', time: '4h ago', type: 'leadership', score: 91, sector: 'AI / Enterprise Software', revenue: '$145M', employees: 680, thesis: 'AI-powered enterprise analytics', detail: 'Appointed Sarah Chen as CRO, previously VP Sales at Palantir for 6 years. Signals go-to-market acceleration and potential for scaled enterprise motion.', message: 'Hi Sarah,\n\nCongratulations on joining Veritone as CRO — your Palantir background brings exactly the enterprise scaling expertise the AI analytics market needs right now.\n\nH.I.G. Growth has been following Veritone\'s evolution in the AI-powered analytics space, and leadership transitions like this often mark an inflection point.\n\nWould love to learn about your go-to-market vision and share how we\'ve helped similar companies scale their enterprise motion.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 3, tab: 'Signals', company: 'Cority', signal: 'Debt refinancing — $50M facility', source: 'CB Insights', time: '6h ago', type: 'debt', score: 88, sector: 'EHS Software', revenue: '$95M', employees: 520, thesis: 'Environmental health & safety SaaS', detail: 'Secured $50M revolving credit facility from SVB. May indicate preparation for acquisition-led growth or expansion into adjacent compliance markets.', message: 'Hi [Name],\n\nI noticed Cority recently secured a new credit facility — smart positioning as the EHS compliance landscape continues to expand with new regulatory requirements.\n\nH.I.G. Growth has deep experience partnering with compliance-oriented SaaS platforms during their scaling phase. We\'ve seen firsthand how the right growth capital can accelerate both organic expansion and strategic M&A in regulated verticals.\n\nWould you have 20 minutes to discuss your growth plans?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 4, tab: 'Signals', company: 'Procore Technologies', signal: 'Lookalike — 94% match to Viewpoint', source: 'Grata', time: '8h ago', type: 'lookalike', score: 85, sector: 'Construction Tech', revenue: '$720M', employees: 3200, thesis: 'Vertical SaaS — Construction', detail: 'Grata flagged Procore as 94% similar to portfolio company Viewpoint. Strong product overlap in construction project management, but Procore has deeper field operations tools.', message: 'Hi [Name],\n\nH.I.G. Growth has been actively investing in the construction technology vertical, and Procore\'s approach to connecting field operations with project management is compelling.\n\nWe\'d love to share some of our learnings from the space and explore whether there are partnership or growth opportunities worth discussing.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 5, tab: 'Signals', company: 'Bandwidth Inc.', signal: 'Series D — $120M raised', source: 'Pitchbook', time: '1d ago', type: 'funding', score: 93, sector: 'CPaaS / Telecom', revenue: '$530M', employees: 1100, thesis: 'Enterprise communications APIs', detail: 'Closed $120M Series D. Expanding enterprise CPaaS offerings and 911 API capabilities. Growing 35% YoY in enterprise segment.', message: 'Hi [Name],\n\nCongratulations on the Series D — $120M is a testament to the momentum in enterprise communications APIs.\n\nH.I.G. Growth has been watching the CPaaS space evolve, and Bandwidth\'s unique position with carrier-grade infrastructure combined with the 911 API capabilities creates a differentiated moat.\n\nWould welcome the chance to discuss how we might support your next growth chapter.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 6, tab: 'Signals', company: 'Samsara', signal: 'VP Engineering departed', source: 'Apollo', time: '1d ago', type: 'leadership', score: 79, sector: 'IoT / Fleet Management', revenue: '$860M', employees: 2800, thesis: 'Connected operations / IoT platform', detail: 'VP Engineering left after 4 years. Combined with recent product pivots, may signal strategic uncertainty or upcoming org restructuring.', message: 'Hi [Name],\n\nH.I.G. Growth has been following Samsara\'s journey in connected operations closely. As your platform continues to expand beyond fleet management into broader industrial IoT, we\'d love to share perspectives on scaling engineering organizations through rapid product expansion.\n\nWould a brief call be of interest?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 7, tab: 'Signals', company: 'Zenoti', signal: 'Acquired Booker — $28M', source: 'CB Insights', time: '2d ago', type: 'debt', score: 86, sector: 'Vertical SaaS — Wellness', revenue: '$110M', employees: 1400, thesis: 'Salon/spa management platform', detail: 'Acquired Booker from Mindbody for $28M, consolidating the salon/spa management space. Funded via existing credit facility. Integration creates 45K+ venue platform.', message: 'Hi [Name],\n\nThe Booker acquisition is a strong consolidation play — 45K+ venues under one platform creates real scale in a fragmented market.\n\nH.I.G. Growth has partnered with several vertical SaaS platforms through exactly this kind of roll-up strategy. We\'d be happy to share some of our playbooks on post-acquisition integration and accelerating cross-sell.\n\nWorth a conversation?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 8, tab: 'Signals', company: 'Automox', signal: 'Lookalike — 91% match to Tanium', source: 'Grata', time: '2d ago', type: 'lookalike', score: 82, sector: 'Cybersecurity / IT Ops', revenue: '$65M', employees: 350, thesis: 'Cloud-native endpoint management', detail: 'Grata flagged 91% similarity to Tanium. Cloud-native approach to endpoint management and patching. Growing 60%+ YoY, smaller but faster-growing alternative.', message: 'Hi [Name],\n\nH.I.G. Growth has been tracking the shift from legacy endpoint management to cloud-native approaches, and Automox is clearly leading that transition.\n\nThe 60%+ growth rate at your current scale is exactly the kind of trajectory we look to support with growth capital and operational expertise.\n\nWould you be open to an introductory conversation?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },

  // Nurture — Active engagement
  { id: 101, tab: 'Nurture', company: 'Relativity', signal: 'IC deep dive — VP Corp Dev engaged', source: 'Internal', time: '5 days ago', type: 'leadership', score: 95, sector: 'Legal Tech', revenue: '$340M', employees: 1800, thesis: 'AI-powered legal analytics', detail: 'Deep in discussions. VP Corp Dev very engaged. They\'re evaluating growth equity options for AI product buildout. Schedule follow-up with IC team. 12 touches so far.', stage: 'Active nurture', touchCount: 12, status: 'hot', message: 'Hi [Name],\n\nThanks for the productive conversation last week about Relativity\'s AI product roadmap. Our investment committee was very impressed with the vision for AI-assisted review workflows.\n\nAs a next step, we\'d love to arrange a deeper dive with our technology operating partners who\'ve helped scale AI product teams at similar companies.\n\nCan we find time this week?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 102, tab: 'Nurture', company: 'Kaseya', signal: 'EMEA expansion — PE conference follow-up', source: 'Internal', time: '3 days ago', type: 'leadership', score: 84, sector: 'IT Management', revenue: '$1.2B', employees: 4200, thesis: 'IT infrastructure platform', detail: 'Met at PE conference Q4. CRO interested in growth capital for international expansion. Follow up on EMEA plans. 8 touches, warm engagement.', stage: 'Active nurture', touchCount: 8, status: 'warm', message: 'Hi [Name],\n\nGreat connecting at the PE conference last quarter. I wanted to follow up on our conversation about Kaseya\'s EMEA expansion plans.\n\nWe\'ve recently helped two portfolio companies navigate European market entry — would be happy to share some of those lessons over a quick call.\n\nAny availability next week?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 103, tab: 'Nurture', company: 'Finastra', signal: 'Cloud migration — CFO engaged', source: 'Internal', time: '1 week ago', type: 'funding', score: 82, sector: 'FinTech', revenue: '$1.9B', employees: 8500, thesis: 'Financial services SaaS', detail: 'CFO engaged. Exploring minority growth investment for cloud migration. Send updated market comp analysis. 5 touches, warm.', stage: 'Active nurture', touchCount: 5, status: 'warm', message: 'Hi [Name],\n\nFollowing up on our discussion about Finastra\'s cloud migration strategy. I\'ve put together an updated market comp analysis showing how similar financial software platforms have approached this transition.\n\nAttached for your review — happy to walk through the key takeaways whenever convenient.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 104, tab: 'Nurture', company: 'Hyland Software', signal: 'Initial outreach — CEO responded', source: 'Internal', time: '2 weeks ago', type: 'lookalike', score: 72, sector: 'ECM / Content Services', revenue: '$950M', employees: 4000, thesis: 'Content intelligence platform', detail: 'Initial outreach via mutual connection. CEO responded positively but no meeting set yet. Try industry angle. 3 touches, cool.', stage: 'Early engagement', touchCount: 3, status: 'cool', message: 'Hi [Name],\n\nI wanted to share a perspective piece we recently published on the content services platform market — particularly relevant given the AI-driven document intelligence trend reshaping ECM.\n\nGiven Hyland\'s leadership position, I thought this might resonate. Would love to get your take on the market direction.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 105, tab: 'Nurture', company: 'Cornerstone OnDemand', signal: 'AI Skills Engine launch — re-engage', source: 'Internal', time: '6 weeks ago', type: 'leadership', score: 68, sector: 'HCM / Learning', revenue: '$910M', employees: 3600, thesis: 'Talent management SaaS', detail: 'Went quiet after initial interest. New product launch (AI Skills Engine) creates re-engagement opportunity. 4 touches, overdue.', stage: 'Re-engage', touchCount: 4, status: 'cold', message: 'Hi [Name],\n\nI noticed Cornerstone\'s launch of the AI Skills Engine — it\'s exactly the kind of product innovation we were discussing when we last spoke about the HCM market evolution.\n\nH.I.G. Growth has seen firsthand how AI-native product launches can accelerate growth trajectories, and we\'d love to revisit the conversation about supporting Cornerstone\'s next chapter.\n\nWould you be open to reconnecting?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },

  // Targeting — New high-fit companies
  { id: 201, tab: 'Targeting', company: 'Celonis', signal: 'Fit score 97 — 60% YoY growth', source: 'Grata + Pitchbook', time: 'Screened', type: 'funding', score: 97, sector: 'Process Mining', revenue: '$320M', employees: 3000, thesis: 'Process intelligence platform', detail: '60% YoY growth. Expanding into supply chain optimization. IPO track. Strong net retention >140%. Process mining TAM expanding rapidly with AI adoption.', signals: ['60% YoY growth', 'Expanding into supply chain'], message: 'Hi [Name],\n\nH.I.G. Growth has been closely following the process mining space, and Celonis\'s trajectory is exceptional — 60% YoY growth with expansion into supply chain is exactly the kind of platform thesis we invest behind.\n\nWe\'d love to share some of our perspectives on scaling enterprise platforms through adjacent market expansion.\n\nWould a brief introductory call be of interest?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 202, tab: 'Targeting', company: 'Braze', signal: 'Fit score 94 — IPO pipeline candidate', source: 'CB Insights', time: 'Screened', type: 'funding', score: 94, sector: 'Customer Engagement', revenue: '$470M', employees: 1600, thesis: 'Cross-channel marketing automation', detail: 'IPO pipeline candidate. New AI features launched driving expansion revenue. Strong enterprise logos. Cross-channel engagement platform with 120%+ net retention.', signals: ['IPO pipeline candidate', 'New AI features launched'], message: 'Hi [Name],\n\nBraze\'s position in cross-channel customer engagement is compelling — the new AI-powered features are driving exactly the kind of expansion revenue that gets our attention.\n\nH.I.G. Growth partners with market leaders at your stage to accelerate the path to public markets. We\'d welcome the opportunity to share our experience.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 203, tab: 'Targeting', company: 'Highspot', signal: 'Fit score 92 — ACV growing 40%', source: 'Grata', time: 'Screened', type: 'funding', score: 92, sector: 'Sales Enablement', revenue: '$190M', employees: 900, thesis: 'Revenue enablement platform', detail: 'Series F potential. Enterprise ACV growth 40%. Revenue enablement TAM expanding as sales orgs consolidate tools. Strong competitive moat in content analytics.', signals: ['Series F potential', 'Enterprise ACV growth 40%'], message: 'Hi [Name],\n\nThe revenue enablement space is consolidating, and Highspot\'s 40% ACV growth shows you\'re winning the enterprise segment. H.I.G. Growth has deep experience scaling GTM-oriented SaaS platforms.\n\nWould love to connect and share some perspectives.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 204, tab: 'Targeting', company: 'Ramp', signal: 'Fit score 90 — Profitable at scale', source: 'Pitchbook', time: 'Screened', type: 'funding', score: 90, sector: 'Corporate FinTech', revenue: '$350M', employees: 800, thesis: 'Corporate card & spend management', detail: 'Profitable at scale. Launched procurement suite expanding TAM. Corporate card + spend management + procurement creates full CFO stack. Rule of 40+ company.', signals: ['Profitable at scale', 'Launched procurement suite'], message: 'Hi [Name],\n\nRamp\'s path to profitability while maintaining growth is rare in the current environment — and the procurement suite expansion creates a much larger TAM opportunity.\n\nH.I.G. Growth backs exactly this kind of capital-efficient scaling. Would welcome a conversation.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 205, tab: 'Targeting', company: 'Abnormal Security', signal: 'Fit score 89 — ARR tripled YoY', source: 'Apollo + CB Insights', time: 'Screened', type: 'funding', score: 89, sector: 'Cybersecurity', revenue: '$210M', employees: 600, thesis: 'AI-native email security', detail: 'ARR tripled YoY. Series D likely. AI-native approach to email security gaining rapid enterprise adoption. Displacing legacy SEGs across Fortune 500.', signals: ['ARR tripled YoY', 'Series D likely'], message: 'Hi [Name],\n\nTripling ARR while displacing legacy SEGs across the Fortune 500 is a breakout trajectory. H.I.G. Growth has backed several cybersecurity platforms through hyper-growth phases.\n\nWe\'d love to share some operational insights and learn about your vision for Abnormal\'s next chapter.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 206, tab: 'Targeting', company: 'Notion', signal: 'Fit score 87 — Enterprise 55% of revenue', source: 'Grata', time: 'Screened', type: 'leadership', score: 87, sector: 'Productivity / Collaboration', revenue: '$280M', employees: 500, thesis: 'Connected workspace platform', detail: 'Enterprise revenue 55% of mix. AI features driving expansion. Connected workspace platform with strong bottom-up adoption converting to enterprise contracts.', signals: ['Enterprise revenue 55% of mix', 'AI features driving expansion'], message: 'Hi [Name],\n\nNotion\'s enterprise conversion story is one of the most impressive bottom-up motions we\'ve seen — 55% enterprise mix with AI-driven expansion is a powerful combination.\n\nH.I.G. Growth specializes in helping platforms like yours accelerate the enterprise flywheel. Would love to connect.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },

  // Outreach queue — Follow-ups & pending actions
  { id: 301, tab: 'Outreach', company: 'Acuity Brands', signal: 'IP Review pending — Series C intro', source: 'Queue', time: 'Pending', type: 'funding', score: 90, sector: 'Industrial Tech', revenue: '$180M', employees: 1200, thesis: 'Industrial IoT', detail: 'Intro email submitted for IP review. Based on Series C $85M signal. High priority — strong thesis fit for industrial digitization.', queueStatus: 'pending_review', message: 'Hi [Name],\n\nCongratulations on the impressive Series C raise — $85M is a strong validation of the smart building controls opportunity.\n\nAt H.I.G. Growth, we\'ve been tracking the industrial IoT space closely, and Acuity\'s trajectory from lighting into full building automation is exactly the kind of platform expansion we look to partner on.\n\nWould you be open to a brief conversation about how we might support the next phase of growth?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 302, tab: 'Outreach', company: 'Veritone', signal: 'IP Review pending — CRO congrats', source: 'Queue', time: 'Pending', type: 'leadership', score: 88, sector: 'AI / Enterprise', revenue: '$145M', employees: 680, thesis: 'AI analytics', detail: 'Congrats + intro email submitted for IP review. Referencing new CRO hire from Palantir.', queueStatus: 'pending_review', message: 'Hi Sarah,\n\nCongratulations on joining Veritone as CRO — your Palantir background brings exactly the enterprise scaling expertise the AI analytics market needs right now.\n\nWould love to learn about your go-to-market vision and share how we\'ve helped similar companies scale their enterprise motion.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 303, tab: 'Outreach', company: 'Relativity', signal: 'Approved — Schedule IC deep dive', source: 'Queue', time: 'Ready', type: 'leadership', score: 95, sector: 'Legal Tech', revenue: '$340M', employees: 1800, thesis: 'AI legal analytics', detail: 'IC deep dive scheduling approved. VP Corp Dev very engaged — most advanced discussion in pipeline. Prioritize this week.', queueStatus: 'approved', message: 'Hi [Name],\n\nThanks for the productive conversation last week about Relativity\'s AI product roadmap. Our investment committee was very impressed with the vision for AI-assisted review workflows.\n\nAs a next step, we\'d love to arrange a deeper dive with our technology operating partners who\'ve helped scale AI product teams at similar companies.\n\nCan we find time this week?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 304, tab: 'Outreach', company: 'Cority', signal: 'IP Review pending — Debt signal intro', source: 'Queue', time: 'Pending', type: 'debt', score: 83, sector: 'EHS Software', revenue: '$95M', employees: 520, thesis: 'Compliance SaaS', detail: 'Intro email submitted for IP review. Based on $50M debt refinancing signal.', queueStatus: 'pending_review', message: 'Hi [Name],\n\nI noticed Cority recently secured a new credit facility — smart positioning as the EHS compliance landscape continues to expand with new regulatory requirements.\n\nWould you have 20 minutes to discuss your growth plans?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 305, tab: 'Outreach', company: 'Cornerstone OnDemand', signal: 'Approved — Re-engagement email', source: 'Queue', time: 'Ready', type: 'leadership', score: 78, sector: 'HCM / Learning', revenue: '$910M', employees: 3600, thesis: 'Talent SaaS', detail: 'Re-engagement email approved. AI Skills Engine launch creates natural re-entry point. Medium priority.', queueStatus: 'approved', message: 'Hi [Name],\n\nI noticed Cornerstone\'s launch of the AI Skills Engine — it\'s exactly the kind of product innovation we were discussing when we last spoke.\n\nWould you be open to reconnecting?\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
  { id: 306, tab: 'Outreach', company: 'Bandwidth Inc.', signal: 'Draft needed — Series D intro', source: 'Queue', time: 'Draft', type: 'funding', score: 85, sector: 'CPaaS / Telecom', revenue: '$530M', employees: 1100, thesis: 'Enterprise comms APIs', detail: 'AI draft needs to be generated for Series D intro. Strong thesis fit — enterprise CPaaS with 35% YoY growth.', queueStatus: 'draft', message: 'Hi [Name],\n\nCongratulations on the Series D — $120M is a testament to the momentum in enterprise communications APIs.\n\nH.I.G. Growth has been watching the CPaaS space evolve, and Bandwidth\'s unique position with carrier-grade infrastructure creates a differentiated moat.\n\nWould welcome the chance to discuss how we might support your next growth chapter.\n\nBest,\n[Your Name]\nH.I.G. Growth Partners' },
];

const TABS = ['Signals', 'Outreach', 'Nurture', 'Targeting'];
const SIGNAL_TYPES = {
  funding: { label: 'Funding', color: '#10b981', bg: '#ecfdf5' },
  leadership: { label: 'Leadership', color: '#6366f1', bg: '#eef2ff' },
  debt: { label: 'Debt / M&A', color: '#f59e0b', bg: '#fffbeb' },
  lookalike: { label: 'Lookalike', color: '#8b5cf6', bg: '#f5f3ff' },
};

const CHAT_RESPONSES = {
  priority: "Here's what I'd **prioritize today**:\n\n1. **Relativity** (score 95) — IC deep dive is approved and ready. VP Corp Dev is very engaged — don't let this one cool. **~$340M deal**\n2. **Acuity Brands** (score 96) — Series C $85M just closed. Freshest high-quality signal. Get IP review moving.\n3. **Bandwidth Inc.** (score 93) — Series D $120M. Draft still needs generation — I can help.\n4. **Cornerstone OnDemand** — Overdue re-engagement. AI Skills Engine launch = natural re-entry.\n5. **Celonis** (fit 97) — Highest-fit targeting company. 60% YoY growth.\n\nEstimated pipeline impact if you act on all 5: **~$2.1B in potential opportunities**.",
  pipeline: "**Current pipeline snapshot:**\n\n• **$2.4B** in tracked opportunities across 34 companies\n• **6 active discussions** (Relativity leading at $340M)\n• **12 meetings** booked this month (vs 9 last month, +33%)\n• Average deal cycle: **14 months** from first touch\n\n**By stage:**\n• IC Deep Dive: 1 (Relativity)\n• Active Nurture: 3 (Kaseya, Finastra, Relativity)\n• Early Engagement: 1 (Hyland Software)\n• Re-engage: 1 (Cornerstone OnDemand)\n\n**Pipeline value trend:** $1.6B → $1.8B → $1.9B → $2.0B → $2.3B → **$2.4B** (6-month view)",
  ic: "**IC Prep — Relativity Deep Dive:**\n\n**Company:** Relativity (RelativityOne)\n**Sector:** Legal Tech — AI-powered eDiscovery & analytics\n**Revenue:** $340M | **Employees:** 1,800\n**Signal Score:** 95 (critical priority)\n\n**Key Talking Points:**\n• AI-assisted review workflows — potential 10x efficiency gain for legal teams\n• Market position: #1 in eDiscovery, expanding into broader legal analytics\n• VP Corp Dev actively evaluating growth equity for AI product buildout\n• 12 touchpoints so far — deepest relationship in current pipeline\n\n**Thesis Fit:** AI-native legal platform with strong enterprise moat. Growth capital accelerates AI product buildout and international expansion.\n\n**Risk Factors:** Regulatory complexity in legal AI, competitive pressure from Thomson Reuters / RELX.",
  nurture: "**Nurture priorities this week:**\n\n🔴 **Relativity** — HOT, 12 touches. IC deep dive scheduling approved. Act today.\n🟠 **Kaseya** — Warm, 8 touches. Follow up on EMEA expansion plans.\n🟠 **Finastra** — Warm, 5 touches. CFO engaged, send market comps.\n🔵 **Hyland Software** — Cool, 3 touches. Try industry angle for ECM.\n⚪ **Cornerstone OnDemand** — Cold, 4 touches. **OVERDUE** — AI Skills Engine is your re-entry.\n\n**1 overdue touchpoint** needs immediate attention.\n**3 emails** ready in draft for your review.",
  team: "**Team Performance — East vs West:**\n\n**East Team (Eric) — Scaled Outbound:**\n• 28 companies in active cadences\n• 12 new sequences launched this week\n• CRM enrichment: 94% (up from 87%)\n• Cadence completion: 78%\n• Meeting book rate up 23% with AI-personalized first touches\n\n**West Team (Evan) — Signal-First:**\n• 12 new KLIIs detected this week\n• 3 companies moved to active outreach\n• Signal→Meeting conversion: **34%** (vs 8% cold outbound)\n• Coverage universe: 450 companies monitored\n\n**Takeaway:** Signal-first outperforms cold outbound **4x** on meeting conversion.",
  fallback: "I can help with:\n\n• **\"What should I prioritize?\"** — Top actions ranked by impact\n• **\"Pipeline summary\"** — Current pipeline snapshot\n• **\"Prep for IC\"** — Investment committee prep materials\n• **\"Nurture status\"** — Engagement priorities and overdue items\n• **\"Team performance\"** — East vs West comparison\n\nOr ask me about any specific company in your coverage universe.",
};

const METRICS = [
  { label: 'Companies Tracked', value: '486', sub: '+12 this week', trend: [410, 425, 440, 452, 460, 472, 486], color: '#6366f1' },
  { label: 'KLIIs This Week', value: '12', sub: '4 funding · 3 leadership', trend: [6, 9, 7, 11, 8, 14, 12], color: '#10b981' },
  { label: 'Outreach Sent', value: '34', sub: '82% open rate', trend: [22, 28, 19, 31, 26, 38, 34], color: '#f59e0b' },
  { label: 'Meetings Booked', value: '12', sub: '+33% vs last month', trend: [5, 7, 6, 9, 8, 9, 12], color: '#8b5cf6' },
  { label: 'Pipeline Value', value: '$2.4B', sub: '34 opportunities', trend: [1.6, 1.8, 1.9, 2.0, 2.1, 2.3, 2.4], color: '#ec4899' },
];

/* ── weekly activity data for analytics ── */
const WEEKLY_ACTIVITY = [
  { day: 'Mon', emails: 18, calls: 12, linkedin: 6, meetings: 3 },
  { day: 'Tue', emails: 22, calls: 10, linkedin: 8, meetings: 2 },
  { day: 'Wed', emails: 14, calls: 15, linkedin: 5, meetings: 4 },
  { day: 'Thu', emails: 20, calls: 8, linkedin: 7, meetings: 2 },
  { day: 'Fri', emails: 16, calls: 11, linkedin: 4, meetings: 1 },
];

const PIPELINE_TREND = [
  { week: 'W1', value: 42 }, { week: 'W2', value: 78 }, { week: 'W3', value: 115 },
  { week: 'W4', value: 168 }, { week: 'W5', value: 210 }, { week: 'W6', value: 285 },
  { week: 'W7', value: 340 }, { week: 'W8', value: 420 }, { week: 'W9', value: 510 },
  { week: 'W10', value: 680 }, { week: 'W11', value: 840 },
];

const FUNNEL = [
  { stage: 'Signals Detected', count: 486, pct: 100 },
  { stage: 'Outreach Sent', count: 115, pct: 24 },
  { stage: 'Meetings Booked', count: 34, pct: 7 },
  { stage: 'Active Discussions', count: 6, pct: 1.2 },
];

export default function HIGCockpit() {
  const [activeTab, setActiveTab] = useState('Signals');
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedMessages, setEditedMessages] = useState({});
  const [sentIds, setSentIds] = useState(new Set());
  const [skippedIds, setSkippedIds] = useState(new Set());
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [view, setView] = useState('queue');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([
    { from: 'claude', text: "Good morning! I'm your **Growth Sourcing Copilot**. Monitoring **486 companies** across your coverage universe.\n\n**12 new KLIIs** detected this week — Acuity Brands (Series C, $85M) and Bandwidth Inc. (Series D, $120M) scored highest.\n\n**Relativity** is ready for IC deep dive, and **Cornerstone OnDemand** has an overdue re-engagement.\n\nWhat would you like to focus on?" },
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs]);

  /* ── derived data ── */
  const getTabItems = (tab) => ALL_ITEMS.filter(i => i.tab === tab);
  const isActioned = (id) => sentIds.has(id) || skippedIds.has(id) || reviewedIds.has(id);
  const visibleItems = (tab) => {
    let items = getTabItems(tab);
    if (tab === 'Signals' && filterType !== 'all') items = items.filter(i => i.type === filterType);
    if (!showCompleted) items = items.filter(i => !isActioned(i.id));
    return items;
  };
  const tabCounts = {};
  TABS.forEach(t => { tabCounts[t] = getTabItems(t).filter(i => !isActioned(i.id)).length; });
  const totalActions = Object.values(tabCounts).reduce((a, b) => a + b, 0);
  const completedToday = sentIds.size + skippedIds.size + reviewedIds.size;

  /* ── actions ── */
  const handleSend = (id) => {
    setSentIds(prev => new Set(prev).add(id));
    setSelectedLead(null);
    setEditingId(null);
  };
  const handleSkip = (id) => {
    setSkippedIds(prev => new Set(prev).add(id));
    setSelectedLead(null);
    setEditingId(null);
  };
  const handleSubmitReview = (id) => {
    setReviewedIds(prev => new Set(prev).add(id));
    setSelectedLead(null);
    setEditingId(null);
  };
  const handleSaveEdit = (id) => {
    setEditingId(null);
  };

  /* ── chat ── */
  const handleChat = useCallback((text) => {
    if (!text.trim()) return;
    const q = text.toLowerCase();
    setChatMsgs(prev => [...prev, { from: 'user', text }]);
    setChatInput('');
    setChatLoading(true);
    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      let response;
      if (/prioriti|focus|priority|what should/.test(q)) response = CHAT_RESPONSES.priority;
      else if (/pipeline|deal|snapshot|opportunity/.test(q)) response = CHAT_RESPONSES.pipeline;
      else if (/ic |prep|committee|relativity/.test(q)) response = CHAT_RESPONSES.ic;
      else if (/nurture|follow|touch|engage|overdue/.test(q)) response = CHAT_RESPONSES.nurture;
      else if (/team|east|west|eric|evan|performance/.test(q)) response = CHAT_RESPONSES.team;
      else {
        // check if asking about a specific company
        const match = ALL_ITEMS.find(i => q.includes(i.company.toLowerCase()));
        if (match) {
          response = `**${match.company}** — ${match.sector}\n\n• **Revenue:** ${match.revenue} | **Employees:** ${match.employees?.toLocaleString() || 'N/A'}\n• **Signal:** ${match.signal}\n• **Score:** ${match.score} | **Type:** ${SIGNAL_TYPES[match.type]?.label || match.type}\n• **Thesis:** ${match.thesis}\n\n${match.detail}\n\nWant me to draft outreach or pull up more details?`;
        } else {
          response = CHAT_RESPONSES.fallback;
        }
      }
      setChatMsgs(prev => [...prev, { from: 'claude', text: response }]);
      setChatLoading(false);
    }, delay);
  }, []);

  const renderBold = (t) => t.split(/(\*\*.*?\*\*)/g).map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p);

  /* ── selected item ── */
  const sel = ALL_ITEMS.find(i => i.id === selectedLead);

  /* ── styles ── */
  const s = {
    page: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#FAFAF8', color: '#1e293b', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
    nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 54, background: '#0f172a', color: '#fff', fontSize: 14, flexShrink: 0 },
    brand: { fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 },
    logo: { width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' },
    strip: { display: 'flex', gap: 1, background: '#e2e8f0', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
    kpi: { flex: 1, background: '#fff', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 3 },
    kpiLabel: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#888', letterSpacing: '.5px' },
    kpiVal: { fontSize: 20, fontWeight: 700 },
    kpiSub: { fontSize: 11, color: '#888' },
    body: { display: 'flex', flex: 1, overflow: 'hidden' },
    tabBtn: (active) => ({
      padding: '10px 16px', fontSize: 13, fontWeight: active ? 600 : 400,
      color: active ? '#6366f1' : '#888', cursor: 'pointer', background: 'none',
      border: 'none', borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
      display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
    }),
    badge: (bg, color) => ({ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: bg, color, lineHeight: '16px' }),
    countBadge: (count) => ({
      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, lineHeight: '16px',
      background: count > 0 ? '#eef2ff' : '#f1f5f9', color: count > 0 ? '#6366f1' : '#94a3b8',
    }),
  };

  /* ── analytics view ── */
  if (view === 'analytics') {
    const maxPipeline = Math.max(...PIPELINE_TREND.map(d => d.value));
    const maxActivity = Math.max(...WEEKLY_ACTIVITY.map(d => d.emails + d.calls + d.linkedin));
    return (
      <div style={s.page}>
        <nav style={s.nav}>
          <div style={s.brand}><div style={s.logo}>H</div>H.I.G. Growth Sourcing Copilot</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setView('queue')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,.08)', color: '#cbd5e1', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Action queue</button>
            <button style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Analytics</button>
          </div>
        </nav>
        <div style={{ flex: 1, overflow: 'auto', padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Pipeline Trajectory */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Pipeline Trajectory</h3>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 16 }}>Cumulative pipeline value ($M) over 11 weeks</div>
            <svg width="100%" height="160" viewBox="0 0 440 160" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="pgr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={PIPELINE_TREND.map((d, i) => `${(i / (PIPELINE_TREND.length - 1)) * 420 + 10},${140 - (d.value / maxPipeline) * 120}`).join(' ') + ` 430,140 10,140`}
                fill="url(#pgr)"
              />
              <polyline
                points={PIPELINE_TREND.map((d, i) => `${(i / (PIPELINE_TREND.length - 1)) * 420 + 10},${140 - (d.value / maxPipeline) * 120}`).join(' ')}
                fill="none" stroke="#6366f1" strokeWidth="2.5"
              />
              {PIPELINE_TREND.map((d, i) => {
                const x = (i / (PIPELINE_TREND.length - 1)) * 420 + 10;
                const y = 140 - (d.value / maxPipeline) * 120;
                return i === PIPELINE_TREND.length - 1 ? <circle key={i} cx={x} cy={y} r="4" fill="#6366f1" /> : null;
              })}
              {PIPELINE_TREND.filter((_, i) => i % 2 === 0).map((d, i) => (
                <text key={i} x={(i * 2 / (PIPELINE_TREND.length - 1)) * 420 + 10} y="155" fontSize="9" fill="#888" textAnchor="middle">{d.week}</text>
              ))}
            </svg>
            <div style={{ textAlign: 'right', fontSize: 20, fontWeight: 700, color: '#6366f1', marginTop: 4 }}>$840M</div>
          </div>

          {/* Activity Breakdown */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Activity Breakdown</h3>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 16 }}>This week — emails, calls, LinkedIn by day</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 130, paddingBottom: 20 }}>
              {WEEKLY_ACTIVITY.map((d, i) => {
                const total = d.emails + d.calls + d.linkedin;
                const h = (total / maxActivity) * 100;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{total}</span>
                    <div style={{ width: 28, height: h, borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse' }}>
                      <div style={{ height: `${(d.emails / total) * 100}%`, background: '#6366f1' }} />
                      <div style={{ height: `${(d.calls / total) * 100}%`, background: '#8b5cf6' }} />
                      <div style={{ height: `${(d.linkedin / total) * 100}%`, background: '#14b8a6' }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#888' }}>{d.day}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
              {[{ label: 'Emails', color: '#6366f1' }, { label: 'Calls', color: '#8b5cf6' }, { label: 'LinkedIn', color: '#14b8a6' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#555' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />{l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sourcing Funnel</h3>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 16 }}>Signal → Discussion conversion</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FUNNEL.map((f, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{f.stage}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{f.count}</span>
                  </div>
                  <div style={{ height: 20, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${f.pct}%`, height: '100%', background: `linear-gradient(90deg, #6366f1, #8b5cf6)`, borderRadius: 6, transition: 'width .5s', minWidth: f.pct < 5 ? 20 : undefined }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{f.pct}% of signals</div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Performance */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Team Performance — East vs West</h3>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 16 }}>Scaled outbound vs signal-first comparison</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { team: 'East (Eric)', subtitle: 'Scaled Outbound', metrics: [{ l: 'Outreach sent', v: '68' }, { l: 'Open rate', v: '78%' }, { l: 'Meetings', v: '7' }, { l: 'CRM enrichment', v: '94%' }], color: '#6366f1' },
                { team: 'West (Evan)', subtitle: 'Signal-First', metrics: [{ l: 'Signals acted on', v: '28' }, { l: 'Signal→Meeting', v: '34%' }, { l: 'Meetings', v: '5' }, { l: 'Coverage universe', v: '450' }], color: '#10b981' },
              ].map(t => (
                <div key={t.team} style={{ flex: 1, padding: 14, background: '#FAFAF8', borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: t.color, marginBottom: 2 }}>{t.team}</div>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>{t.subtitle}</div>
                  {t.metrics.map(m => (
                    <div key={m.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
                      <span style={{ color: '#888' }}>{m.l}</span>
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

  /* ── main queue view ── */
  const items = visibleItems(activeTab);

  return (
    <div style={s.page}>
      {/* nav */}
      <nav style={s.nav}>
        <div style={s.brand}><div style={s.logo}>H</div>H.I.G. Growth Sourcing Copilot</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setView('queue')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Action queue</button>
          <button onClick={() => setView('analytics')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,.08)', color: '#cbd5e1', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Analytics</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,.15)', margin: '0 4px' }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{totalActions} actions remaining</span>
          {completedToday > 0 && <span style={{ fontSize: 12, color: '#10b981' }}>{completedToday} completed today</span>}
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', minWidth: 0 }}>
          {/* tabs */}
          <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
            {TABS.map(t => (
              <button key={t} style={s.tabBtn(activeTab === t)} onClick={() => { setActiveTab(t); setSelectedLead(null); setEditingId(null); setFilterType('all'); }}>
                {t} <span style={s.countBadge(tabCounts[t])}>{tabCounts[t]}</span>
              </button>
            ))}
            <div style={{ flex: 1 }} />
            {completedToday > 0 && (
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                style={{ padding: '4px 12px', margin: '0 12px', borderRadius: 99, border: '1px solid #e2e8f0', background: showCompleted ? '#eef2ff' : '#fff', color: showCompleted ? '#6366f1' : '#888', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {showCompleted ? 'Hide completed' : 'Show completed'}
              </button>
            )}
          </div>

          {/* signal type filters */}
          {activeTab === 'Signals' && (
            <div style={{ display: 'flex', gap: 6, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              <button
                style={{ padding: '4px 12px', borderRadius: 99, border: `1px solid ${filterType === 'all' ? '#6366f1' : '#e2e8f0'}`, background: filterType === 'all' ? '#eef2ff' : '#fff', color: filterType === 'all' ? '#6366f1' : '#888', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setFilterType('all')}
              >All signals</button>
              {Object.entries(SIGNAL_TYPES).map(([k, v]) => (
                <button
                  key={k}
                  style={{ padding: '4px 12px', borderRadius: 99, border: `1px solid ${filterType === k ? v.color : '#e2e8f0'}`, background: filterType === k ? v.bg : '#fff', color: filterType === k ? v.color : '#888', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setFilterType(k)}
                >{v.label}</button>
              ))}
            </div>
          )}

          {/* item list */}
          <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
            {items.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>
                  {completedToday > 0 ? '🎯' : '📋'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {completedToday > 0 ? 'All caught up!' : 'No items'}
                </div>
                <div style={{ fontSize: 12 }}>
                  {completedToday > 0 ? `${completedToday} items completed today` : 'Nothing to show in this view'}
                </div>
              </div>
            )}
            {items.map(item => {
              const actioned = isActioned(item.id);
              const priority = priorityOf(item.score);
              return (
                <div
                  key={item.id}
                  onClick={() => { setSelectedLead(selectedLead === item.id ? null : item.id); setEditingId(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                    background: selectedLead === item.id ? '#f7f6f3' : '#fff',
                    borderLeft: `3px solid ${borderColor(priority)}`,
                    opacity: actioned ? 0.45 : 1,
                    transition: 'all .15s',
                  }}
                >
                  <PriorityDot priority={priority} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{item.company}</span>
                      {item.queueStatus === 'approved' && <span style={s.badge('#dcfce7', '#166534')}>Approved</span>}
                      {item.queueStatus === 'pending_review' && <span style={s.badge('#fef3c7', '#92400e')}>IP Review</span>}
                      {item.queueStatus === 'draft' && <span style={s.badge('#f1f5f9', '#64748b')}>Draft</span>}
                      {item.status === 'hot' && <span style={s.badge('#fee2e2', '#991b1b')}>Hot</span>}
                      {item.status === 'warm' && <span style={s.badge('#fef3c7', '#92400e')}>Warm</span>}
                      {item.status === 'cool' && <span style={s.badge('#e0e7ff', '#3730a3')}>Cool</span>}
                      {item.status === 'cold' && <span style={s.badge('#f1f5f9', '#64748b')}>Cold</span>}
                      {actioned && sentIds.has(item.id) && <span style={s.badge('#dcfce7', '#166534')}>Sent</span>}
                      {actioned && skippedIds.has(item.id) && <span style={s.badge('#f1f5f9', '#64748b')}>Skipped</span>}
                      {actioned && reviewedIds.has(item.id) && <span style={s.badge('#e0e7ff', '#3730a3')}>In Review</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{item.signal}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={s.badge(SIGNAL_TYPES[item.type]?.bg || '#f1f5f9', SIGNAL_TYPES[item.type]?.color || '#64748b')}>{SIGNAL_TYPES[item.type]?.label || item.type}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.time}</span>
                  </div>
                  <ScoreBadge score={item.score} />
                </div>
              );
            })}
          </div>
        </div>

        {/* detail panel */}
        {sel && (
          <div style={{
            width: 440, background: '#fff', overflow: 'auto', borderRight: '1px solid #e2e8f0',
            padding: 24, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0,
          }}>
            {/* header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `linear-gradient(135deg, ${SIGNAL_TYPES[sel.type]?.bg || '#f1f5f9'}, ${SIGNAL_TYPES[sel.type]?.color || '#888'}22)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: SIGNAL_TYPES[sel.type]?.color || '#888',
                }}>
                  {sel.company.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{sel.company}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{sel.sector} · {sel.revenue}</div>
                </div>
                <ScoreBadge score={sel.score} />
              </div>

              {/* signal badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                <span style={s.badge(SIGNAL_TYPES[sel.type]?.bg, SIGNAL_TYPES[sel.type]?.color)}>{SIGNAL_TYPES[sel.type]?.label}</span>
                {sel.source && <span style={s.badge('#f1f5f9', '#64748b')}>{sel.source}</span>}
                {sel.time && <span style={s.badge('#f1f5f9', '#64748b')}>{sel.time}</span>}
                {sel.stage && <span style={s.badge('#eef2ff', '#6366f1')}>{sel.stage}</span>}
                {sel.touchCount && <span style={s.badge('#f5f3ff', '#8b5cf6')}>{sel.touchCount} touches</span>}
                {sel.queueStatus === 'approved' && <span style={s.badge('#dcfce7', '#166534')}>IP Approved</span>}
                {sel.queueStatus === 'pending_review' && <span style={s.badge('#fef3c7', '#92400e')}>Pending IP Review</span>}
              </div>

              {/* metrics row */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                {[
                  { l: 'Revenue', v: sel.revenue },
                  { l: 'Employees', v: sel.employees?.toLocaleString() || '—' },
                  { l: 'Score', v: sel.score },
                  { l: 'Thesis', v: sel.thesis },
                ].map(m => (
                  <div key={m.l} style={{ flex: m.l === 'Thesis' ? 2 : 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 2 }}>{m.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* signal detail */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>Signal Detail</div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{sel.detail}</div>
            </div>

            {/* targeting signals */}
            {sel.signals && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>Key Signals</div>
                {sel.signals.map((sig, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: '#FAFAF8', borderRadius: 8, marginBottom: 4, fontSize: 13, color: '#555' }}>📡 {sig}</div>
                ))}
              </div>
            )}

            {/* message / outreach draft */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
                {sel.tab === 'Outreach' ? 'Outreach Draft' : sel.tab === 'Nurture' ? 'AI-Suggested Next Touch' : 'AI-Drafted Outreach'}
              </div>
              {editingId === sel.id ? (
                <>
                  <textarea
                    value={editedMessages[sel.id] ?? sel.message}
                    onChange={e => setEditedMessages(prev => ({ ...prev, [sel.id]: e.target.value }))}
                    style={{
                      width: '100%', minHeight: 160, padding: 12, borderRadius: 8, border: '1px solid #6366f1',
                      fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: "'Inter', sans-serif",
                      background: '#fafaff',
                    }}
                  />
                  <button
                    onClick={() => handleSaveEdit(sel.id)}
                    style={{ marginTop: 8, padding: '6px 16px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >Save</button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#FAFAF8', padding: 12, borderRadius: 8, margin: 0 }}>
                    {editedMessages[sel.id] ?? sel.message}
                  </p>
                  {!isActioned(sel.id) && (
                    <button
                      onClick={() => setEditingId(sel.id)}
                      style={{ marginTop: 8, padding: '5px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#555', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                    >Edit message</button>
                  )}
                </>
              )}
            </div>

            {/* action buttons */}
            {!isActioned(sel.id) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sel.queueStatus === 'approved' ? (
                  <button onClick={() => handleSend(sel.id)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                    Send Now
                  </button>
                ) : (
                  <button onClick={() => handleSend(sel.id)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                    Send via email
                  </button>
                )}
                <button onClick={() => handleSubmitReview(sel.id)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#eef2ff', color: '#6366f1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Submit for IP Review
                </button>
                <button onClick={() => handleSkip(sel.id)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Skip
                </button>
                <button
                  onClick={() => handleChat(`Tell me more about ${sel.company}`)}
                  style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  Ask Claude
                </button>
              </div>
            )}

            {isActioned(sel.id) && (
              <div style={{
                padding: 14, borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: sentIds.has(sel.id) ? '#f0fdf4' : reviewedIds.has(sel.id) ? '#eef2ff' : '#f8fafc',
                color: sentIds.has(sel.id) ? '#166534' : reviewedIds.has(sel.id) ? '#3730a3' : '#64748b',
                border: `1px solid ${sentIds.has(sel.id) ? '#bbf7d0' : reviewedIds.has(sel.id) ? '#c7d2fe' : '#e2e8f0'}`,
              }}>
                {sentIds.has(sel.id) && 'Outreach sent. This item has been moved to your sent queue.'}
                {reviewedIds.has(sel.id) && 'Submitted for IP review. You\'ll be notified when approved.'}
                {skippedIds.has(sel.id) && 'Skipped. This item has been removed from your action queue.'}
              </div>
            )}
          </div>
        )}

        {/* chat panel */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', background: '#fff', flexShrink: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            Claude · Growth Copilot
          </div>

          {/* chat messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chatMsgs.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                background: m.from === 'user' ? '#6366f1' : '#f1f5f9',
                color: m.from === 'user' ? '#fff' : '#1e293b',
                padding: '10px 14px', borderRadius: 14, maxWidth: '88%',
                fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
              }}>
                {renderBold(m.text)}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', background: '#f1f5f9', padding: '10px 18px', borderRadius: 14, display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#94a3b8',
                    animation: 'pulse 1s infinite', animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
                <style>{`@keyframes pulse { 0%, 100% { opacity: .3; transform: scale(.8); } 50% { opacity: 1; transform: scale(1); } }`}</style>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* quick actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 14px', borderTop: '1px solid #f1f5f9' }}>
            {[
              'What should I prioritize?',
              'Pipeline summary',
              'Prep for IC',
              'Nurture status',
            ].map(q => (
              <button
                key={q}
                onClick={() => handleChat(q)}
                style={{
                  padding: '5px 10px', borderRadius: 99, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#555', fontSize: 11, fontWeight: 500,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >{q}</button>
            ))}
          </div>

          {/* chat input */}
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #e2e8f0' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChat(chatInput)}
              placeholder="Ask about signals, pipeline, companies..."
              style={{ flex: 1, padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
            />
            <button
              onClick={() => handleChat(chatInput)}
              style={{ padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
