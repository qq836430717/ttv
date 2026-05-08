const fs = require('fs');

// 🎯 模式控制：'strict'（默认）或 'loose'（宽松，央视优先）
const MODE = process.env.IPTV_MODE || 'loose';

// 🌐 源列表（央视专项源置顶）
const SOURCES = [
  // 🔴 央视/卫视专用（高优先级）
  'https://raw.githubusercontent.com/fanmingming/live/main/tv/m3u/ipv6.m3u',
  'https://raw.githubusercontent.com/Guovin/iptv/main/output/result.m3u',
  'https://raw.githubusercontent.com/xzw832/cmys/main/S_CCTV.m3u',
  'https://raw.githubusercontent.com/xzw832/cmys/main/S_weishi.m3u',
  'https://live.fanmingming.com/tv/m3u/ipv6.m3u', // 实时镜像
  
  // 🔵 综合大库
  'https://raw.githubusercontent.com/YueChan/Live/main/APTV.m3u',
  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/cn.m3u',
  'https://raw.githubusercontent.com/zhumeng11/IPTV/main/IPTV.m3u',
  'https://raw.githubusercontent.com/kimwang1978/collect-tv-txt/main/merged_output.txt',
  'https://raw.githubusercontent.com/suxuang/myIPTV/main/ipv6.m3u',
  'https://raw.githubusercontent.com/vbskycn/iptv/master/tv/iptv6.txt'
];

// 🔐 央视白名单（强制保留，即使测活失败）
const CCTV_WHITELIST = [
  'CCTV-1,CCTV-1,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv1_1/index.m3u8',
  'CCTV-2,CCTV-2,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv2_1/index.m3u8',
  'CCTV-3,CCTV-3,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv3_1/index.m3u8',
  'CCTV-4,CCTV-4,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv4_1/index.m3u8',
  'CCTV-5,CCTV-5,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv5_1/index.m3u8',
  'CCTV-5+,CCTV-5+,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv5p_1/index.m3u8',
  'CCTV-6,CCTV-6,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv6_1/index.m3u8',
  'CCTV-7,CCTV-7,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv7_1/index.m3u8',
  'CCTV-8,CCTV-8,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv8_1/index.m3u8',
  'CCTV-9,CCTV-9,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv9_1/index.m3u8',
  'CCTV-10,CCTV-10,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv10_1/index.m3u8',
  'CCTV-11,CCTV-11,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv11_1/index.m3u8',
  'CCTV-12,CCTV-12,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv12_1/index.m3u8',
  'CCTV-13,CCTV-13,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv13_1/index.m3u8',
  'CCTV-14,CCTV-14,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv14_1/index.m3u8',
  'CCTV-15,CCTV-15,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv15_1/index.m3u8',
  'CCTV-16,CCTV-16,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv16_1/index.m3u8',
  'CCTV-17,CCTV-17,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv17_1/index.m3u8',
  'CCTV-4K,CCTV-4K,https://cctvwbcdtxyhw.liveplay.myqcloud.com/cctvwbcd/cdrmjzcctv4k_1/index.m3u8',
  'CGTN,CGTN,https://live.cgtn.com/1000/prog_index.m3u8',
  'CGTN Documentary,CGTN Documentary,https://live.cgtn.com/1008/prog_index.m3u8'
];

// 📥 抓取源
async function fetchSource(url) {
  try {
    const res = await fetch(url, { 
      signal: AbortSignal.timeout(15000), 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
    });
    if (!res.ok) return '';
    const text = await res.text();
    return typeof text === 'string' ? text : '';
  } catch (e) { 
    console.warn(`⚠️ ${url} | ${e.message}`);
    return ''; 
  }
}

// 🛠 解析
function parseContent(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  const lines = text.split('\n');
  const channels = [];
  let curName = '', curUrl = '', curLogo = '';

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      curName = nameMatch ? nameMatch[1].trim() : '未知频道';
      curLogo = logoMatch ? logoMatch[1] : '';
    } else if (!line.startsWith('#') && line.match(/^https?:\/\//)) {
      curUrl = line;
      if (curName && curUrl) {
        channels.push({ name: curName, url: curUrl, logo: curLogo });
        curName = ''; curUrl = ''; curLogo = '';
      }
    } else if (line.includes(',') && line.match(/^https?:\/\//)) {
      const parts = line.split(',');
      const url = parts[parts.length - 1].trim();
      const name = parts.slice(0, -1).join(',').trim();
      if (name && url.match(/^https?:\/\//)) {
        channels.push({ name, url, logo: '' });
      }
    }
  }
  return channels;
}

// 🔍 宽松测活（宽松模式：能连通即保留）
async function testStream(url) {
  if (MODE === 'loose') {
    try {
      // 宽松：只检查能否建立连接（不验证状态码/内容）
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch(url, { 
        method: 'HEAD', 
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      clearTimeout(timeout);
      return true;
    } catch {
      // 即使失败也返回 true（宽松模式核心逻辑）
      return true;
    }
  } else {
    // 严格模式：必须返回 200/302
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000), redirect: 'follow' });
      return res.ok || [301,302,307,308].includes(res.status);
    } catch { return false; }
  }
}

// 🗂 分组
function getGroup(name) {
  const n = name.toLowerCase();
  if (/cctv-?1[0-9]?|cctv-?4k|cctv-?8k|央视综合|央视新闻|央视财经/.test(n)) return '央视';
  if (/卫视|东方卫视|湖南卫视|浙江卫视|江苏卫视|北京卫视/.test(n)) return '地方卫视';
  if (/凤凰|tvb|明珠|翡翠|澳亚|澳门|港台|港澳|hk|mo|tw|viu|now|星河|华视|民视/.test(n)) return '港澳台';
  if (/体育|sport|cba|nba|足球|篮球|cctv-5|咪咕体育|pp 体育|赛事/.test(n)) return '体育';
  if (/电影|影视|cinema|movie|cctv-6|咪咕视频|hbo/.test(n)) return '影视';
  if (/纪录|documentary|探索|discovery|cctv-9/.test(n)) return '纪录';
  if (/少儿|动画|cartoon|kids|cctv-14/.test(n)) return '少儿';
  return '地方台';
}

// 🚀 主流程
async function main() {
  console.log(`📡 Mode: ${MODE} | Fetching sources...`);
  
  // 1️⃣ 抓取 + 解析
  const rawTexts = await Promise.all(SOURCES.map(fetchSource));
  const validTexts = rawTexts.filter(t => typeof t === 'string' && t.trim());
  let allChannels = validTexts.flatMap(parseContent);
  
  // 2️⃣ 注入央视白名单（强制保留）
  CCTV_WHITELIST.forEach(line => {
    const [key, name, url] = line.split(',');
    allChannels.push({ name, url, logo: '' });
  });
  console.log(`📊 Raw + Whitelist: ${allChannels.length}`);

  // 3️⃣ 智能去重（宽松模式：同名保留最多 3 个不同 URL）
  const dedupMap = new Map();
  for (const ch of allChannels) {
    const key = ch.name.replace(/[\s\-_\.()（）高清超清HD4K]/g, '').toLowerCase();
    if (!dedupMap.has(key)) {
      dedupMap.set(key, [ch]);
    } else {
      const list = dedupMap.get(key);
      // 检查是否已存在相同 URL
      if (!list.some(c => c.url === ch.url) && list.length < 3) {
        list.push(ch);
      }
    }
  }
  // 展平去重结果
  const unique = [];
  for (const list of dedupMap.values()) unique.push(...list);
  console.log(`✅ Deduped (max 3 per name): ${unique.length}`);

  // 4️⃣ 测活（宽松模式几乎全保留）
  console.log('🔍 Testing...');
  const batchSize = MODE === 'loose' ? 100 : 60;
  const valid = [];
  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(async ch => {
      if (MODE === 'loose') return ch; // 宽松模式跳过真实测活
      return (await testStream(ch.url)) ? ch : null;
    }));
    valid.push(...results.filter(Boolean));
    console.log(`   ${Math.min(i+batchSize, unique.length)}/${unique.length}`);
  }
  console.log(`🟢 Valid: ${valid.length}`);

  // 5️⃣ 分组排序
  const grouped = {};
  for (const ch of valid) {
    const g = getGroup(ch.name);
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(ch);
  }
  const order = ['央视','地方卫视','港澳台','体育','影视','纪录','少儿','教育','地方台','其他'];
  const sorted = order.filter(g => grouped[g]);
  Object.keys(grouped).forEach(g => { if (!sorted.includes(g)) sorted.push(g); });

  // 6️⃣ 生成输出
  let txt = '';
  for (const g of sorted) {
    txt += `${g},#genre#\n`;
    txt += grouped[g].map(ch => `${ch.name},${ch.url}`).join('\n') + '\n\n';
  }
  fs.writeFileSync('live.txt', txt.trim());

  let m3u = '#EXTM3U url-tvg="http://epg.51zmt.top:8000/api/diyp/"\n';
  for (const g of sorted) {
    for (const ch of grouped[g]) {
      m3u += `#EXTINF:-1 group-title="${g}" tvg-name="${ch.name}",${ch.name}\n${ch.url}\n`;
    }
  }
  fs.writeFileSync('live.m3u', m3u.trim());
  console.log('📦 Saved live.txt & live.m3u');
}

main().catch(e => { console.error('❌', e); process.exit(1); });