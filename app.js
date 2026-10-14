// 直接对接修罗影视官方数据源
const API_URL = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('http://www.xlysw.ggff.net/api.php/provide/vod/?ac=detail');

window.onload = function() {
    loadHomeRecommend();
};

// 加载首页推荐海报
async function loadHomeRecommend() {
    const movieGrid = document.getElementById('movieGrid');
    try {
        let res = await fetch(API_URL);
        let data = await res.json();
        if (data && data.list && data.list.length > 0) {
            renderGrid(data.list);
            return;
        }
    } catch (e) {
        console.log('接口请求失败', e);
    }
    movieGrid.innerHTML = '<div class="loading-tip">获取数据失败，请检查网络或稍后重试</div>';
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

    sectionTitle.innerHTML = `<span class="bar"></span><h2>搜索结果：${keyword}</h2>`;
    movieGrid.innerHTML = '<div class="loading-tip">正在全网检索...</div>';

    try {
        let searchApi = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(`http://www.xlysw.ggff.net/api.php/provide/vod/?ac=detail&wd=${encodeURIComponent(keyword)}`);
        let res = await fetch(searchApi);
        let data = await res.json();
        
        if (data && data.list && data.list.length > 0) {
            renderGrid(data.list);
            return;
        }
    } catch (e) {
        console.error(e);
    }

    movieGrid.innerHTML = '<div class="loading-tip">未找到相关片源</div>';
}

// 渲染网格
function renderGrid(list) {
    const movieGrid = document.getElementById('movieGrid');
    let html = '';
    
    list.forEach(item => {
        let playUrl = extractM3u8(item.vod_play_url);
        html += `
            <div class="movie-card" onclick="playVideo('${playUrl}', '${item.vod_name}')">
                <div class="poster-box">
                    <img src="${item.vod_pic}" onerror="this.src='https://via.placeholder.com/150x210/222/666?text=NO+IMG'" alt="${item.vod_name}">
                    <span class="score-tag">${item.vod_score || '0.0分'}</span>
                    <span class="hd-tag">${item.vod_remarks || 'HD'}</span>
                </div>
                <div class="movie-info">
                    <div class="movie-name">${item.vod_name}</div>
                    <div class="movie-desc">${item.vod_remarks || '在线播放'}</div>
                </div>
            </div>
        `;
    });
    movieGrid.innerHTML = html;
}

// 提取 m3u8 播放地址
function extractM3u8(str) {
    if (!str) return '';
    let matches = str.match(/(https?:\/\/[^\s$#]+\.m3u8)/g);
    return matches ? matches[0] : '';
}

// 播放视频
function playVideo(url, name) {
    if (!url) {
        alert('该影片暂无有效 m3u8 播放源');
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

function closePlayer() {
    document.getElementById('playerSection').style.display = 'none';
    document.getElementById('dplayer').innerHTML = '';
}
