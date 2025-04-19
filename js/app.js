// app.js - 메인 애플리케이션 진입점
import SpotifyAuth from './api/spotify-auth.js';
import AppUI from './ui/app-ui.js';
import ProfileManager from './ui/profile-manager.js';
import Logger from './utils/logger.js';

// 앱 클래스 정의
class SFliApp {
    constructor() {
        this.auth = SpotifyAuth;
        this.ui = new AppUI();
        this.profileManager = new ProfileManager();
        this.logger = new Logger(this.auth.isDebugMode());
    }

    // 앱 초기화
    async init() {
        this.ui.showLoading();
        
        try {
            // 스포티파이 자격 증명 로드
            await this.auth.loadCredentials();
            
            // URL 파라미터 확인
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const storedState = localStorage.getItem('spotify_auth_state');
            
            // 인증 코드 처리
            if (code) {
                if (state === null || state !== storedState) {
                    this.ui.showError('인증 상태 불일치. 보안 문제가 발생했을 수 있습니다.');
                    return;
                }
                
                // 인증 코드로 토큰 요청
                await this.auth.getAccessToken(code);
                
                // URL에서 인증 코드 제거
                const debugParam = this.auth.isDebugMode() ? '?debug=true' : '';
                window.history.replaceState({}, document.title, window.location.pathname + debugParam);
                
                // 사용자 정보 로드
                this.loadUserProfile();
            } else if (this.auth.isLoggedIn()) {
                // 이미 로그인 된 상태 -> 사용자 정보 로드
                this.loadUserProfile();
            } else {
                // 로그인 화면 표시
                this.ui.showLogin();
            }
        } catch (error) {
            this.ui.showError('앱 초기화 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 로그인 처리
    handleLogin() {
        try {
            const authUrl = this.auth.getAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            this.ui.showError('로그인 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 로그아웃 처리
    handleLogout() {
        this.auth.logout();
        this.ui.showLogin();
    }

    // 사용자 프로필 정보 로드
    async loadUserProfile() {
        try {
            this.ui.showLoading();
            const profile = await this.profileManager.loadUserProfile();
            this.ui.showLoggedIn(profile);
        } catch (error) {
            // 토큰 오류면 다시 로그인 시도
            if (error.message.includes('토큰') || error.message.includes('인증')) {
                this.auth.logout();
                this.ui.showLogin();
            }
            
            this.ui.showError('사용자 정보를 가져오는데 실패했습니다: ' + error.message);
        }
    }
}

// 앱 인스턴스 생성
const app = new SFliApp();

// 이벤트 리스너 설정 및 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 로그인/로그아웃 버튼 이벤트 설정
    document.getElementById('login-button')?.addEventListener('click', () => app.handleLogin());
    document.getElementById('logout-button')?.addEventListener('click', () => app.handleLogout());
    
    // 앱 초기화
    app.init();
});