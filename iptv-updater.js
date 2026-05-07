const fs = require('fs');

// 🌐 增强源列表（央视/卫视/地方台/咪咕/体育专用，高频更新）
const SOURCES = [
  // 🔹 综合大库（优先）
  'https://raw.githubusercontent.com/fanmingming/live/main/tv/m3u/ipv6.m3u',
  'https://raw.githubusercontent.com/Guovin/iptv/main/output/result.m3u',
  'https://raw.githubusercontent.com/YueChan/Live/main/APTV.m3u',
  
  // 🔹 央视/卫视专用（高纯度）
  'https://raw.githubusercontent.com/xzw832/cmys/main/S_CCTV.m3u',
  'https://raw.githubusercontent.com/xzw832/cmys/main/S_weishi.m3u',
  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/cn.m3u',
  
  // 🔹 咪咕/体育/影视专项
  'https://raw.githubusercontent.com/zhumeng11/IPTV/main/IPTV.m3u',
  'https://raw.githubusercontent.com/kimwang1978/collect-tv-txt/main/merged_output.txt',
  'https://raw.githubusercontent.com/suxuang/myIPTV/main/ipv6.m3u',
  
  // 🔹 地方台补充（按省份）
  'https://raw.githubusercontent.com/vbskycn/iptv/master/tv/iptv6.txt',
  'https://raw.githubusercontent.com/asdjkl6/tv/tv/.tv/tv.txt'
];

// 📥 抓取源内容（失败时返回空字符串）
async function fetchSource(url) {
  try {
    const res = await fetch(url, { 
      signal: AbortSignal.timeout(12000), // 延长到 12 秒，适配大文件
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
    });
    if (!res.ok) {
      console.warn(`⚠️ ${url} returned ${res.status}`);
      return '';
    }
    const text = await res.text();
    return typeof text === 'string' ? text : '';
  } catch (e) { 
    console.warn(`⚠️ 抓取失败: ${url} | ${e.message}`);
    return ''; 
  }
}

// 🛠 混合解析（增强容错）
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

// 🔍 流媒体测活（轻量检测）
async function testStream(url) {
  try {
    // 优先用 HEAD，失败则跳过（不降级 GET，节省时间）
    const res = await fetch(url, { 
      method: 'HEAD', 
      signal: AbortSignal.timeout(4000), 
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return res.ok || [301,302,307,308].includes(res.status);
  } catch { 
    return false; 
  }
}

// 🗂 智能分组（扩展咪咕/体育识别）
function getGroup(name) {
  const n = name.toLowerCase();
  if (/cctv-?1[0-5]?|cctv-?4k|cctv-?8k|央视综合|央视新闻|央视财经|央视少儿/.test(n)) return '央视';
  if (/卫视|东方卫视|湖南卫视|浙江卫视|江苏卫视|北京卫视/.test(n)) return '地方卫视';
  if (/凤凰|tvb|明珠|翡翠|澳亚|澳门|港台|港澳|hk|mo|tw|viu|now|星河|华视|民视|中视/.test(n)) return '港澳台';
  if (/体育|sport|cba|nba|足球|篮球|cctv-5|cctv-5\+|咪咕体育|migu sport|pp 体育|赛事直播|英超|西甲/.test(n)) return '体育';
  if (/电影|影视|cinema|movie|cctv-6|咪咕视频|migu video|hbo|star/.test(n)) return '影视';
  if (/纪录|documentary|探索|discovery|cctv-9|national geographic/.test(n)) return '纪录';
  if (/少儿|动画|cartoon|kids|cctv-14|babytv/.test(n)) return '少儿';
  if (/教育|caroon|学习|coursera|ted/.test(n)) return '教育';
  return '地方台';
}

// 🚀 主流程
async function main() {
  console.log('📡 Fetching sources...');
  const rawTexts = await Promise.all(SOURCES.map(fetchSource));
  
  const validTexts = rawTexts.filter(t => typeof t === 'string' && t.trim().length > 0);
  let allChannels = validTexts.flatMap(parseContent);
  console.log(`📊 Raw Channels: ${allChannels.length} (from ${validTexts.length}/${SOURCES.length} sources)`);

  // 🔁 智能去重：优先保留含"高清/4K/IPv6"的链接
  const dedupMap = new Map();
  for (const ch of allChannels) {
    const key = ch.name.replace(/[\s\-_\.()（）高清超清HD4K]/g, '').toLowerCase();
    const existing = dedupMap.get(key);
    if (!existing) {
      dedupMap.set(key, ch);
    } else {
      // 优先级：4K > 高清 > IPv6 > 普通
      const score = (url) => (url.includes('4k')?3:0) + (url.includes('hd')?2:0) + (url.includes('ipv6')?1:0);
      if (score(ch.url) > score(existing.url)) {
        dedupMap.set(key, ch);
      }
    }
  }
  const unique = Array.from(dedupMap.values());
  console.log(`✅ Deduped: ${unique.length}`);

  // 🔍 分批测活（降低 GitHub Runner 限流风险）
  console.log('🔍 Testing availability...');
  const batchSize = 80; // 适当提高并发
  const valid = [];
  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(async ch => (await testStream(ch.url)) ? ch : null));
    valid.push(...results.filter(Boolean));
    console.log(`   Progress: ${Math.min(i + batchSize, unique.length)}/${unique.length}`);
  }
  console.log(`🟢 Valid Streams: ${valid.length}`);

  // 🗂 分组排序
  const grouped = {};
  for (const ch of valid) {
    const g = getGroup(ch.name);
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(ch);
  }
  const order = ['央视','地方卫视','港澳台','体育','影视','纪录','少儿','教育','地方台','其他'];
  const sorted = order.filter(g => grouped[g]);
  Object.keys(grouped).forEach(g => { if (!sorted.includes(g)) sorted.push(g); });

  // 📝 生成 TXT（TVBox 专用格式）
  let txt = '';
  for (const g of sorted) {
    txt += `${g},#genre#\n`;
    txt += grouped[g].map(ch => `${ch.name},${ch.url}`).join('\n') + '\n\n';
  }
  fs.writeFileSync('live.txt', txt.trim());

  // 📝 生成 M3U（带 EPG 和分组）
  let m3u = '#EXTM3U url-tvg="http://epg.51zmt.top:8000/api/diyp/" x-tvg-url="http://epg.51zmt.top:8000/api/diyp/"\n';
  for (const g of sorted) {
    for (const ch of grouped[g]) {
      m3u += `#EXTINF:-1 group-title="${g}" tvg-name="${ch.name}" tvg-logo="${ch.logo||''}",${ch.name}\n${ch.url}\n`;
    }
  }
  fs.writeFileSync('live.m3u', m3u.trim());
  console.log('📦 Successfully saved live.txt & live.m3u');
}

main().catch(e => { console.error('❌ Fatal Error:', e); process.exit(1); });