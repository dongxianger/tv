// 初始化播放器
const dp = new DPlayer({
    container: document.getElementById('player'),
    autoplay: true,
    video: {
        url: '',
        type: 'auto',
    },
});

const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const movieList = document.getElementById('movieList');
const tipsText = document.getElementById('tipsText');
const playerContainer = document.getElementById('player');

// 点击搜索
searchBtn.addEventListener('click', () => {
    const keyword = searchInput.value.trim();
    if (!keyword) return alert('请输入搜索关键词');
    searchMovies(keyword);
});

// 回车键直接搜
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

async function searchMovies(keyword) {
    movieList.innerHTML = '';
    tipsText.innerText = '正在全网检索片源...';

    // 使用公开的苹果 CMS 资源站接口，并通过公共 CORS 代理解决浏览器跨域限制
    const targetApi = `https://api.okzy.tv/api.php/provide/vod/at/json?wd=${encodeURIComponent(keyword)}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetApi)}`;

    try {
        const response = await fetch(proxyUrl);
        const wrapper = await response.json();
        const data = JSON.parse(wrapper.contents); // 解析代理返回的内容

        if (data && data.list && data.list.length > 0) {
            tipsText.innerText = `找到相关影视 ${data.list.length} 部，点击即可播放：`;
            renderMovies(data.list);
        } else {
            tipsText.innerText = '没有找到相关影片，换个词试试吧';
        }
    } catch (err) {
        console.error(err);
        tipsText.innerText = '获取片源失败，请检查网络或稍后再试';
    }
}

// 渲染电影卡片
function renderMovies(movies) {
    movieList.innerHTML = '';
    movies.forEach(movie => {
        const item = document.createElement('div');
        item.className = 'movie-item';
        item.innerHTML = `
            <img class="movie-poster" src="${movie.vod_pic}" alt="${movie.vod_name}" loading="lazy">
            <div class="movie-title">${movie.vod_name}</div>
        `;

        item.addEventListener('click', () => {
            playMovie(movie);
        });

        movieList.appendChild(item);
    });
}

// 提取 m3u8 播放地址并播放
function playMovie(movie) {
    const playUrlString = movie.vod_play_url;
    if (!playUrlString) {
        return alert('该影片暂无可用播放源');
    }

    try {
        // 苹果CMS播放地址通常形如：第1集$url#第2集$url... 取第一集
        const firstSource = playUrlString.split('#')[0];
        const m3u8Url = firstSource.split('$')[1];

        if (m3u8Url && m3u8Url.includes('.m3u8')) {
            playerContainer.classList.add('active');
            dp.switchVideo({ url: m3u8Url });
            dp.play();
            
            // 滚动到顶部让用户看到播放器
            document.getElementById('contentArea').scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert('未找到有效的 M3U8 视频直连地址');
        }
    } catch (e) {
        console.error(e);
        alert('解析播放地址出错');
    }
}
