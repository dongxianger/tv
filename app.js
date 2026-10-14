const API_URLS = [
    'https://ikunzyapi.com/api.php/provide/vod/at/xml',
    'https://cj.lziapi.com/api.php/provide/vod/at/xml'
];

const PROXY = 'https://corsproxy.io/?';

async function searchMovies() {
    const keyword = document.getElementById('searchInput').value.trim();
    const movieGrid = document.getElementById('movieGrid');
    const sectionTitle = document.getElementById('sectionTitle');
    
    if (!keyword) {
        alert('请输入影片名称！');
        return;
    }

    sectionTitle.innerHTML = `<span>搜索结果：${keyword}</span>`;
    movieGrid.innerHTML = '<div class="loading-text">正在全网检索片源海报中...</div>';

    let foundResults = [];

    for (let apiUrl of API_URLS) {
        try {
            const targetUrl = `${apiUrl}?wd=${encodeURIComponent(keyword)}`;
            const res = await fetch(PROXY + encodeURIComponent(targetUrl));
            const xmlText = await res.text();
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            const videoNodes = xmlDoc.getElementsByTagName('video');

            for (let node of videoNodes) {
                const name = node.getElementsByTagName('name')[0]?.textContent || '未知片名';
                const pic = node.getElementsByTagName('pic')[0]?.textContent || '';
                const type = node.getElementsByTagName('type')[0]?.textContent || '影视';
                const note = node.getElementsByTagName('note')[0]?.textContent || 'HD';
                
                const dlNode = node.getElementsByTagName('dl')[0];
                const ddNodes = dlNode ? dlNode.getElementsByTagName('dd') : [];
                
                let playUrl = '';
                for (let dd of ddNodes) {
                    const text = dd.textContent || '';
                    if (text.includes('.m3u8')) {
                        const lines = text.split('$');
                        for (let line of lines) {
                            if (line.includes('.m3u8')) {
                                playUrl = line.match(/(https?:\/\/[^\s]+?\.m3u8)/)?.[0] || '';
                                if (playUrl) break;
                            }
                        }
                    }
                    if (playUrl) break;
                }

                if (playUrl) {
                    foundResults.push({ name, pic, type, note, playUrl });
                }
            }
        } catch (e) {
            console.log('线路加载失败：', e);
        }
        if (foundResults.length > 0) break;
    }

    if (foundResults.length === 0) {
        movieGrid.innerHTML = '<div class="loading-text">未找到相关片源，请更换关键词尝试。</div>';
        return;
    }

    renderGrid(foundResults);
}

function renderGrid(list) {
    const movieGrid = document.getElementById('movieGrid');
    let html = '';
    
    list.forEach(item => {
        // 缺省图处理
        const defaultPic = 'https://via.placeholder.com/150x210/222/666?text=BD+VIDEO';
        const imgUrl = item.pic && item.pic.startsWith('http') ? item.pic : defaultPic;

        html += `
            <div class="movie-card" onclick="playVideo('${item.playUrl}', '${item.name}')">
                <div class="poster-wrapper">
                    <img src="${imgUrl}" onerror="this.src='${defaultPic}'" alt="${item.name}">
                    <span class="quality-tag">${item.note}</span>
                </div>
                <div class="movie-info">
                    <div class="movie-title">${item.name}</div>
                    <div class="movie-sub">${item.type}</div>
                </div>
            </div>
        `;
    });
    movieGrid.innerHTML = html;
}

function playVideo(url, name) {
    const playerSection = document.getElementById('playerSection');
    const playerTitle = document.getElementById('playerTitle');
    
    playerSection.style.display = 'block';
    playerTitle.innerText = `正在播放：${name}`;
    
    // 滚动到播放器位置
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
