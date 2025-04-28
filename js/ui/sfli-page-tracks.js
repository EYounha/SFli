// sfli-page-tracks.js - 트랙 및 좋아요 트랙 관련 기능

// 트랙 렌더링을 담당하는 클래스
export default class SfliTracks {
    constructor(logger) {
        this.logger = logger;
        this.likedTracks = null;
    }

    // 좋아요 트랙 데이터 설정
    setLikedTracks(tracks) {
        this.likedTracks = tracks;
        return this;
    }

    // 좋아요 트랙 로드
    async loadLikedTracks(spotifyClient) {
        try {
            const container = document.getElementById('liked-tracks-list');
            if (!container) {
                this.logger.warn('liked-tracks-list 컨테이너를 찾을 수 없음');
                return null;
            }
            
            // 이미 로드된 경우 스킵
            if (this.likedTracks?.items && this.likedTracks.items.length > 0) {
                this.logger.debug('이미 로드된 좋아요 트랙이 있으므로 재사용');
                return this.likedTracks;
            }
            
            // 로딩 중 표시
            container.innerHTML = '<li class="loading-placeholder">좋아요 표시한 곡 로드 중...</li>';
            
            // 좋아요 한 트랙 로드
            this.logger.debug('좋아요 트랙 데이터 요청 중...');
            this.likedTracks = await spotifyClient.getLikedTracks();
            
            // 트랙 렌더링
            this.renderLikedTracks();
            
            this.logger.debug(`좋아요 트랙 ${this.likedTracks.items.length}개 로드 및 렌더링 완료`);
            return this.likedTracks;
        } catch (error) {
            this.logger.error('좋아요 한 트랙 로드 중 오류:', error);
            throw error;
        }
    }
    
    // 플레이리스트 트랙 렌더링
    renderPlaylistTracks(response) {
        const container = document.getElementById('tracks-list');
        if (!container || !response?.items) {
            this.logger.warn('tracks-list 컨테이너를 찾을 수 없거나 트랙 데이터가 없음');
            return;
        }
        
        this.logger.debug(`플레이리스트 트랙 ${response.items.length}개 렌더링 시작`);
        container.innerHTML = '';
        
        response.items.forEach((item, index) => {
            if (!item.track) return; // 트랙이 없는 경우 건너뜀
            
            const track = item.track;
            const trackItem = document.createElement('li');
            trackItem.className = 'track-item';
            
            // 트랙 재생 시간을 분:초 형식으로 변환
            const minutes = Math.floor(track.duration_ms / 60000);
            const seconds = ((track.duration_ms % 60000) / 1000).toFixed(0);
            const duration = `${minutes}:${seconds.padStart(2, '0')}`;
            
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-info">
                    <div class="track-title-container">
                        <span class="track-title">${track.name}</span>
                        <span class="heart-icon"></span>
                    </div>
                    <div class="track-artist">${track.artists.map(a => a.name).join(', ')}</div>
                </div>
                <div class="track-album">${track.album.name}</div>
                <div class="track-duration">${duration}</div>
            `;
            
            container.appendChild(trackItem);
        });
        
        this.logger.debug('플레이리스트 트랙 렌더링 완료');
    }
    
    // 좋아요 한 트랙 렌더링
    renderLikedTracks() {
        const container = document.getElementById('liked-tracks-list');
        if (!container || !this.likedTracks?.items) {
            this.logger.warn('liked-tracks-list 컨테이너를 찾을 수 없거나 트랙 데이터가 없음');
            return;
        }
        
        this.logger.debug(`좋아요 트랙 ${this.likedTracks.items.length}개 렌더링 시작`);
        container.innerHTML = '';
        
        this.likedTracks.items.forEach((item, index) => {
            const track = item.track;
            const trackItem = document.createElement('li');
            trackItem.className = 'track-item';
            
            // 트랙 재생 시간을 분:초 형식으로 변환
            const minutes = Math.floor(track.duration_ms / 60000);
            const seconds = ((track.duration_ms % 60000) / 1000).toFixed(0);
            const duration = `${minutes}:${seconds.padStart(2, '0')}`;
            
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-info">
                    <div class="track-title-container">
                        <span class="track-title">${track.name}</span>
                        <span class="heart-icon"></span>
                    </div>
                    <div class="track-artist">${track.artists.map(a => a.name).join(', ')}</div>
                </div>
                <div class="track-album-info">${track.album.name}</div>
                <div class="track-duration">${duration}</div>
            `;
            
            container.appendChild(trackItem);
        });
        
        this.logger.debug('좋아요 트랙 렌더링 완료');
    }
}