// sfli-page-core.js - SFli 페이지 코어 컴포넌트
import SpotifyAuth from '../api/spotify-auth.js';
import SpotifyClient from '../api/spotify-client.js';
import Router from '../utils/router.js';
import Logger from '../utils/logger.js';
import SfliDashboard from './sfli-page-dashboard.js';
import SfliPlaylists from './sfli-page-playlists.js';
import SfliTracks from './sfli-page-tracks.js';
import MusicCollection from './music-collection.js';

// 메인 컴포넌트
export default class SfliPage {
    constructor() {
        this.currentView = 'dashboard';
        this.userProfile = null;
        this.isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
        this.logger = new Logger(this.isDebugMode);
        this.router = new Router(this.isDebugMode);
        
        // 모듈 초기화
        this.dashboard = new SfliDashboard(this.logger);
        this.playlists = new SfliPlaylists(this.logger);
        this.tracks = new SfliTracks(this.logger);
        this.musicCollection = null;
        
        this.logger.info('SFli 페이지 인스턴스 생성됨');
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
        await this.dashboard.loadData(SpotifyClient);
        
        // 플레이리스트 로드
        await this.playlists.loadPlaylists(SpotifyClient);
        
        // 플레이리스트 이벤트 설정
        this.playlists.setupEventListeners((playlistId) => {
            this.playlists.openPlaylist(playlistId, SpotifyClient, 
                (view) => this.showView(view), this.tracks);
        });
        
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
                    this.tracks.loadLikedTracks(SpotifyClient);
                } else if (targetView === 'playlists') {
                    this.playlists.renderPlaylistGrid();
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