// SFli 메인 페이지 스크립트
import SpotifyAuth from '../api/spotify-auth.js';
import SpotifyClient from '../api/spotify-client.js';
import Router from '../utils/router.js';
import Logger from '../utils/logger.js';
import MusicCollection from './music-collection.js';

// 메인 컴포넌트
class SfliPage {
    constructor() {
        this.currentView = 'dashboard';
        this.userProfile = null;
        this.likedTracks = [];
        this.playlists = [];
        this.currentPlaylist = null;
        this.isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
        this.logger = new Logger(this.isDebugMode);
        this.router = new Router(this.isDebugMode);
        this.musicCollection = null;
    }

    // 초기화
    async init() {
        this.logger.debug('SFli 페이지 초기화 중...');
        
        // 인증 상태 확인 - 로그인되어 있지 않으면 로그인 페이지로 리디렉션
        if (!await this.checkAuthentication()) {
            return; // 리디렉션 후 초기화 중단
        }
        
        // 로그아웃 버튼 이벤트 설정
        document.getElementById('logout-button').addEventListener('click', () => this.handleLogout());
        
        // 네비게이션 이벤트 설정
        this.setupNavigationEvents();
        
        // 사용자 프로필 로드
        await this.loadUserProfile();
        
        // 대시보드 데이터 로드
        this.loadDashboardData();
        
        // 플레이리스트 로드
        this.loadPlaylists();
        
        this.logger.info('SFli 페이지 초기화 완료');
    }

    // 인증 상태 확인
    async checkAuthentication() {
        try {
            this.logger.debug('인증 상태 확인 중...');
            const token = await SpotifyAuth.getValidAccessToken();
            
            if (!token) {
                this.logger.warn('유효한 토큰이 없음, 로그인 페이지로 리디렉션');
                this.router.redirectToLogin();
                return false;
            }
            
            this.logger.info('인증 토큰 유효함');
            return true;
        } catch (error) {
            this.logger.error('인증 체크 중 오류:', error);
            this.router.redirectToLogin();
            return false;
        }
    }

    // 로그아웃 처리
    handleLogout() {
        this.logger.debug('로그아웃 처리 중...');
        SpotifyAuth.logout();
        this.router.redirectToLogin();
    }

    // 네비게이션 이벤트 설정
    setupNavigationEvents() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetView = e.currentTarget.getAttribute('href').replace('#', '');
                this.showView(targetView);
                
                // 활성 링크 업데이트
                navLinks.forEach(l => l.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // 특정 뷰에 따른 데이터 로드
                if (targetView === 'liked') {
                    this.loadLikedTracks();
                } else if (targetView === 'playlists') {
                    this.loadPlaylistGrid();
                } else if (targetView === 'playlist-transfer') {
                    this.initPlaylistTransferView();
                }
            });
        });
        
        // 플레이리스트 뒤로가기 버튼
        document.getElementById('playlist-back-btn').addEventListener('click', () => {
            this.showView('playlists');
        });
    }

    // 뷰 전환
    showView(viewName) {
        this.currentView = viewName;
        const views = document.querySelectorAll('.view');
        views.forEach(view => {
            view.classList.remove('active');
        });
        
        document.getElementById(`${viewName}-view`).classList.add('active');
    }

    // 사용자 프로필 로드
    async loadUserProfile() {
        try {
            const token = await SpotifyAuth.getValidAccessToken();
            if (!token) {
                this.logger.warn('유효한 액세스 토큰이 없음, 로그인 페이지로 리디렉션');
                this.router.redirectToLogin();
                return;
            }
            
            this.userProfile = await SpotifyClient.getCurrentUserProfile();
            this.renderUserProfile();
        } catch (error) {
            this.logger.error('프로필 로드 중 오류:', error);
            this.router.redirectToLogin();
        }
    }

    // 사용자 프로필 렌더링
    renderUserProfile() {
        const profileContainer = document.getElementById('user-profile-mini');
        if (!profileContainer || !this.userProfile) return;
        
        // 프로필 이미지 URL 가져오기
        const imageUrl = this.userProfile.images && this.userProfile.images.length > 0 
            ? this.userProfile.images[0].url 
            : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"%3E%3C/path%3E%3C/svg%3E';
        
        profileContainer.innerHTML = `
            <img src="${imageUrl}" alt="${this.userProfile.display_name}" class="user-avatar">
            <span class="user-name">${this.userProfile.display_name}</span>
        `;
    }

    // 대시보드 데이터 로드
    async loadDashboardData() {
        try {
            // 최근 인기 트랙 로드
            const topTracks = await SpotifyClient.getTopTracks('short_term', 5);
            this.renderTopTracks(topTracks);
            
            // 최근 인기 아티스트 로드
            const topArtists = await SpotifyClient.getTopArtists('short_term', 5);
            this.renderTopArtists(topArtists);
        } catch (error) {
            console.error('대시보드 데이터 로드 중 오류:', error);
        }
    }

    // 최근 인기 트랙 렌더링
    renderTopTracks(topTracks) {
        const container = document.getElementById('top-tracks-list');
        if (!container || !topTracks.items) return;
        
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
    }
    
    // 최근 인기 아티스트 렌더링
    renderTopArtists(topArtists) {
        const container = document.getElementById('top-artists-list');
        if (!container || !topArtists.items) return;
        
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
    }
    
    // 플레이리스트 로드
    async loadPlaylists() {
        try {
            const playlists = await SpotifyClient.getUserPlaylists();
            this.playlists = playlists;
            this.renderPlaylists();
            this.loadPlaylistGrid();
        } catch (error) {
            console.error('플레이리스트 로드 중 오류:', error);
        }
    }
    
    // 사이드바에 플레이리스트 렌더링
    renderPlaylists() {
        const container = document.getElementById('playlists-list');
        if (!container || !this.playlists.items) return;
        
        // 로딩 표시 제거
        const loadingEl = document.querySelector('.playlists-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
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
            
            // 클릭 이벤트 추가
            const link = item.querySelector('.playlist-link');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.openPlaylist(playlist.id);
            });
            
            container.appendChild(item);
        });
    }
    
    // 그리드 형태로 플레이리스트 렌더링
    loadPlaylistGrid() {
        const container = document.getElementById('playlist-grid');
        if (!container || !this.playlists.items) return;
        
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
            
            // 클릭 이벤트 추가
            playlistCard.addEventListener('click', () => {
                this.openPlaylist(playlist.id);
            });
            
            container.appendChild(playlistCard);
        });
    }
    
    // 플레이리스트 열기
    async openPlaylist(playlistId) {
        try {
            // 현재 플레이리스트 찾기
            const playlist = this.playlists.items.find(p => p.id === playlistId);
            if (!playlist) return;
            
            this.currentPlaylist = playlist;
            
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
            document.getElementById('tracks-list').innerHTML = '<li class="loading-placeholder">트랙 로드 중...</li>';
            
            // 트랙 로드
            const response = await SpotifyClient.getPlaylistTracks(playlistId);
            this.renderPlaylistTracks(response);
            
            // 플레이리스트 상세 뷰 표시
            this.showView('playlist-detail');
            
        } catch (error) {
            console.error('플레이리스트 열기 오류:', error);
        }
    }
    
    // 플레이리스트 트랙 렌더링
    renderPlaylistTracks(response) {
        const container = document.getElementById('tracks-list');
        if (!container || !response.items) return;
        
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
    }
    
    // 좋아요 한 트랙 로드
    async loadLikedTracks() {
        try {
            const container = document.getElementById('liked-tracks-list');
            if (!container) return;
            
            // 이미 로드된 경우 스킵
            if (this.likedTracks.items && this.likedTracks.items.length > 0) return;
            
            // 로딩 중 표시
            container.innerHTML = '<li class="loading-placeholder">좋아요 표시한 곡 로드 중...</li>';
            
            // 좋아요 한 트랙 로드
            this.likedTracks = await SpotifyClient.getLikedTracks();
            this.renderLikedTracks();
        } catch (error) {
            console.error('좋아요 한 트랙 로드 중 오류:', error);
        }
    }
    
    // 좋아요 한 트랙 렌더링
    renderLikedTracks() {
        const container = document.getElementById('liked-tracks-list');
        if (!container || !this.likedTracks.items) return;
        
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
    }

    // 플레이리스트 이동 뷰 초기화
    async initPlaylistTransferView() {
        try {
            const container = document.getElementById('playlist-transfer-container');
            if (!container) return;
            
            // 로딩 상태 표시
            container.innerHTML = '<div class="loading-placeholder">플레이리스트 이동 기능 로드 중...</div>';
            
            // 아직 초기화되지 않은 경우만 초기화
            if (!this.musicCollection) {
                this.musicCollection = new MusicCollection();
                await this.musicCollection.init('playlist-transfer-container');
            } else {
                // 이미 초기화된 경우 컨테이너에 UI 다시 렌더링
                this.musicCollection.renderPlaylistSelector('playlist-transfer-container');
            }
        } catch (error) {
            this.logger.error('플레이리스트 이동 뷰 초기화 중 오류:', error);
            document.getElementById('playlist-transfer-container').innerHTML = 
                '<div class="error-message">플레이리스트 이동 기능을 로드하는 중 오류가 발생했습니다.</div>';
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    const sfliPage = new SfliPage();
    sfliPage.init();
});

export default SfliPage;