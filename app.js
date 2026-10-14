// 静态备用热门推荐（保底数据）
const DEFAULT_MOVIES = [
    { name: "蜘蛛侠：崭新之日", pic: "https://p.ssl.qhimg.com/t01d01dd3a6a978f8ff.jpg", score: "2.5分", note: "HD", playUrl: "" },
    { name: "希望2026", pic: "https://p.ssl.qhimg.com/t01825eb0e9d6d54d24.jpg", score: "0.0分", note: "HD", playUrl: "" },
    { name: "金蝉脱壳3：恶魔车站", pic: "https://p.ssl.qhimg.com/t01314aef72c0ddcbe2.jpg", score: "0.0分", note: "HD", playUrl: "" }
];

// 修罗影视接口 + 跨域中转代理
const PROXY = 'https://api.allorigins.win/raw?url=';
const XL_API = 'http://www.xlysw.ggff.net/api.php/provide/vod/?ac=detail';

// 页面加载完成后自动运行
window.onload = function() {
    loadHomeRecommend();
};

// 加载首页海报
async function loadHomeRecommend() {
    const movieGrid = document.getElementById('movieGrid');
    
    try {
        // 抓取修罗影视接口
        let res = await fetch(PROXY + encodeURIComponent(XL_API));
        let data = await res.json();
        
        if (data && data.list && data.list.length > 0) {
            let list = parseMovieData(data.list);
            if (list.length > 0) {
                renderGrid(list);
                return;
            }
        }
    } catch (e) {
        console.log('修罗接口读取超时，尝试备用线路...', e);
    }

    // 接口失败时尝试二次直连
    try {
        let res = await fetch('https://cj.lziapi.com/inc/api.php?ac=detail');
        let data = await res.json();
        if (data && data.list) {
            let list = parseMovieData(data.list);
            renderGrid(list);
            return;
        }
    } catch(e) {}

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
    movieGrid.innerHTML = '<div class="loading-tip">正在检索《' + keyword + '》...</div>';

    try {
        let searchUrl = XL_API + `&wd=${encodeURIComponent(keyword)}`;
        let res = await fetch(PROXY + encodeURIComponent(searchUrl));
        let data = await res.json();
        
        if (data && data.list && data.list.length > 0) {
            let list = parseMovieData(data.list);
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

// 解析数据公共函数
function parseMovieData(rawList) {
    return rawList.map(item => ({
        name: item.vod_name,
        pic: item.vod_pic,
        score: item.vod_score || '0.0分',
        note: item.vod_remarks || 'HD',
        playUrl: extractM3u8(item.vod_play_url)
    })).filter(item => item.playUrl);
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
