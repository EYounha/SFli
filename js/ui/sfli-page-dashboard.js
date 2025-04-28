// sfli-page-dashboard.js - 대시보드 관련 렌더링 기능

// 대시보드 관련 기능을 담당하는 클래스
export default class SfliDashboard {
    constructor(logger) {
        this.logger = logger;
    }

    // 대시보드 데이터 로드
    async loadData(spotifyClient) {
        try {
            this.logger.debug('대시보드 데이터 로드 중...');

            // 최근 인기 트랙 로드
            const topTracks = await spotifyClient.getTopTracks('short_term', 5);
            this.renderTopTracks(topTracks);
            
            // 최근 인기 아티스트 로드
            const topArtists = await spotifyClient.getTopArtists('short_term', 5);
            this.renderTopArtists(topArtists);
            
            this.logger.debug('대시보드 데이터 로드 완료');
            
            return { topTracks, topArtists };
        } catch (error) {
            this.logger.error('대시보드 데이터 로드 중 오류:', error);
            throw error;
        }
    }

    // 최근 인기 트랙 렌더링
    renderTopTracks(topTracks) {
        const container = document.getElementById('top-tracks-list');
        if (!container || !topTracks.items) {
            this.logger.warn('top-tracks-list 컨테이너를 찾을 수 없거나 트랙 데이터가 없음');
            return;
        }
        
        this.logger.debug(`인기 트랙 ${topTracks.items.length}개 렌더링 시작`);
        container.innerHTML = '';
        
        topTracks.items.forEach((track, index) => {
            const trackItem = document.createElement('li');
            trackItem.className = 'track-item';
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <img src="${track.album.images[0]?.url}" class="track-cover" alt="${track.name}">
                <div class="track-info">
                    <div class="track-title">${track.name}</div>
                    <div class="track-artist">${track.artists.map(a => a.name).join(', ')}</div>
                </div>
            `;
            container.appendChild(trackItem);
        });
        
        this.logger.debug('인기 트랙 렌더링 완료');
    }
    
    // 최근 인기 아티스트 렌더링
    renderTopArtists(topArtists) {
        const container = document.getElementById('top-artists-list');
        if (!container || !topArtists.items) {
            this.logger.warn('top-artists-list 컨테이너를 찾을 수 없거나 아티스트 데이터가 없음');
            return;
        }
        
        this.logger.debug(`인기 아티스트 ${topArtists.items.length}개 렌더링 시작`);
        container.innerHTML = '';
        
        topArtists.items.forEach((artist, index) => {
            const artistItem = document.createElement('li');
            artistItem.className = 'track-item';
            artistItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <img src="${artist.images[0]?.url}" class="track-cover" alt="${artist.name}">
                <div class="track-info">
                    <div class="track-title">${artist.name}</div>
                    <div class="track-artist">${artist.genres.slice(0, 3).join(', ')}</div>
                </div>
            `;
            container.appendChild(artistItem);
        });
        
        this.logger.debug('인기 아티스트 렌더링 완료');
    }
}