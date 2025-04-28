// sfli-page-playlists.js - 플레이리스트 관리 관련 기능

// 플레이리스트 관리 기능을 담당하는 클래스
export default class SfliPlaylists {
    constructor(logger) {
        this.logger = logger;
        this.playlists = null;
        this.currentPlaylist = null;
    }

    // 플레이리스트 데이터 설정
    setPlaylists(playlists) {
        this.playlists = playlists;
        return this;
    }

    // 현재 선택된 플레이리스트 가져오기
    getCurrentPlaylist() {
        return this.currentPlaylist;
    }

    // 플레이리스트 로드
    async loadPlaylists(spotifyClient) {
        try {
            this.logger.debug('플레이리스트 로드 중...');
            const playlists = await spotifyClient.getUserPlaylists();
            this.playlists = playlists;
            
            this.renderPlaylists();
            this.renderPlaylistGrid();
            
            this.logger.debug(`${playlists.items.length}개의 플레이리스트 로드 및 렌더링 완료`);
            return playlists;
        } catch (error) {
            this.logger.error('플레이리스트 로드 중 오류:', error);
            throw error;
        }
    }
    
    // 사이드바에 플레이리스트 렌더링
    renderPlaylists() {
        const container = document.getElementById('playlists-list');
        if (!container || !this.playlists?.items) {
            this.logger.warn('playlists-list 컨테이너를 찾을 수 없거나 플레이리스트 데이터가 없음');
            return;
        }
        
        // 로딩 표시 제거
        const loadingEl = document.querySelector('.playlists-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
        this.logger.debug(`사이드바에 ${this.playlists.items.length}개의 플레이리스트 렌더링 시작`);
        container.innerHTML = '';
        
        this.playlists.items.forEach(playlist => {
            const item = document.createElement('li');
            item.className = 'playlist-item';
            
            const thumbnailUrl = playlist.images[0]?.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"%3E%3Cpath d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"%3E%3C/path%3E%3C/svg%3E';
            
            item.innerHTML = `
                <a href="#" class="playlist-link" data-playlist-id="${playlist.id}">
                    <img src="${thumbnailUrl}" class="playlist-thumb" alt="${playlist.name}">
                    ${playlist.name}
                </a>
            `;
            
            // 클릭 이벤트는 외부에서 설정
            container.appendChild(item);
        });
        
        this.logger.debug('사이드바 플레이리스트 렌더링 완료');
    }
    
    // 그리드 형태로 플레이리스트 렌더링
    renderPlaylistGrid() {
        const container = document.getElementById('playlist-grid');
        if (!container || !this.playlists?.items) {
            this.logger.warn('playlist-grid 컨테이너를 찾을 수 없거나 플레이리스트 데이터가 없음');
            return;
        }
        
        this.logger.debug(`그리드에 ${this.playlists.items.length}개의 플레이리스트 렌더링 시작`);
        container.innerHTML = '';
        
        this.playlists.items.forEach(playlist => {
            const thumbnailUrl = playlist.images[0]?.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"%3E%3Cpath d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"%3E%3C/path%3E%3C/svg%3E';
            
            const playlistCard = document.createElement('div');
            playlistCard.className = 'playlist-card';
            playlistCard.dataset.playlistId = playlist.id;
            
            playlistCard.innerHTML = `
                <img src="${thumbnailUrl}" class="playlist-card-image" alt="${playlist.name}">
                <div class="playlist-card-info">
                    <h3 class="playlist-card-title">${playlist.name}</h3>
                    <p class="playlist-card-details">${playlist.tracks.total}곡</p>
                </div>
            `;
            
            // 클릭 이벤트는 외부에서 설정
            container.appendChild(playlistCard);
        });
        
        this.logger.debug('그리드 플레이리스트 렌더링 완료');
    }
    
    // 특정 플레이리스트 열기
    async openPlaylist(playlistId, spotifyClient, showViewCallback, trackRenderer) {
        try {
            // 현재 플레이리스트 찾기
            const playlist = this.playlists.items.find(p => p.id === playlistId);
            if (!playlist) {
                this.logger.warn(`ID가 ${playlistId}인 플레이리스트를 찾을 수 없음`);
                return;
            }
            
            this.currentPlaylist = playlist;
            this.logger.debug(`플레이리스트 열기: ${playlist.name} (${playlist.id})`);
            
            // 플레이리스트 상세 정보 표시
            const coverEl = document.getElementById('playlist-cover');
            const nameEl = document.getElementById('playlist-name');
            const detailsEl = document.getElementById('playlist-details');
            
            if (coverEl) coverEl.src = playlist.images[0]?.url || '';
            if (nameEl) nameEl.textContent = playlist.name;
            if (detailsEl) {
                const owner = playlist.owner.display_name || playlist.owner.id;
                detailsEl.textContent = `${owner} • ${playlist.tracks.total}곡`;
            }
            
            // 트랙 로드 중 표시
            const tracksListEl = document.getElementById('tracks-list');
            if (tracksListEl) {
                tracksListEl.innerHTML = '<li class="loading-placeholder">트랙 로드 중...</li>';
            }
            
            // 트랙 로드 및 렌더링
            const response = await spotifyClient.getPlaylistTracks(playlistId);
            
            if (trackRenderer) {
                trackRenderer.renderPlaylistTracks(response);
            }
            
            // 플레이리스트 상세 뷰 표시
            if (showViewCallback) {
                showViewCallback('playlist-detail');
            }
            
            this.logger.debug(`플레이리스트 ${playlist.name} 열기 완료`);
            return response;
        } catch (error) {
            this.logger.error('플레이리스트 열기 오류:', error);
            throw error;
        }
    }
    
    // 이벤트 리스너 설정
    setupEventListeners(openPlaylistCallback) {
        if (!openPlaylistCallback) return;
        
        // 사이드바 플레이리스트 링크에 이벤트 리스너 추가
        const playlistLinks = document.querySelectorAll('.playlist-link');
        playlistLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const playlistId = link.getAttribute('data-playlist-id');
                openPlaylistCallback(playlistId);
            });
        });
        
        // 그리드 플레이리스트 카드에 이벤트 리스너 추가
        const playlistCards = document.querySelectorAll('.playlist-card');
        playlistCards.forEach(card => {
            card.addEventListener('click', () => {
                const playlistId = card.getAttribute('data-playlist-id');
                openPlaylistCallback(playlistId);
            });
        });
        
        this.logger.debug('플레이리스트 이벤트 리스너 설정 완료');
    }
}