// 静态备用热门推荐（防止代理失效时死黑）
const DEFAULT_MOVIES = [
    { name: "蜘蛛侠：崭新之日", pic: "https://p.ssl.qhimg.com/t01d01dd3a6a978f8ff.jpg", score: "2.5分", note: "HD", playUrl: "https://v3.szjal.cn/202305/01/vG3fG3zY/video/index.m3u8" },
    { name: "希望2026", pic: "https://p.ssl.qhimg.com/t01825eb0e9d6d54d24.jpg", score: "0.0分", note: "HD", playUrl: "https://v3.szjal.cn/202305/01/vG3fG3zY/video/index.m3u8" },
    { name: "金蝉脱壳3：恶魔车站", pic: "https://p.ssl.qhimg.com/t01314aef72c0ddcbe2.jpg", score: "0.0分", note: "HD", playUrl: "https://v3.szjal.cn/202305/01/vG3fG3zY/video/index.m3u8" },
    { name: "兰香如故", pic: "https://p.ssl.qhimg.com/t01f221437bf2f1a3a4.jpg", score: "3.3分", note: "更新至第25集", playUrl: "https://v3.szjal.cn/202305/01/vG3fG3zY/video/index.m3u8" },
    { name: "魅影神捕", pic: "https://p.ssl.qhimg.com/t011c75dd9c1b35e076.jpg", score: "2.5分", note: "全集", playUrl: "https://v3.szjal.cn/202305/01/vG3fG3zY/video/index.m3u8" }
];

// 页面加载完成后自动运行
window.onload = function() {
    loadHomeRecommend();
};

// 加载首页海报
async function loadHomeRecommend() {
    const movieGrid = document.getElementById('movieGrid');
    
    // 优先尝试从稳定JSON接口获取
    try {
        let res = await fetch('https://api.wujinapi.me/api.php/provide/vod/?ac=detail');
        let data = await res.json();
        if (data && data.list && data.list.length > 0) {
            let list = data.list.map(item => ({
                name: item.vod_name,
                pic: item.vod_pic,
                score: item.vod_score || '0.0分',
                note: item.vod_remarks || 'HD',
                playUrl: extractM3u8(item.vod_play_url)
            })).filter(item => item.playUrl);

            if (list.length > 0) {
                renderGrid(list);
                return;
            }
        }
    } catch (e) {
        console.log('网络接口读取超时，切换备用推荐');
    }

    // 接口失败时保底渲染
    renderGrid(DEFAULT_MOVIES);
}

// 搜索逻辑
async function searchMovies() {
    const keyword = document.getElementById('searchInput').value.trim();
    const movieGrid = document.getElementById('movieGrid');
    const sectionTitle = document.getElementById('sectionTitle');
    
    if (!keyword) {
        alert('请输入影片名称！');
        return;
    }

    sectionTitle.innerHTML = `<span>搜索结果：${keyword}</span>`;
    movieGrid.innerHTML = '<div class="loading-tip">正在全网检索《' + keyword + '》...</div>';

    try {
        let res = await fetch(`https://api.wujinapi.me/api.php/provide/vod/?ac=detail&wd=${encodeURIComponent(keyword)}`);
        let data = await res.json();
        
        if (data && data.list && data.list.length > 0) {
            let list = data.list.map(item => ({
                name: item.vod_name,
                pic: item.vod_pic,
                score: item.vod_score || '0.0分',
                note: item.vod_remarks || 'HD',
                playUrl: extractM3u8(item.vod_play_url)
            })).filter(item => item.playUrl);

            if (list.length > 0) {
                renderGrid(list);
                return;
            }
        }
    } catch (e) {
        console.error(e);
    }

    movieGrid.innerHTML = '<div class="loading-tip">未找到相关片源，请尝试其他关键词。</div>';
}

// 解析 m3u8 链接
function extractM3u8(str) {
    if (!str) return '';
    let matches = str.match(/(https?:\/\/[^\s$#]+\.m3u8)/g);
    return matches ? matches[0] : '';
}

// 渲染卡片
function renderGrid(list) {
    const movieGrid = document.getElementById('movieGrid');
    let html = '';
    
    list.forEach(item => {
        const defaultPic = 'https://via.placeholder.com/150x210/222/666?text=BD+VIDEO';
        const imgUrl = item.pic && item.pic.startsWith('http') ? item.pic : defaultPic;

        html += `
            <div class="movie-card" onclick="playVideo('${item.playUrl}', '${item.name}')">
                <div class="poster-box">
                    <img src="${imgUrl}" onerror="this.src='${defaultPic}'" alt="${item.name}">
                    <span class="score-tag">${item.score || '0.0分'}</span>
                    <span class="hd-tag">${item.note || 'HD'}</span>
                </div>
                <div class="movie-info">
                    <div class="movie-name">${item.name}</div>
                    <div class="movie-desc">${item.note || '在线播放'}</div>
                </div>
            </div>
        `;
    });
    movieGrid.innerHTML = html;
}

// 播放控制
function playVideo(url, name) {
    if (!url) {
        alert('该影片暂无有效播放源');
        return;
    }
    const playerSection = document.getElementById('playerSection');
    const playerTitle = document.getElementById('playerTitle');
    
    playerSection.style.display = 'block';
    playerTitle.innerText = `正在播放：${name}`;
    playerSection.scrollIntoView({ behavior: 'smooth' });

    document.getElementById('dplayer').innerHTML = '';

    new DPlayer({
        container: document.getElementById('dplayer'),
        autoplay: true,
        video: {
            url: url,
            type: 'hls'
        }
    });
}
