import { useState, useEffect, useRef, useCallback } from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #050807; --bg2: #090e0b; --bg3: #0d1410;
    --border: #131f16; --green: #00ff88; --green-dim: #00cc6a;
    --green-dark: rgba(0,255,136,0.07); --green-glow: rgba(0,255,136,0.18);
    --red: #ff4560; --yellow: #ffc940; --blue: #40c4ff;
    --text: #9dc4a4; --text-dim: #3a5540; --text-bright: #c8e8cc;
    --mono: 'Share Tech Mono', monospace; --orb: 'Orbitron', monospace;
  }
  html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--mono); font-size: 12px; }
  .scanlines { position: fixed; inset: 0; pointer-events: none; z-index: 9999;
    background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.035) 3px, rgba(0,0,0,0.035) 4px); }
  .app { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

  .topbar { display: flex; align-items: center; justify-content: space-between; padding: 9px 18px;
    border-bottom: 1px solid var(--border); background: var(--bg2); flex-shrink: 0; }
  .brand { font-family: var(--orb); font-size: 13px; font-weight: 900; color: var(--green); letter-spacing: 5px; }
  .brand span { color: var(--text-dim); font-weight: 400; font-size: 11px; }
  .topbar-right { display: flex; gap: 18px; font-size: 10px; align-items: center; }
  .ts { color: var(--text-dim); } .ts b { font-family: var(--orb); font-size: 12px; }
  .ts b.g { color: var(--green); } .ts b.y { color: var(--yellow); } .ts b.b { color: var(--blue); }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 5px; vertical-align: middle; }
  .live-dot.on { background: var(--green); animation: dpulse 1.1s ease-in-out infinite; }
  .live-dot.off { background: var(--text-dim); }
  @keyframes dpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.7)} }

  .controls { display: flex; align-items: center; gap: 8px; padding: 8px 18px;
    border-bottom: 1px solid var(--border); background: var(--bg); flex-shrink: 0; flex-wrap: wrap; }
  .scan-btn { font-family: var(--orb); font-size: 10px; letter-spacing: 2px; padding: 7px 18px;
    border: 1px solid var(--green); background: var(--green-dark); color: var(--green);
    cursor: pointer; transition: all 0.14s; flex-shrink: 0; }
  .scan-btn:hover:not(:disabled) { background: var(--green); color: var(--bg); box-shadow: 0 0 20px var(--green-glow); }
  .scan-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  
  .api-input { font-family: var(--mono); font-size: 10px; background: var(--bg3); 
    border: 1px solid var(--border); color: var(--text-bright); padding: 6px 10px; width: 220px; outline: none; }
  .api-input:focus { border-color: var(--blue); }

  .ctrl-sel { font-family: var(--mono); font-size: 10px; background: var(--bg2);
    border: 1px solid var(--border); color: var(--text); padding: 4px 8px; cursor: pointer; }
  .ctrl-label { font-size: 10px; color: var(--text-dim); }
  .ctrl-gap { flex: 1; }
  .clear-btn { font-family: var(--mono); font-size: 10px; padding: 4px 12px;
    border: 1px solid var(--border); background: transparent; color: var(--text-dim); cursor: pointer; }
  .clear-btn:hover { border-color: var(--red); color: var(--red); }

  .filter-bar { display: flex; gap: 4px; padding: 7px 18px; border-bottom: 1px solid var(--border);
    background: var(--bg); flex-wrap: wrap; align-items: center; flex-shrink: 0; }
  .fb-label { font-size: 9px; color: var(--text-dim); letter-spacing: 2px; margin-right: 4px; }
  .fb-btn { font-family: var(--mono); font-size: 9px; padding: 2px 9px;
    border: 1px solid var(--border); background: transparent; color: var(--text-dim);
    cursor: pointer; transition: all 0.1s; white-space: nowrap; }
  .fb-btn:hover { border-color: var(--green-dim); color: var(--green-dim); }
  .fb-btn.on { border-color: currentColor; background: rgba(255,255,255,0.04); }

  .statusline { padding: 5px 18px; font-size: 10px; color: var(--text-dim);
    border-bottom: 1px solid var(--border); background: var(--bg2);
    display: flex; align-items: center; gap: 12px; flex-shrink: 0; overflow: hidden; }
  .prog-track { width: 120px; height: 2px; background: var(--border); flex-shrink: 0; }
  .prog-fill { height: 100%; background: var(--green); transition: width 0.25s; }
  .blink { animation: blink 0.7s step-end infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  .body { display: flex; flex: 1; min-height: 0; }
  .terminal { flex: 1; overflow-y: auto; }
  .terminal::-webkit-scrollbar { width: 4px; }
  .terminal::-webkit-scrollbar-thumb { background: var(--border); }

  .tbl-header { display: flex; align-items: center; padding: 5px 18px 5px 20px;
    border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg2); z-index: 10; }
  .th { font-size: 8px; color: var(--text-dim); letter-spacing: 1.5px; text-transform: uppercase; }

  .game-row { display: flex; align-items: center; border-bottom: 1px solid var(--border);
    padding: 7px 18px 7px 20px; transition: background 0.1s; position: relative; }
  .game-row.clickable { cursor: pointer; }
  .game-row.clickable:hover { background: rgba(255,255,255,0.015); }
  .game-row.underpriced { background: rgba(0,255,136,0.025); }
  .game-row.underpriced:hover { background: rgba(0,255,136,0.05); }

  .row-accent { width: 2px; height: 100%; position: absolute; left: 0; top: 0; bottom: 0; }
  .ra-scanning { background: var(--yellow); animation: raFlash 0.55s ease-in-out infinite; }
  .ra-under { background: var(--green); box-shadow: 0 0 5px var(--green); }
  .ra-fair { background: var(--text-dim); opacity: 0.35; }
  .ra-pending { background: var(--border); }
  @keyframes raFlash { 0%,100%{opacity:1} 50%{opacity:0.2} }

  .col-cat { width: 96px; flex-shrink: 0; }
  .cat-pill { display: inline-block; font-size: 9px; padding: 1px 6px; border: 1px solid;
    letter-spacing: 0.5px; white-space: nowrap; max-width: 92px; overflow: hidden; text-overflow: ellipsis; }
  .col-market { flex: 1; min-width: 0; padding: 0 10px; max-width: 45%; }
  .row-title { 
    color: var(--text-bright); font-size: 11px; line-height: 1.3;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; text-overflow: ellipsis; white-space: normal;
  }
  .row-sub { font-size: 9px; color: var(--text-dim); margin-top: 2px; }
  .col-vol { width: 55px; flex-shrink: 0; text-align: right; }
  .col-bid { width: 55px; flex-shrink: 0; text-align: right; }
  .col-ask { width: 55px; flex-shrink: 0; text-align: right; }
  .col-fair { width: 58px; flex-shrink: 0; text-align: right; }
  .col-edge { width: 65px; flex-shrink: 0; text-align: right; }
  .col-verdict { width: 185px; flex-shrink: 0; text-align: right; padding-left: 10px; }
  .pv-label { font-size: 8px; color: var(--text-dim); letter-spacing: 1px; }
  .pv-val { font-family: var(--orb); font-size: 12px; margin-top: 1px; }
  .pv-dim { color: var(--text-dim); }
  .pv-blue { color: var(--blue); }
  .pv-green { color: var(--green); text-shadow: 0 0 8px var(--green-glow); }
  .pv-red { color: var(--red); }

  .verd-scanning { font-size: 9px; color: var(--yellow); display: flex; align-items: center; justify-content: flex-end; gap: 5px; }
  .verd-pending { font-size: 9px; color: var(--text-dim); }
  .verd-fair { font-size: 10px; color: var(--text-dim); }
  .verd-under { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  .verd-buy { font-family: var(--orb); font-size: 11px; font-weight: 700; }
  .verd-buy.yes { color: var(--green); }
  .verd-buy.no { color: var(--red); }
  .verd-target { font-size: 9px; color: var(--yellow); }
  .verd-score { font-size: 9px; color: var(--text-dim); }

  .mini-spin { width: 9px; height: 9px; border: 1.5px solid var(--border);
    border-top-color: var(--yellow); border-radius: 50%;
    animation: spin 0.65s linear infinite; display: inline-block; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .row-expand { padding: 8px 18px 12px 114px; border-bottom: 1px solid var(--border);
    background: var(--bg3); animation: fadeIn 0.2s ease-out; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
  .exp-title { font-size: 9px; color: var(--green-dim); letter-spacing: 2px; margin-bottom: 5px; }
  .exp-text { font-size: 10px; color: var(--text); line-height: 1.75; margin-bottom: 8px; }
  .exp-sell { padding: 6px 10px; border: 1px solid rgba(255,201,64,0.2); background: rgba(255,201,64,0.03); }
  .exp-sell-title { font-size: 8px; color: var(--yellow); letter-spacing: 1px; margin-bottom: 3px; }
  .exp-sell-text { font-size: 10px; color: var(--text); line-height: 1.65; }

  .log-panel { padding: 8px 0; }
  .log-line { padding: 2px 18px; font-size: 10px; color: var(--text-dim); font-family: var(--mono); }
  .log-line.ok { color: var(--green-dim); }
  .log-line.warn { color: var(--yellow); }
  .log-line.err { color: var(--red); }

  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 60%; color: var(--text-dim); text-align: center; gap: 14px; padding: 20px; }

  .sidebar { width: 195px; flex-shrink: 0; border-left: 1px solid var(--border);
    background: var(--bg2); overflow-y: auto; padding: 12px; }
  .sidebar::-webkit-scrollbar { width: 3px; }
  .sidebar::-webkit-scrollbar-thumb { background: var(--border); }
  .sb-title { font-family: var(--orb); font-size: 8px; letter-spacing: 3px; color: var(--text-dim);
    margin-bottom: 12px; padding-bottom: 7px; border-bottom: 1px solid var(--border); }
  .sb-row { display: flex; justify-content: space-between; padding: 5px 0;
    border-bottom: 1px solid var(--border); font-size: 10px; }
  .sb-row:last-child { border: none; }
  .sb-lbl { color: var(--text-dim); }
  .sb-val { font-family: var(--orb); font-size: 11px; }
  .sb-section { margin-top: 14px; }
  .sb-section-title { font-family: var(--orb); font-size: 8px; letter-spacing: 2px; color: var(--text-dim);
    margin-bottom: 7px; padding-bottom: 4px; border-bottom: 1px solid var(--border); }
  .sb-play { padding: 5px 0; border-bottom: 1px solid var(--border); }
  .sb-play:last-child { border: none; }
  .sb-play-name { font-size: 10px; color: var(--text); line-height: 1.3; margin-bottom: 2px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .sb-play-sub { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
  .mpill { font-size: 8px; padding: 1px 5px; }
  .mpill.yes { color: var(--green); border: 1px solid var(--green-dim); }
  .mpill.no { color: var(--red); border: 1px solid rgba(255,69,96,0.4); }

  .auth-bar { display:flex; align-items:center; gap:8px; padding:5px 18px;
    border-bottom:1px solid var(--border); background:var(--bg3); flex-shrink:0; flex-wrap:wrap; }
  .auth-input { font-family:var(--mono); font-size:10px; background:var(--bg2);
    border:1px solid var(--border); color:var(--text-bright); padding:4px 8px; width:160px; outline:none; }
  .auth-input:focus { border-color:var(--green-dim); }
  .auth-btn { font-family:var(--orb); font-size:9px; letter-spacing:1px; padding:4px 12px;
    border:1px solid var(--green-dim); background:transparent; color:var(--green-dim); cursor:pointer; }
  .auth-btn:hover { background:var(--green-dark); }
  .auth-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .auth-connected { font-size:9px; padding:3px 8px; color:var(--green);
    border:1px solid var(--green-dim); background:var(--green-dark); }
  .auth-err { font-size:9px; color:var(--red); }
  .auth-label { font-size:9px; color:var(--text-dim); letter-spacing:1px; white-space:nowrap; }
  .auth-logout { font-size:9px; color:var(--text-dim); background:none; border:none; cursor:pointer; padding:2px 4px; }
  .auth-logout:hover { color:var(--red); }
  .auth-pem { font-family:var(--mono); font-size:9px; background:var(--bg2);
    border:1px solid var(--border); color:var(--text-dim); padding:4px 6px;
    width:220px; height:48px; resize:none; outline:none; }
  .auth-pem:focus { border-color:var(--green-dim); color:var(--text-bright); }
`;

const CAT_COLORS = {
  NBA: "#ff6b35", NFL: "#4090ff", MLB: "#c84040", NHL: "#40c4ff",
  UFC: "#cc44ff", Golf: "#88cc44", Tennis: "#f0c040", Soccer: "#44ccaa",
  F1: "#ff3030", NCAAB: "#ff9944", Boxing: "#ff6090", Cricket: "#88aaff",
};

const ALL_CATS = Object.keys(CAT_COLORS);

// FIX 1: Every category now maps to real Odds API sport keys
const getSportKeys = (cat) => {
  const map = {
    NBA:    ['basketball_nba'],
    NCAAB:  ['basketball_ncaab', 'basketball_ncaab_womens'],
    Tennis: ['tennis_atp_french_open', 'tennis_wta_french_open', 'tennis_atp', 'tennis_wta'],
    Soccer: ['soccer_epl', 'soccer_uefa_champs_league', 'soccer_mls', 'soccer_spain_la_liga',
             'soccer_italy_serie_a', 'soccer_germany_bundesliga', 'soccer_france_ligue_one'],
    NHL:    ['icehockey_nhl'],
    UFC:    ['mma_mixed_martial_arts'],
    NFL:    ['americanfootball_nfl'],
    MLB:    ['baseball_mlb'],
    Golf:   ['golf_masters_tournament_winner', 'golf_pga_championship_winner',
             'golf_us_open_winner', 'golf_the_open_championship_winner'],
    Boxing: ['boxing_boxing', 'boxing'],
    Cricket:['cricket_test_match'],
    F1:     ['motorsport_formula_1_winner'],
  };
  return map[cat] || [];
};

function getCatColor(cat) { return CAT_COLORS[cat] || "#60aa88"; }

function categorize(m) {
  const t = ((m.ticker || "") + " " + (m.title || "") + " " + (m.subtitle || "") + " " + (m.event_ticker || "")).toUpperCase();

  if (/\bNBA\b|\bWNBA\b/.test(t)) return "NBA";
  if (/\bNFL\b|SUPER.BOWL/.test(t)) return "NFL";
  if (/\bMLB\b/.test(t)) return "MLB";
  if (/\bNHL\b|\bHOCKEY\b/.test(t)) return "NHL";
  if (/\bUFC\b|\bMMA\b|\bFIGHT\b/.test(t)) return "UFC";
  if (/\bPGA\b|\bGOLF\b|\bMASTERS\b/.test(t)) return "Golf";
  if (/\bATP\b|\bWTA\b|\bTENNIS\b|\bWIMBLEDON\b|\bKXIW\b|INDIAN.WELLS|CHALLENGER/.test(t)) return "Tennis";
  if (/\bSOCCER\b|\bEPL\b|\bMLS\b|\bLALIGA\b|\bSERIE\b|\bBUNDESLIGA\b|\bLIGUE\b|\bCHAMPIONS\b|\bEUROPA\b|\bFIFA\b|\bCOPA\b/.test(t)) return "Soccer";
  // FIX 2: NCAAB check now comes AFTER MLB (avoids NCAABB false match) and uses word boundary
  if (/\bNCAAB\b|\bNCAAMB\b|\bNCAAWB\b|\bMARCH.MAD\b|\bCBB\b/.test(t)) return "NCAAB";
  if (/\bBOXING\b/.test(t)) return "Boxing";
  if (/\bCRICKET\b/.test(t)) return "Cricket";
  // F1 must require motorsport context — "F1" alone matches the Brad Pitt movie
  if (/\bFORMULA.1\b|\bGRAND.PRIX\b|\bFORMULA.ONE\b/.test(t)) return "F1";

  return "Other";
}

// FIX: Extract both team names directly from the Kalshi market title
// Kalshi titles are now like "Fulham vs West Ham" or "Charlotte at Boston"
function extractTeamsFromTitle(title) {
  if (!title) return null;
  // "Team A vs Team B" or "Team A at Team B"
  const match = title.match(/^(.+?)\s+(?:vs\.?|at)\s+(.+?)(?:\s*\(|$)/i);
  if (match) return { home: match[1].trim(), away: match[2].trim() };
  return null;
}

function teamSimilarity(kalshiName, oddsName) {
  const k = kalshiName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const o = oddsName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  
  if (k === o) return 100;

  // Direct contains — guard against false positives where a short name is embedded
  // inside a DIFFERENT team (e.g. "Kansas" in "arKANSAS", "Virginia" in "West Virginia",
  // "Florida" in "Florida Gulf Coast", "Tennessee" in "Tennessee State").
  if (k.includes(o) || o.includes(k)) {
    const shorter = k.length <= o.length ? k : o;
    const longer  = k.length <= o.length ? o : k;
    // Require shorter to appear as whole word(s), not buried inside another word
    const wholeWord = new RegExp(`(?:^| )${shorter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?= |$)`);
    if (!wholeWord.test(longer)) return 0; // "kansas" inside "arkansas" → reject
    const sWords = new Set(shorter.split(' '));
    const extras = longer.split(' ').filter(w => !sWords.has(w));
    // Geographic prefixes/suffixes → DIFFERENT team (West Virginia ≠ Virginia)
    const GEO = new Set(['west','east','north','south','central','northern','southern',
                         'eastern','western','coastal','upper','lower','mid','middle']);
    // School-type qualifiers that change institution identity (Tennessee ≠ Tennessee State)
    const MOD = new Set(['st','state','tech','am','at']);
    // 2-letter words are state/school abbreviations (oh=Ohio, fl=Florida, nc=NC, etc.)
    if (extras.some(w => GEO.has(w) || MOD.has(w) || w.length === 2)) return 0;
    return 80;
  }
  
  // Word overlap — but exclude generic geographic words that cause false matches
  // e.g. "South Carolina St" vs "South Carolina Upstate" should NOT match on "south"+"carolina"
  const GENERIC = new Set(['south','north','east','west','central','state','university','college',
    'new','old','san','los','las','saint','fort','mount','lake','bay','city','park','valley']);
  const kWords = k.split(' ').filter(w => w.length > 2 && !GENERIC.has(w));
  const oWords = o.split(' ').filter(w => w.length > 2 && !GENERIC.has(w));
  
  // Need at least one non-generic word to match
  const shared = kWords.filter(w => oWords.includes(w));
  if (shared.length > 0) {
    // Shared must represent a meaningful fraction — not just one common word in a long name
    const shorter = Math.min(kWords.length, oWords.length);
    if (shorter === 0) return 0; // all generic words, no signal
    const ratio = shared.length / shorter;
    if (ratio >= 0.5 || shared.length >= 2) return shared.length * 25;
    // Single non-generic word match only scores if it's distinctive (length > 5)
    if (shared[0].length > 5) return 25;
    return 0;
  }

  // Known abbreviation/nickname mappings
  const ALIASES = {
    'los angeles c': ['la clippers', 'clippers'],
    'los angeles l': ['la lakers', 'lakers'],
    'golden state': ['golden state warriors', 'warriors'],
    'new york y': ['new york yankees', 'yankees'],
    'new york r': ['new york rangers', 'rangers'],
    'new york i': ['new york islanders', 'islanders'],
    'chicago c': ['chicago cubs', 'cubs'],
    'chicago ws': ['chicago white sox', 'white sox'],
    'new york m': ['new york mets', 'mets'],
    'manchester united': ['man utd', 'man united'],
    'manchester city': ['man city'],
    'nottingham': ['nottingham forest', 'nott\'m forest'],
    'a\'s': ['athletics', 'oakland athletics'],
    'utah': ['utah jazz'],
  };
  
  for (const [alias, variants] of Object.entries(ALIASES)) {
    if (k.includes(alias) && variants.some(v => o.includes(v))) return 70;
    if (o.includes(alias) && variants.some(v => k.includes(v))) return 70;
  }
  
  return 0;
}

function findMatchingOddsData(row, allOddsData) {
  if (!allOddsData || allOddsData.length === 0) return null;

  const validKeys = getSportKeys(row.cat);
  const now = Date.now();
  const closeMs = row.closeTime ? new Date(row.closeTime).getTime() : null;

  // Parse game date from ticker to narrow candidate pool
  const dateMatch = (row.ticker || '').match(/-(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})/i);
  let gameDateMs = null;
  if (dateMatch) {
    const mm = {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
    gameDateMs = Date.UTC(2000 + parseInt(dateMatch[1]), mm[dateMatch[2].toUpperCase()], parseInt(dateMatch[3]));
  }

  // Only consider games on the same calendar date as the Kalshi ticker
  // CRITICAL: use gameDateMs (from ticker like 26MAR04), NOT closeTime (settlement deadline weeks out)
  const candidateGames = allOddsData.filter(game => {
    if (validKeys.length > 0 && !validKeys.includes(game.api_sport)) return false;
    const gameStart = new Date(game.commence_time).getTime();
    if (gameDateMs) {
      // Ticker date is midnight UTC — accept games starting up to 3h before that midnight
      // (handles late-night games the day before) but not a full day back (avoids cross-day mismatches)
      if (gameStart < gameDateMs - 3*60*60*1000) return false;
      if (gameStart > gameDateMs + 2*24*60*60*1000) return false;
    } else {
      if (gameStart > now + 14 * 24 * 60 * 60 * 1000) return false;
      if (gameStart < now - 12 * 60 * 60 * 1000) return false;
    }
    return true;
  });

  if (candidateGames.length === 0) return null;

  // Extract BOTH team names from the Kalshi event title (e.g. "Drake at Southern Illinois")
  // This is the ground truth — we REQUIRE one of these teams to match the odds game
  const eventTitle = row.eventTitle || '';
  const teams = extractTeamsFromTitle(eventTitle);

  // Also build a list of "known name tokens" from the ticker itself
  // e.g. KXNCAAMBGAME-26MAR05DRKESIU → segment after last dash before team = DRKE, SIU
  // We extract them from eventTitle words as the primary source
  const eventWords = eventTitle.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);

  let bestGame = null;
  let bestScore = -1;

  for (const game of candidateGames) {
    const h = game.home_team;
    const a = game.away_team;
    let score = 0;
    let hasTeamAnchor = false; // must have at least one real team name match

    if (teams) {
      // Score both orderings (home=home, away=away) and (home=away, away=home)
      const fwdH = teamSimilarity(teams.home, h);
      const fwdA = teamSimilarity(teams.away, a);
      const revH = teamSimilarity(teams.home, a);
      const revA = teamSimilarity(teams.away, h);
      const fwd = fwdH + fwdA;
      const rev = revH + revA;
      score = Math.max(fwd, rev);
      // Anchor: at least one side of the event must score >= 40 (real name match, not coincidence)
      if (Math.max(fwdH, fwdA, revH, revA) >= 40) hasTeamAnchor = true;
    }

    // Per-market title match (this market's specific team, e.g. "Southern Illinois")
    const titleClean = (row.title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const hScore = teamSimilarity(titleClean, h);
    const aScore = teamSimilarity(titleClean, a);
    const titleBest = Math.max(hScore, aScore);
    score = Math.max(score, titleBest);
    if (titleBest >= 40) hasTeamAnchor = true;

    // Boxing/UFC: match via yes_sub_title (full fighter name like "Jhon Orobio")
    if (row.cat === 'Boxing' || row.cat === 'UFC') {
      const subTitle = (row.yesSubTitle || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      if (subTitle) {
        const subH = teamSimilarity(subTitle, h);
        const subA = teamSimilarity(subTitle, a);
        const subBest = Math.max(subH, subA);
        score = Math.max(score, subBest);
        if (subBest >= 40) hasTeamAnchor = true;
      }
    }

    // Time bonus: game starting close to the ticker date (gameDateMs = midnight of game day)
    if (gameDateMs) {
      const gameStart = new Date(game.commence_time).getTime();
      const hoursDiff = Math.abs(gameDateMs - gameStart) / (1000 * 60 * 60);
      if (hoursDiff < 24) score += 10; // same calendar day
    }

    // STRICT REQUIREMENT: must have a real team name anchor (score >= 40 on at least one team)
    // AND overall score >= 50 to prevent cross-game false matches
    // Exception: Soccer (3-way markets) and pro sports with well-known names can rely on combined score
    const minScore = (row.cat === 'Soccer') ? 40 : 50;
    if (!hasTeamAnchor) continue; // reject entirely if no team name matched
    
    if (score > bestScore && score >= minScore) {
      bestScore = score;
      bestGame = game;
    }
  }

  return bestGame;
}

function analyzeMarketReal(market, allOddsData) {
  const mid = market.midpoint;
  const yesAsk = market.yesAsk;
  const yesBid = market.yesBid;

  // Check if game date has passed (ticker date was yesterday or earlier)
  if (market.tickerDateMs && market.tickerDateMs < Date.now() - 36 * 60 * 60 * 1000) {
    return { fairProb: mid, play: "EXPIRED", edgeScore: 0, executableEdge: 0, reasoning: "Game already finished." };
  }

  if (mid == null) return { fairProb: 0, play: "FAIR", edgeScore: 0, executableEdge: 0, reasoning: "No valid orderbook data." };

  const matchedGame = findMatchingOddsData(market, allOddsData);

  if (!matchedGame) {
    // Distinguish: sport has no Odds API coverage vs game just didn't match
    const noOddsSports = ['Boxing', 'Cricket', 'F1'];
    const isNoOddsSport = noOddsSports.includes(market.cat);
    return {
      fairProb: mid,
      play: isNoOddsSport ? "NO_ODDS" : "NO_MATCH",
      edgeScore: 0,
      executableEdge: 0,
      reasoning: isNoOddsSport
        ? `No sportsbook odds available for this ${market.cat} event. Kalshi market implied probability: ${(mid * 100).toFixed(1)}%.`
        : "No sportsbook game found. Team names didn't match any game in the Odds API for this date."
    };
  }

  // Prefer sharp books; fall back to any available
  const bookmaker =
    matchedGame.bookmakers.find(b => b.key === 'pinnacle') ||
    matchedGame.bookmakers.find(b => ['draftkings', 'fanduel', 'betmgm', 'williamhill_us'].includes(b.key)) ||
    matchedGame.bookmakers[0];

  if (!bookmaker?.markets?.[0]?.outcomes || bookmaker.markets[0].outcomes.length < 2) {
    return { fairProb: mid, play: "NO_MATCH", edgeScore: 0, executableEdge: 0, reasoning: "Bookmaker lines currently off the board." };
  }

  const outcomes = bookmaker.markets[0].outcomes;
  const p1 = 1 / outcomes[0].price;
  const p2 = 1 / outcomes[1].price;
  const trueProb1 = p1 / (p1 + p2); // vig-stripped
  const trueProb2 = p2 / (p1 + p2);

  // Skip near-certain outcomes — live data latency trap
  if (trueProb1 >= 0.93 || trueProb1 <= 0.07) {
    return { fairProb: mid, play: "FAIR", edgeScore: 0, executableEdge: 0, reasoning: "Odds indicate game is practically decided. Skipped to avoid live-latency traps." };
  }

  // Determine which side the Kalshi YES contract represents using team name similarity
  const rowTitle = (market.title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const h = outcomes[0].name;
  const a = outcomes[1].name;

  const hScore = teamSimilarity(rowTitle, h);
  const aScore = teamSimilarity(rowTitle, a);

  let fairProb, representedTeam;
  if (hScore > aScore) {
    fairProb = trueProb1; representedTeam = h;
  } else if (aScore > hScore) {
    fairProb = trueProb2; representedTeam = a;
  } else {
    // Tiebreak: pick whichever true prob is closer to the current market midpoint
    if (Math.abs(trueProb1 - mid) <= Math.abs(trueProb2 - mid)) {
      fairProb = trueProb1; representedTeam = h;
    } else {
      fairProb = trueProb2; representedTeam = a;
    }
  }

  let play = "FAIR";
  let edgeScore = 0;
  let sellTarget = fairProb;
  let entry = mid;
  let executableEdge = 0;

  // BUY YES: market ask is below true probability → buy cheap YES, sell near fair value
  if (yesAsk != null && yesAsk > 0 && yesAsk <= 0.92 && (fairProb - yesAsk) > 0.025) {
    play = "YES";
    entry = yesAsk;
    executableEdge = fairProb - yesAsk;
    // Target: converge to fair value (exit just below to ensure fill)
    sellTarget = Math.min(0.95, fairProb + executableEdge * 0.6);
    edgeScore = Math.min(100, Math.floor(executableEdge * 1000));
  }
  // BUY NO: market bid is above true probability → YES is overpriced, buy NO cheap
  else if (yesBid != null && yesBid > 0 && yesBid >= 0.08 && (yesBid - fairProb) > 0.025) {
    play = "NO";
    entry = 1 - yesBid; // NO ask = 1 - YES bid
    executableEdge = yesBid - fairProb;
    // Target: NO converges up as YES bid drops toward fair value
    sellTarget = Math.min(0.95, (1 - fairProb) + executableEdge * 0.6);
    edgeScore = Math.min(100, Math.floor(executableEdge * 1000));
  }

  const edgeLabel = edgeScore >= 68 ? "HIGH-CONFIDENCE" : edgeScore >= 45 ? "MODERATE" : "MARGINAL";

  return {
    fairProb, play, entry, sellTarget, edgeScore, executableEdge,
    matchedGame: `${matchedGame.home_team} vs ${matchedGame.away_team}`,
    bookmaker: bookmaker.title,
    representedTeam,
    reasoning: play === "FAIR"
      ? `No executable edge. ${bookmaker.title} implies ${(fairProb * 100).toFixed(1)}% true probability for ${representedTeam}. Kalshi mid is $${mid?.toFixed(2) ?? '--'}, within normal spread. Market is efficiently priced.`
      : `${edgeLabel} EDGE detected. ${bookmaker.title} fair value for ${representedTeam}: ${(fairProb * 100).toFixed(1)}% ($${fairProb.toFixed(2)}). ` +
        `Kalshi ${play === "YES" ? `ask ($${yesAsk?.toFixed(2)})` : `bid ($${yesBid?.toFixed(2)})`} is mispriced by ${(executableEdge * 100).toFixed(1)}¢. ` +
        `Matched game: ${matchedGame.home_team} vs ${matchedGame.away_team}.`,
    sellConditions: play !== "FAIR"
      ? `BUY ${play} at $${entry.toFixed(2)} (true prob: $${fairProb.toFixed(2)}). ` +
        `Price target: $${sellTarget.toFixed(2)} — exit as Kalshi converges to sportsbook fair value. ` +
        `Expected gain: ~${((sellTarget - entry) * 100).toFixed(0)}¢ per contract. ` +
        `Exit early if opposing book moves significantly or game-time approaches without convergence.`
      : null
  };
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("Ready — Hit REAL DATA SCAN to price lines.");
  const [time, setTime] = useState(new Date());
  const [activeCats, setActiveCats] = useState([...ALL_CATS]);
  const [expanded, setExpanded] = useState({});
  const [autoInterval, setAutoInterval] = useState(0);
  const [stats, setStats] = useState({ total: 0, scanned: 0, underpriced: 0, fair: 0 });
  const [debugLog, setDebugLog] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('odds_api_key') || ''; } catch { return ''; }
  });
  const [kalshiKeyId, setKalshiKeyId] = useState(() => {
    try { return localStorage.getItem('kalshi_key_id') || ''; } catch { return ''; }
  });
  const [kalshiPem, setKalshiPem] = useState(() => {
    try { return localStorage.getItem('kalshi_pem') || ''; } catch { return ''; }
  });
  const [kalshiKeyOk, setKalshiKeyOk] = useState(false);
  const [kalshiErr, setKalshiErr] = useState('');
  const kalshiCryptoKey = useRef(null);
  const autoRef = useRef(null);
  const termRef = useRef(null);
  const scanRef = useRef(false);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const handleKeyChange = (e) => {
    setApiKey(e.target.value);
    try { localStorage.setItem('odds_api_key', e.target.value); } catch {}
  };

  // Convert PKCS#1 RSA DER → PKCS#8 DER (Web Crypto only accepts PKCS#8)
  const pkcs1ToPkcs8 = (pkcs1) => {
    const encLen = (n) => n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, n >> 8, n & 0xff];
    const seq = (bytes) => new Uint8Array([0x30, ...encLen(bytes.length), ...bytes]);
    const oct = (bytes) => new Uint8Array([0x04, ...encLen(bytes.length), ...bytes]);
    const version = [0x02, 0x01, 0x00];
    const rsaOid  = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
    const inner   = [...version, ...rsaOid, ...oct(pkcs1)];
    return seq(inner).buffer;
  };

  // Import PEM private key into Web Crypto for RSA-PSS signing (handles PKCS#1 and PKCS#8)
  const loadKalshiKey = useCallback(async () => {
    const keyId = kalshiKeyId.trim();
    const pem = kalshiPem.trim();
    if (!keyId || !pem) { setKalshiErr('Enter both API Key ID and private key.'); return; }
    setKalshiErr('');
    try {
      const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
      const der = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const isPkcs1 = pem.includes('RSA PRIVATE KEY');
      const keyBuffer = isPkcs1 ? pkcs1ToPkcs8(der) : der.buffer;
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8', keyBuffer,
        { name: 'RSA-PSS', hash: 'SHA-256' },
        false, ['sign']
      );
      kalshiCryptoKey.current = cryptoKey;
      setKalshiKeyOk(true);
      try { localStorage.setItem('kalshi_key_id', keyId); localStorage.setItem('kalshi_pem', pem); } catch {}
    } catch (e) { setKalshiErr('Invalid key: ' + (e.message || e)); kalshiCryptoKey.current = null; setKalshiKeyOk(false); }
  }, [kalshiKeyId, kalshiPem]);

  const logoutKalshi = () => {
    setKalshiKeyOk(false); setKalshiErr(''); kalshiCryptoKey.current = null;
    try { localStorage.removeItem('kalshi_key_id'); localStorage.removeItem('kalshi_pem'); } catch {}
    setKalshiKeyId(''); setKalshiPem('');
  };

  // Returns signed headers for a Kalshi request (method + Kalshi path, no /kalshi-api prefix)
  const kalshiHeaders = useCallback(async (method, kalshiPath) => {
    if (!kalshiCryptoKey.current || !kalshiKeyId.trim()) return {};
    const ts = Date.now().toString();
    const msg = ts + method.toUpperCase() + kalshiPath.split('?')[0];
    const sig = await crypto.subtle.sign(
      { name: 'RSA-PSS', saltLength: 32 },
      kalshiCryptoKey.current,
      new TextEncoder().encode(msg)
    );
    return {
      'KALSHI-ACCESS-KEY': kalshiKeyId.trim(),
      'KALSHI-ACCESS-SIGNATURE': btoa(String.fromCharCode(...new Uint8Array(sig))),
      'KALSHI-ACCESS-TIMESTAMP': ts,
    };
  }, [kalshiKeyId]);

  // Try to auto-load key from localStorage on mount
  useEffect(() => {
    if (kalshiKeyId.trim() && kalshiPem.trim()) loadKalshiKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addDebug = useCallback((category, msg, data = null) => {
    const entry = {
      id: Math.random(),
      ts: new Date().toLocaleTimeString(),
      category,
      msg,
      data: data ? JSON.stringify(data) : null,
    };
    setDebugLog(prev => [...prev.slice(-500), entry]);
  }, []);

  const addLog = useCallback((text, type = "info") => {
    setLogs(prev => [...prev.slice(-120), { text, type, id: Math.random() }]);
  }, []);

  const runScan = useCallback(async () => {
    if (scanRef.current) return;
    scanRef.current = true;
    setScanning(true);
    setRows([]);
    setLogs([]);
    setExpanded({});
    setStats({ total: 0, scanned: 0, underpriced: 0, fair: 0 });
    setDebugLog([]);
    setProgress(5);

    if (!apiKey.trim()) {
      addLog("[ERROR] Paste your Odds API Key in the top bar.", "err");
      setStatusMsg("Missing API Key.");
      scanRef.current = false; setScanning(false); setProgress(0); return;
    }

    if (!kalshiKeyOk || !kalshiCryptoKey.current) {
      addLog("[ERROR] Connect your Kalshi API key in the bar below the header.", "err");
      setStatusMsg("Kalshi API key required.");
      scanRef.current = false; setScanning(false); setProgress(0); return;
    }

    setStatusMsg("Fetching live Kalshi markets...");
    addLog("[STEP 1] Fetching markets by sports series...", "ok");

    // Sports config: series-level tickers (primary) + fallback event-level prefixes
    // Primary strategy uses the events endpoint with series_ticker → gets all nested markets
    // Fallback uses the markets endpoint directly with various ticker guesses
    const SPORTS_CONFIG = [
      { series: ['KXNBA'],              eventPrefixes: ['KXNBAGAME'],                    cat: 'NBA'    },
      { series: ['KXNCAAB','KXNCAAMB'], eventPrefixes: ['KXNCAAMBGAME','KXNCAABGAME'],   cat: 'NCAAB'  },
      { series: ['KXNHL'],              eventPrefixes: ['KXNHLGAME'],                    cat: 'NHL'    },
      { series: ['KXNFL'],              eventPrefixes: ['KXNFLGAME'],                    cat: 'NFL'    },
      { series: ['KXMLB'],              eventPrefixes: ['KXMLBGAME'],                    cat: 'MLB'    },
      { series: ['KXUFC','KXMMA'],      eventPrefixes: ['KXUFCFIGHT','KXMMAGAME'],       cat: 'UFC'    },
      { series: ['KXEPL','KXSOCCER','KXUCL','KXMLS'],
                                        eventPrefixes: ['KXEPLGAME','KXSOCCERGAME'],      cat: 'Soccer' },
      { series: ['KXBOXING'],           eventPrefixes: ['KXBOXING','KXBOX'],             cat: 'Boxing' },
      { series: ['KXATP','KXWTA','KXTENNIS'],
                                        eventPrefixes: ['KXATPMATCH','KXWTAMATCH','KXATPCHALLENGERMATCH','KXWTACHALLENGERMATCH','KXIW'],
                                                                                          cat: 'Tennis' },
    ];

    let markets = [];
    const existingTickers = new Set();

    for (const { series, eventPrefixes, cat } of SPORTS_CONFIG) {
      let found = [];

      // ── Strategy 1: events endpoint with series_ticker (most reliable) ──────
      for (const s of series) {
        if (found.length > 0) break; // stop as soon as one series returns data
        try {
          const kalshiPath = `/trade-api/v2/events?status=open&limit=200&series_ticker=${s}&with_nested_markets=true`;
          const url = `/kalshi-api${kalshiPath}`;
          const res = await fetch(url, { headers: await kalshiHeaders('GET', kalshiPath) });
          if (res.status === 401) { addLog('[KALSHI] API key rejected — check Key ID and PEM.', 'err'); scanRef.current = false; setScanning(false); setProgress(0); return; }
          if (!res.ok) { addLog(`[${s}] events HTTP ${res.status}`, 'warn'); continue; }
          const data = await res.json();
          for (const evt of (data.events || [])) {
            for (const m of (evt.markets || [])) {
              if (!existingTickers.has(m.ticker)) {
                found.push({ ...m, _forcedCat: cat });
                existingTickers.add(m.ticker);
              }
            }
          }
          if ((data.events || []).length > 0) addLog(`[${s}] ${data.events.length} events → ${found.length} markets`, 'ok');
        } catch (e) { addLog(`[${s}] events error: ${e.message}`, 'warn'); }
        await new Promise(r => setTimeout(r, 250));
      }

      // ── Strategy 2: markets endpoint with series_ticker ──────────────────────
      if (found.length === 0) {
        for (const s of series) {
          try {
            const kalshiPath2 = `/trade-api/v2/markets?status=open&limit=200&series_ticker=${s}`;
            const url = `/kalshi-api${kalshiPath2}`;
            const res = await fetch(url, { headers: await kalshiHeaders('GET', kalshiPath2) });
            if (!res.ok) continue;
            const data = await res.json();
            for (const m of (data.markets || [])) {
              if (!existingTickers.has(m.ticker)) {
                found.push({ ...m, _forcedCat: cat });
                existingTickers.add(m.ticker);
              }
            }
            if ((data.markets || []).length > 0) addLog(`[${s}] ${data.markets.length} markets (mkts endpoint)`, 'ok');
          } catch (e) { /* ignore */ }
          await new Promise(r => setTimeout(r, 200));
        }
      }

      // ── Strategy 3: markets endpoint with event-level prefix guesses ─────────
      if (found.length === 0) {
        for (const pfx of eventPrefixes) {
          try {
            const kalshiPath3 = `/trade-api/v2/markets?status=open&limit=200&series_ticker=${pfx}`;
            const url = `/kalshi-api${kalshiPath3}`;
            const res = await fetch(url, { headers: await kalshiHeaders('GET', kalshiPath3) });
            if (!res.ok) continue;
            const data = await res.json();
            for (const m of (data.markets || [])) {
              if (!existingTickers.has(m.ticker)) {
                found.push({ ...m, _forcedCat: cat });
                existingTickers.add(m.ticker);
              }
            }
            if ((data.markets || []).length > 0) { addLog(`[${pfx}] ${data.markets.length} markets (prefix fallback)`, 'ok'); break; }
          } catch (e) { /* ignore */ }
          await new Promise(r => setTimeout(r, 150));
        }
      }

      if (found.length > 0) {
        markets = [...markets, ...found];
        addLog(`[${cat.toUpperCase()}] ✓ ${found.length} markets (sample: ${found[0]?.ticker})`, 'ok');
      } else {
        addLog(`[${cat.toUpperCase()}] 0 markets found — not on Kalshi today`, 'warn');
      }
      await new Promise(r => setTimeout(r, 300));
    }

    addLog(`[KALSHI] Fetched ${markets.length} raw sports markets.`, "ok");
    // Log unique series prefixes found to diagnose missing sports
    const foundSeries = [...new Set(markets.map(m => (m.ticker||'').split('-')[0]))].sort();
    addLog(`[SERIES FOUND] ${foundSeries.join(', ')}`, "warn");

    // DEBUG: Show sample ticker to confirm date parsing
    markets.slice(0, 3).forEach(m => {
      addLog(`  ticker=${m.ticker} yes_sub=${m.yes_sub_title} vol=${m.volume_24h}`, "warn");
    });

    setProgress(20);

    // Filter: live games only (close_time within next 6h OR already past but within 2h), with volume
    let debugReject = { combo: 0, prop_ticker: 0, prop_title: 0, expired: 0, futures: 0, not_live: 0, no_volume: 0, empty_book: 0, passed: 0 };
    const now = Date.now();
    const sportsMarkets = markets.filter(m => {
      const ticker = (m.ticker || "").toUpperCase();
      const title  = (m.title  || "").toLowerCase();

      // Exclude multi-leg combo/parlay markets
      if (/KXMVECROSSCATEGORY|KXMVE/i.test(ticker)) { debugReject.combo++; return false; }
      // Exclude spreads, totals, player props
      if (/SPREAD|NBAPTS|NBAREB|NBAAST|NBASTL|NBABLK|NBA3PM|NBATOTAL|NHLTOTAL|NFLTOTAL/i.test(ticker)) { debugReject.prop_ticker++; return false; }
      if (/points|rebounds|assists|yards|goals|touchdowns|shots|over\b|under\b|spread|margin|\bby\b/i.test(title)) { debugReject.prop_title++; return false; }
      // Exclude already-settled or expired markets (result is set when Kalshi has resolved the market)
      if (m.result && m.result !== '') { debugReject.expired++; return false; }
      if (m.status && /expired|settled|finalized|closed/i.test(m.status)) { debugReject.expired++; return false; }
      // LIVE ONLY: parse game date from ticker e.g. KXNBAGAME-26MAR05LALDEN-LAL → 26MAR05 → Mar 5 2026
      // Kalshi close_time is settlement deadline (2 weeks out), useless for game date — use ticker instead
      const dateMatch = ticker.match(/-(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})/i);
      let isRelevant = false;
      if (dateMatch) {
        const monthMap = {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
        const gameDate = new Date(Date.UTC(2000 + parseInt(dateMatch[1]), monthMap[dateMatch[2].toUpperCase()], parseInt(dateMatch[3])));
        const todayUTC = new Date(now);
        const todayStart = Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate());
        // Accept: up to 3 days ago (tennis matches can span days), today, and next 3 days
        isRelevant = gameDate.getTime() >= todayStart - 3*24*60*60*1000 && gameDate.getTime() < todayStart + 3*24*60*60*1000;
      } else {
        // No date in ticker — only include if close_time is in the future AND within 30 days.
        // This rejects season-long futures (close_time: 2028) and already-closed markets.
        const closeMs = m.close_time ? new Date(m.close_time).getTime() : null;
        if (!closeMs || closeMs <= now - 2*60*60*1000) { debugReject.expired++; return false; }
        if (closeMs > now + 30*24*60*60*1000) { debugReject.futures++; return false; }
        isRelevant = true;
      }
      if (!isRelevant) { debugReject.not_live++; return false; }
      // Volume check: skip only if truly dead (no volume AND empty book)
      // Some freshly opened markets have 0 volume_24h but valid bids/asks
      const bid  = m.yes_bid   != null ? m.yes_bid   : 0;
      const ask  = m.yes_ask   != null ? m.yes_ask   : 100;
      const last = m.last_price != null ? m.last_price : 0;
      const hasVolume = m.volume_24h > 0 || m.volume > 0;
      const hasBook = !(bid === 0 && ask >= 99 && last === 0);
      if (!hasVolume && !hasBook) { debugReject.no_volume++; return false; }
      // Must have active orderbook
      if (bid === 0 && ask >= 99 && last === 0) { debugReject.empty_book++; return false; }

      debugReject.passed++;
      return true;
    });
    addLog(`[DEBUG FILTER] ${JSON.stringify(debugReject)}`, "warn");

    addLog(`[FILTER] ${sportsMarkets.length} valid sports moneyline markets after filter.`, "ok");

    if (sportsMarkets.length === 0) {
      addLog("No valid tradeable Kalshi game lines found. Try again closer to game time.", "warn");
      setStatusMsg("No valid moneylines found.");
      scanRef.current = false;
      setScanning(false);
      setProgress(0);
      return;
    }

    const normalized = sportsMarkets.map((m, i) => {
      const bid = m.yes_bid != null ? m.yes_bid / 100 : null;
      const ask = m.yes_ask != null ? m.yes_ask / 100 : null;
      const last = m.last_price != null ? m.last_price / 100 : null;
      const mid = bid != null && ask != null ? (bid + ask) / 2 : last;

      // yes_sub_title is the actual team name e.g. "Los Angeles Lakers"
      // title is the event description e.g. "Los Angeles L at Denver Winner?"
      // Use yes_sub_title as display, title stripped of " Winner?" as event context
      let rowTitle = m.yes_sub_title || m.subtitle || "";
      if (!rowTitle || /^(yes|no)$/i.test(rowTitle.trim())) {
        rowTitle = (m.title || m.ticker).replace(/\s*winner\??$/i, "").trim();
      }
      const eventTitle = (m.title || "").replace(/\s*winner\??$/i, "").trim();

      // Parse game date from ticker (e.g. 26MAR05 → Mar 5 2026)
      // This is more reliable than close_time which is the settlement deadline
      const tickerDateMatch = (m.ticker || '').match(/-(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})/i);
      let tickerDateMs = null;
      if (tickerDateMatch) {
        const mm2 = {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
        tickerDateMs = Date.UTC(2000 + parseInt(tickerDateMatch[1]), mm2[tickerDateMatch[2].toUpperCase()], parseInt(tickerDateMatch[3]));
      }

      return {
        id: `${m.ticker || i}-${Date.now()}`,
        ticker: m.ticker || `MKT-${i}`,
        title: rowTitle,
        eventTitle,
        cat: m._forcedCat || categorize(m),
        closeTime: m.close_time || null,
        tickerDateMs,
        yesBid: bid,
        yesAsk: ask,
        lastPrice: last,
        midpoint: mid,
        volume24h: m.volume_24h || 0,
        scanState: "pending",
        yesSubTitle: m.yes_sub_title || '',
      };
    });

    normalized.sort((a, b) => {
      const ta = a.closeTime ? new Date(a.closeTime).getTime() : Infinity;
      const tb = b.closeTime ? new Date(b.closeTime).getTime() : Infinity;
      return ta - tb;
    });

    setRows(normalized);
    setStats(s => ({ ...s, total: normalized.length }));

    // DEBUG: log first 10 rows' timing data
    const nowDbg = Date.now();
    normalized.slice(0, 10).forEach(r => {
      const ct = r.closeTime ? new Date(r.closeTime).getTime() : null;
      const daysOut = ct ? ((ct - nowDbg) / (1000*60*60*24)).toFixed(2) : 'null';
      const minsFromNow = ct ? ((ct - nowDbg) / 60000).toFixed(1) : 'null';
      addDebug('CLOSE_TIME', r.ticker.slice(-20), {
        closeTime: r.closeTime,
        daysOut,
        minsFromNow,
        tickerDateMs: r.tickerDateMs ? new Date(r.tickerDateMs).toISOString().slice(0,10) : null,
      });
    });

    // Collect all unique sport keys needed
    const neededKeys = [...new Set(normalized.flatMap(m => getSportKeys(m.cat)))];
    addLog(`[STEP 2] Fetching sportsbook odds for ${neededKeys.length} sport keys...`, "ok");

    let allFetchedOdds = [];
    addLog(`[ODDS] Fetching keys: ${neededKeys.join(', ')}`, "info");

    for (const sportKey of neededKeys) {
      try {
        const oddsRes = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey.trim()}&regions=us&markets=h2h&oddsFormat=decimal`
        );
        if (!oddsRes.ok) {
          const errText = await oddsRes.text();
          throw new Error(`${oddsRes.status} — ${errText.slice(0, 120)}`);
        }
        const oddsData = await oddsRes.json();
        const tagged = oddsData.map(o => ({ ...o, api_sport: sportKey }));
        allFetchedOdds = [...allFetchedOdds, ...tagged];
        addLog(`[ODDS] ${sportKey}: ${oddsData.length} games`, oddsData.length > 0 ? "ok" : "warn");
      } catch (e) {
        addLog(`[ODDS ERROR] ${sportKey}: ${e.message}`, "err");
      }
    }

    addLog(`[STEP 3] Pricing ${normalized.length} markets against ${allFetchedOdds.length} sportsbook games...`, "ok");
    if (termRef.current) termRef.current.scrollTop = 0;

    let underpricedCount = 0;

    for (let i = 0; i < normalized.length; i++) {
      const row = normalized[i];
      setProgress(40 + Math.round((i / normalized.length) * 58));
      setStatusMsg(`[${i + 1}/${normalized.length}] Pricing: ${row.title}`);

      setRows(prev => prev.map(r => r.id === row.id ? { ...r, scanState: "scanning" } : r));

      const result = analyzeMarketReal(row, allFetchedOdds);
      if (i < 20 || result.play === 'NO_MATCH') {
        addDebug('MATCH', `${row.cat} ${row.title.slice(0,25)}`, {
          play: result.play,
          matched: result.matchedGame || 'NONE',
          closeTime: row.closeTime,
          eventTitle: row.eventTitle,
        });
      }
      const isUnder = result.play === "YES" || result.play === "NO";
      if (isUnder) underpricedCount++;

      setRows(prev => prev.map(r => {
        if (r.id !== row.id) return r;
        return {
          ...r,
          scanState: "done",
          fairProb: result.fairProb,
          play: result.play,
          entry: result.entry,
          sellTarget: result.sellTarget,
          edgeScore: result.edgeScore,
          executableEdge: result.executableEdge || 0,
          reasoning: result.reasoning,
          sellConditions: result.sellConditions,
          matchedGame: result.matchedGame || null,
        };
      }));

      setStats(prev => ({
        ...prev,
        scanned: prev.scanned + 1,
        underpriced: prev.underpriced + (isUnder ? 1 : 0),
        fair: prev.fair + (isUnder ? 0 : 1),
      }));
    }

    setProgress(100);
    setStatusMsg(`Complete — ${normalized.length} lines priced. ${underpricedCount} edge plays found.`);
    addLog(`✓ DONE: ${underpricedCount} executable edges detected.`, "ok");
    scanRef.current = false;
    setScanning(false);
    setTimeout(() => setProgress(0), 2000);
  }, [apiKey, kalshiKeyOk, kalshiHeaders, addLog]);

  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    if (autoInterval > 0) autoRef.current = setInterval(runScan, autoInterval * 60 * 1000);
    return () => clearInterval(autoRef.current);
  }, [autoInterval, runScan]);

  const toggleCat = s => setActiveCats(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleAll = () => setActiveCats(activeCats.length === ALL_CATS.length ? [] : [...ALL_CATS]);

  // Time window filter: 0 = show all, N = only show games starting within N hours
  const [timeWindow, setTimeWindow] = useState(-1);

  const nowMs = Date.now();

  // DEBUG: compute filter stats
  const filterDebug = rows.length > 0 ? (() => {
    let passed = 0, failCat = 0, failTime = 0, failNull = 0;
    const samples = [];
    rows.forEach(r => {
      if (!activeCats.includes(r.cat)) { failCat++; return; }
      if (timeWindow === 0) { passed++; return; }
      const gMs = r.tickerDateMs || null;
      if (!gMs) { failNull++; return; }
      const daysDiff = (gMs - nowMs) / (1000 * 60 * 60 * 24);
      let passes;
      if (timeWindow === -1) {
        passes = daysDiff >= -1.2 && daysDiff <= 0.5;
      } else {
        passes = daysDiff >= -1.2 && daysDiff <= (timeWindow / 24) + 1;
      }
      if (passes) { passed++; } else { failTime++; }
      if (samples.length < 5) samples.push({ ticker: r.ticker.slice(-16), days: daysDiff.toFixed(2), passes });
    });
    return { passed, failCat, failTime, failNull, total: rows.length, window: timeWindow, samples };
  })() : null;

  const visibleRows = rows.filter(r => {
    if (!activeCats.includes(r.cat)) return false;
    if (timeWindow === 0) return true;

    // Use tickerDateMs (game day) as primary; fall back to close_time for undated tickers
    const gameMs = r.tickerDateMs || (r.closeTime ? new Date(r.closeTime).getTime() : null);
    if (!gameMs) return false; // no timing info — hide when filter is active

    const daysDiff = (gameMs - nowMs) / (1000 * 60 * 60 * 24);

    if (timeWindow === -1) {
      // LIVE NOW: ticker date is today or within 28.8h back — excludes yesterday's finished games
      return daysDiff >= -1.2 && daysDiff <= 0.5;
    }

    // NEXT Xh window
    return daysDiff >= -1.2 && daysDiff <= (timeWindow / 24) + 1;
  });
  const hotRows = visibleRows.filter(r => r.scanState === "done" && (r.play === "YES" || r.play === "NO"));

  return (
    <>
      <style>{STYLE}</style>
      <div className="scanlines" />
      <div className="app">

        <div className="topbar">
          <div className="brand">KALSHI<span> QUANT</span></div>
          <div className="topbar-right">
            <input
              type="password"
              className="api-input"
              placeholder="Paste The Odds API Key here..."
              value={apiKey}
              onChange={handleKeyChange}
            />
            <span className="ts"><span className={`live-dot ${scanning ? "on" : "off"}`} />{scanning ? "SCANNING" : "STANDBY"}</span>
            <span className="ts">MKTS <b className="b">{stats.total}</b></span>
            <span className="ts">PRICED <b className="b">{stats.scanned}</b></span>
            <span className="ts">EDGE <b className="g">{stats.underpriced}</b></span>
            <span className="ts" style={{ color: "var(--text-dim)" }}>{time.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="auth-bar">
          {kalshiKeyOk ? (
            <>
              <span className="auth-connected">✓ KALSHI KEY LOADED</span>
              <button className="auth-logout" onClick={logoutKalshi}>clear</button>
            </>
          ) : (
            <>
              <span className="auth-label">KALSHI API KEY</span>
              <input className="auth-input" placeholder="Key ID (from kalshi.com/profile)"
                value={kalshiKeyId} onChange={e => setKalshiKeyId(e.target.value)} />
              <textarea className="auth-pem" placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                value={kalshiPem} onChange={e => setKalshiPem(e.target.value)} />
              <button className="auth-btn" onClick={loadKalshiKey}>LOAD</button>
              {kalshiErr && <span className="auth-err">{kalshiErr}</span>}
            </>
          )}
        </div>

        <div className="controls">
          <button className="scan-btn" onClick={runScan} disabled={scanning}>
            {scanning ? "◈ SYNCING..." : "▶ REAL DATA SCAN"}
          </button>
          <span className="ctrl-label">AUTO</span>
          <select className="ctrl-sel" value={autoInterval} onChange={e => setAutoInterval(Number(e.target.value))}>
            <option value={0}>OFF</option>
            <option value={5}>5 MIN</option>
            <option value={15}>15 MIN</option>
            <option value={30}>30 MIN</option>
          </select>
          <div className="ctrl-gap" />
          <span className="ctrl-label">SHOW</span>
          <select className="ctrl-sel" value={timeWindow} onChange={e => setTimeWindow(Number(e.target.value))}>
            <option value={-1}>🔴 LIVE NOW</option>
            <option value={2}>NEXT 2H</option>
            <option value={6}>NEXT 6H</option>
            <option value={12}>NEXT 12H</option>
            <option value={24}>NEXT 24H</option>
            <option value={0}>ALL</option>
          </select>
          <div className="ctrl-gap" />
          <button className="clear-btn" onClick={() => { setRows([]); setLogs([]); setStats({ total: 0, scanned: 0, underpriced: 0, fair: 0 }); }}>CLEAR</button>
          <button className="clear-btn" style={{borderColor: showDebug ? 'var(--yellow)' : '', color: showDebug ? 'var(--yellow)' : ''}} onClick={() => setShowDebug(p => !p)}>DEBUG {showDebug ? '▲' : '▼'}</button>
        </div>

        <div className="filter-bar">
          <span className="fb-label">SPORT</span>
          <button className="fb-btn" onClick={toggleAll}>{activeCats.length === ALL_CATS.length ? "NONE" : "ALL"}</button>
          {ALL_CATS.map(s => {
            const sc = getCatColor(s);
            const on = activeCats.includes(s);
            return (
              <button key={s} className={`fb-btn ${on ? "on" : ""}`}
                style={on ? { borderColor: sc, color: sc, background: `${sc}12` } : {}}
                onClick={() => toggleCat(s)}>{s}</button>
            );
          })}
        </div>

        <div className="statusline">
          <div className="prog-track"><div className="prog-fill" style={{ width: `${progress}%` }} /></div>
          <span>{statusMsg}</span>
          {scanning && <span className="blink">_</span>}
        </div>

        <div className="body">
          <div className="terminal" ref={termRef}>
            {rows.length === 0 && logs.length > 0 && (
              <div className="log-panel">
                {logs.map(l => <div key={l.id} className={`log-line ${l.type}`}>{l.text}</div>)}
              </div>
            )}

            {visibleRows.length > 0 && (
              <>
                <div className="tbl-header">
                  <div style={{ width: 2, marginRight: 18 }} />
                  <div className="th col-cat">SPORT</div>
                  <div className="th col-market" style={{ paddingLeft: 10 }}>SELECTION · EVENT</div>
                  <div className="th col-vol" style={{ textAlign: "right" }}>VOL</div>
                  <div className="th col-bid" style={{ textAlign: "right" }}>BID</div>
                  <div className="th col-ask" style={{ textAlign: "right" }}>ASK</div>
                  <div className="th col-fair" style={{ textAlign: "right" }}>TRUE PROB</div>
                  <div className="th col-edge" style={{ textAlign: "right" }}>ACTUAL EV</div>
                  <div className="th col-verdict" style={{ textAlign: "right", paddingLeft: 10 }}>VERDICT</div>
                </div>

                {visibleRows.map(row => {
                  const sc = getCatColor(row.cat);
                  const isUnder = row.scanState === "done" && (row.play === "YES" || row.play === "NO");
                  const isFair = row.scanState === "done" && row.play === "FAIR";
                  const isNoMatch = row.scanState === "done" && row.play === "NO_MATCH";
                  const isNoOdds = row.scanState === "done" && row.play === "NO_ODDS";
                  const isExpired = row.scanState === "done" && row.play === "EXPIRED";
                  const isOpen = expanded[row.id];

                  return (
                    <div key={row.id}>
                      <div
                        className={`game-row ${isUnder ? "underpriced" : ""} clickable`}
                        onClick={() => setExpanded(p => ({ ...p, [row.id]: !p[row.id] }))}
                      >
                        <div className={`row-accent ${row.scanState === "scanning" ? "ra-scanning" : isUnder ? "ra-under" : "ra-pending"}`} />

                        <div className="col-cat">
                          <span className="cat-pill" style={{ borderColor: sc, color: sc }}>{row.cat}</span>
                        </div>

                        <div className="col-market">
                          <div className="row-title" title={`${row.eventTitle} — ${row.ticker}`}>
                            {row.title}
                            {row.eventTitle && row.eventTitle !== row.title
                              ? <span style={{ opacity: 0.5 }}> ({row.eventTitle.replace(/ winner\??$/i, "")})</span>
                              : ""}
                          </div>
                          <div className="row-sub">
                            {row.ticker}
                            {row.closeTime ? ` · Closes ${new Date(row.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ""}
                            {row.matchedGame ? ` · ✓ ${row.matchedGame}` : ""}
                          </div>
                        </div>

                        <div className="col-vol">
                          <div className="pv-label">VOL</div>
                          <div className="pv-val pv-dim">{row.volume24h > 0 ? row.volume24h.toLocaleString() : "--"}</div>
                        </div>

                        <div className="col-bid">
                          <div className="pv-label">BID</div>
                          <div className="pv-val pv-dim">{row.yesBid != null ? `$${row.yesBid.toFixed(2)}` : "--"}</div>
                        </div>

                        <div className="col-ask">
                          <div className="pv-label">ASK</div>
                          <div className="pv-val pv-dim">{row.yesAsk != null ? `$${row.yesAsk.toFixed(2)}` : "--"}</div>
                        </div>

                        <div className="col-fair">
                          <div className="pv-label">TRUE</div>
                          <div className={`pv-val ${row.scanState === "done" && !isNoMatch && !isNoOdds && !isExpired ? "pv-blue" : "pv-dim"}`}>
                            {row.fairProb != null && !isNoMatch && !isExpired && row.fairProb > 0
                              ? `$${row.fairProb.toFixed(2)}`
                              : row.play === "NO_ODDS" ? `${(row.fairProb * 100).toFixed(0)}%`
                              : row.scanState === "scanning" ? "···" : "--"}
                          </div>
                        </div>

                        <div className="col-edge">
                          <div className="pv-label">EDGE</div>
                          <div className={`pv-val ${!isUnder ? "pv-dim" : "pv-green"}`}>
                            {isUnder ? `+${(row.executableEdge * 100).toFixed(0)}¢` : row.scanState === "scanning" ? "···" : "--"}
                          </div>
                        </div>

                        <div className="col-verdict">
                          {row.scanState === "pending" && <div className="verd-pending">QUEUED</div>}
                          {row.scanState === "scanning" && (
                            <div className="verd-scanning"><div className="mini-spin" /> PRICING...</div>
                          )}
                          {isExpired && <div className="verd-pending" style={{ color: "var(--red)", opacity: 0.8 }}>EXPIRED</div>}
                          {isNoMatch && <div className="verd-pending">UNMAPPED</div>}
                          {isNoOdds && <div className="verd-pending" style={{color:'#a78bfa'}}>NO ODDS</div>}
                          {isFair && <div className="verd-fair">PRICED IN</div>}
                          {isUnder && (
                            <div className="verd-under">
                              <div className={`verd-buy ${row.play.toLowerCase()}`}>BUY {row.play}</div>
                              <div className="verd-target">
                                Pay ${(row.entry || 0).toFixed(2)} → Target ${(row.sellTarget || 0).toFixed(2)}
                              </div>
                              <div className="verd-score">
                                {row.edgeScore >= 68 ? "🔥 HOT" : row.edgeScore >= 48 ? "WARM" : "WEAK"} EV
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="row-expand">
                          <div className="exp-title">QUANTITATIVE ANALYSIS</div>
                          <div className="exp-text">{row.reasoning || "Pending analysis..."}</div>
                          {row.sellConditions && (
                            <div className="exp-sell">
                              <div className="exp-sell-title">⚡ EXIT STRATEGY</div>
                              <div className="exp-sell-text">{row.sellConditions}</div>
                            </div>
                          )}
                          <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 8 }}>
                            {row.ticker} ·{" "}
                            <a href={`https://kalshi.com/markets/${row.ticker}`} target="_blank"
                              rel="noreferrer" style={{ color: "var(--green-dim)" }}>
                              Trade on Kalshi ↗
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {rows.length === 0 && logs.length === 0 && !scanning && (
              <div className="empty-state">
                <div style={{ fontSize: 28, marginBottom: 4 }}>◈</div>
                <div style={{ fontSize: 11, lineHeight: 2.1, color: "var(--text-dim)" }}>
                  Hit <span style={{ color: "var(--green)" }}>REAL DATA SCAN</span> to cross-reference Kalshi.<br />
                  Requires a free key from <b>the-odds-api.com</b> pasted in the top bar.<br />
                  Data computes <b>vig-free probability</b> to find genuine market inefficiencies.<br />
                </div>
              </div>
            )}

            {rows.length === 0 && scanning && (
              <div className="empty-state">
                <div className="mini-spin" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <div style={{ fontSize: 11, color: "var(--yellow)", marginTop: 10 }}>Fetching live data...</div>
              </div>
            )}
          </div>

          <div className="sidebar">
            <div className="sb-title">SESSION</div>
            <div className="sb-row"><span className="sb-lbl">MARKETS</span><span className="sb-val" style={{ color: "var(--blue)" }}>{stats.total}</span></div>
            <div className="sb-row"><span className="sb-lbl">PRICED</span><span className="sb-val" style={{ color: "var(--text)" }}>{stats.scanned}</span></div>
            <div className="sb-row"><span className="sb-lbl">EDGE</span><span className="sb-val" style={{ color: "var(--green)" }}>{stats.underpriced}</span></div>
            <div className="sb-row"><span className="sb-lbl">FAIR</span><span className="sb-val" style={{ color: "var(--yellow)" }}>{stats.fair}</span></div>

            <div className="sb-section">
              <div className="sb-section-title">EDGE PLAYS</div>
              {hotRows.length === 0 && <div style={{ fontSize: 10, color: "var(--text-dim)" }}>None yet</div>}
              {hotRows.slice(0, 10).map(r => (
                <div key={r.id} className="sb-play">
                  <div className="sb-play-name">{r.title}</div>
                  <div className="sb-play-sub">
                    <span className={`mpill ${r.play.toLowerCase()}`}>{r.play}</span>
                    <span style={{ fontSize: 9, color: "var(--text-dim)" }}>EV +{(r.executableEdge * 100).toFixed(0)}¢</span>
                    <span style={{ fontSize: 9, color: getCatColor(r.cat) }}>{r.cat}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="sb-section">
              <div className="sb-section-title">HOW IT WORKS</div>
              <div style={{ fontSize: 9, color: "var(--text-dim)", lineHeight: 2 }}>
                <span style={{ color: "var(--green)" }}>1</span> Active game markets pulled<br />
                <span style={{ color: "var(--green)" }}>2</span> Sportsbook lines fetched<br />
                <span style={{ color: "var(--green)" }}>3</span> Vig stripped → true prob<br />
                <span style={{ color: "var(--green)" }}>4</span> Compared to Kalshi orderbook<br />
                <span style={{ color: "var(--green)" }}>5</span> Edge = ask below true prob<br />
                Click any row for full analysis
              </div>
            </div>
          </div>
        </div>

        {showDebug && (
          <div style={{
            position:'fixed', bottom:0, left:0, right:0, height:'40vh',
            background:'#020403', borderTop:'1px solid var(--yellow)',
            display:'flex', flexDirection:'column', zIndex:9998, fontFamily:'var(--mono)',
          }}>
            <div style={{display:'flex', alignItems:'center', gap:12, padding:'4px 12px', borderBottom:'1px solid #1a2a1a', flexShrink:0}}>
              <span style={{color:'var(--yellow)', fontSize:9, letterSpacing:2}}>DEBUG PANEL</span>
              {filterDebug && (
                <span style={{fontSize:9, color:'var(--text-dim)'}}>
                  FILTER [{timeWindow === -1 ? 'LIVE' : timeWindow === 0 ? 'ALL' : `${timeWindow}H`}]:
                  <span style={{color:'var(--green)'}}> {filterDebug.passed} pass</span>
                  <span style={{color:'var(--red)'}}> {filterDebug.failTime} time-fail</span>
                  <span style={{color:'var(--text-dim)'}}> {filterDebug.failCat} cat-off</span>
                  <span style={{color:'var(--red)'}}> {filterDebug.failNull} no-timestamp</span>
                  <span style={{color:'var(--text-dim)'}}> / {filterDebug.total} total</span>
                </span>
              )}
              {filterDebug?.samples?.length > 0 && (
                <span style={{fontSize:9, color:'var(--text-dim)'}}>
                  SAMPLES: {filterDebug.samples.map(s => `${s.ticker}(${s.days}d ${s.passes?'✓':'✗'})`).join(' | ')}
                </span>
              )}
              <button onClick={() => setDebugLog([])} style={{marginLeft:'auto', fontSize:9, background:'none', border:'1px solid var(--border)', color:'var(--text-dim)', cursor:'pointer', padding:'2px 8px'}}>CLEAR</button>
            </div>
            <div style={{overflow:'auto', flex:1, padding:'4px 0'}}>
              {debugLog.length === 0 && <div style={{padding:'8px 12px', fontSize:10, color:'var(--text-dim)'}}>Run a scan to see debug output...</div>}
              {[...debugLog].reverse().map(entry => (
                <div key={entry.id} style={{padding:'1px 12px', fontSize:9, display:'flex', gap:8, borderBottom:'1px solid #0a120a'}}>
                  <span style={{color:'var(--text-dim)', flexShrink:0}}>{entry.ts}</span>
                  <span style={{color: entry.category === 'MATCH' ? (entry.data?.includes('"NONE"') ? 'var(--red)' : 'var(--green)') : entry.category === 'CLOSE_TIME' ? 'var(--blue)' : 'var(--yellow)', flexShrink:0, width:80}}>{entry.category}</span>
                  <span style={{color:'var(--text)', flexShrink:0}}>{entry.msg}</span>
                  {entry.data && <span style={{color:'var(--text-dim)', wordBreak:'break-all'}}>{entry.data}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}