// app.js - 메인 애플리케이션 진입점
import SpotifyAuth from './api/spotify-auth.js';
import AppUI from './ui/app-ui.js';
import ProfileManager from './ui/profile-manager.js';
import Logger from './utils/logger.js';
import Router from './utils/router.js';

// 앱 클래스 정의
class SFliApp {
    constructor() {
        // 디버그 모드 확인 (URL 파라미터에서)
        this.isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
        
        // 로거 초기화
        this.logger = new Logger(this.isDebugMode);
        
        // 로거 인스턴스 설정
        this.auth = SpotifyAuth;
        this.auth.setLogger(this.logger);
        
        // 라우터 초기화
        this.router = new Router(this.isDebugMode);
        
        this.ui = new AppUI();
        this.profileManager = new ProfileManager();
        
        // 디버그 모드면 디버그 패널 초기화 및 표시
        if (this.isDebugMode) {
            this.initDebugPanel();
        }
        
        this.logger.info('SFli 앱 생성됨, 디버그 모드:', this.isDebugMode);
    }

    // 디버그 패널 초기화 및 설정
    initDebugPanel() {
        const debugPanel = document.getElementById('debug-panel');
        if (!debugPanel) return;
        
        // 디버그 패널을 항상 표시되도록 설정
        debugPanel.style.display = 'block';
        debugPanel.style.position = 'fixed';
        debugPanel.style.zIndex = '9999';
        
        // 페이지 전환 시에도 디버그 패널이 계속 보이도록 z-index 및 포지션 조정
        const sections = ['login-section', 'loading-section', 'logged-in-section'];
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                section.style.zIndex = '1'; // 디버그 패널보다 낮은 z-index
            }
        });
        
        // 토글 버튼이 없으면 추가
        if (!document.querySelector('.debug-toggle-btn')) {
            const toggleButton = document.createElement('button');
            toggleButton.textContent = '접기/펼치기';
            toggleButton.className = 'debug-toggle-btn';
            toggleButton.onclick = () => this.toggleDebugContent();
            
            const debugTitle = debugPanel.querySelector('h3') || debugPanel.firstChild;
            if (debugTitle) {
                debugTitle.appendChild(toggleButton);
            } else {
                debugPanel.prepend(toggleButton);
            }
        }
        
        this.logger.debug('디버그 패널 초기화 완료');
    }
    
    // 디버그 패널 내용 토글
    toggleDebugContent() {
        const debugLog = document.getElementById('debug-log');
        if (debugLog) {
            const isHidden = debugLog.style.display === 'none';
            debugLog.style.display = isHidden ? 'block' : 'none';
            this.logger.debug('디버그 로그 표시 상태:', isHidden ? '표시됨' : '숨겨짐');
        }
    }

    // 앱 초기화
    async init() {
        this.ui.showLoading();
        this.logger.debug('앱 초기화 시작');
        
        try {
            // 스포티파이 자격 증명 로드
            this.logger.debug('스포티파이 자격 증명 로드 중...');
            await this.auth.loadCredentials();
            
            // 이 경로가 callback 페이지가 아닌지 확인 (중복 처리 방지)
            const isCallbackPage = window.location.pathname.includes('callback.html');
            if (isCallbackPage) {
                // callback.html에서 처리하므로 여기서는 처리하지 않음
                this.logger.debug('콜백 페이지 감지됨, 처리는 callback-handler.js에서 수행');
                return;
            }
            
            // URL 파라미터 확인 - SFli.html이나 index.html에서 직접 code 파라미터 처리 (비정상적인 경우)
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            
            // 로그인 상태 확인 - 이미 로그인되어 있는지
            if (this.auth.isLoggedIn()) {
                // 이미 로그인된 상태
                const currentPath = this.router.getCurrentPath();
                
                this.logger.debug('로그인 상태 확인: 로그인됨, 현재 경로:', currentPath);
                
                if (currentPath === '/' || currentPath === '/index' || currentPath === '/login') {
                    // 로그인된 상태에서 인덱스/로그인 페이지에 있다면 SFli 페이지로 리디렉션
                    this.logger.info('로그인 상태에서 인덱스 페이지 접근, SFli 페이지로 이동');
                    this.router.redirectToSFli();
                } else {
                    // SFli 페이지 등 올바른 페이지에 있다면 사용자 정보 로드
                    this.logger.info('로그인 상태 확인됨, 사용자 정보 로드 중...');
                    await this.loadUserProfile();
                }
            } else {
                // 로그인되지 않은 상태
                this.logger.debug('로그인 상태 확인: 미로그인');
                
                if (code) {
                    // 직접 인증 코드를 받은 경우 (비정상적인 경로지만 처리)
                    this.logger.warn('직접 인증 코드 수신됨, 처리 시도...');
                    await this.processAuthCode(code);
                } else {
                    // 로그인 필요 상태 처리
                    const currentPath = this.router.getCurrentPath();
                    
                    if (currentPath === '/SFli') {
                        // SFli 페이지 접근 시 로그인 필요하면 로그인 페이지로
                        this.logger.warn('SFli 페이지 접근 시도, 로그인 필요');
                        this.router.redirectToLogin();
                    } else {
                        // 로그인 페이지 등 다른 페이지면 로그인 화면 표시
                        this.logger.info('로그인 필요, 로그인 화면 표시');
                        this.ui.showLogin();
                    }
                }
            }
        } catch (error) {
            this.logger.error('앱 초기화 중 오류:', error);
            this.ui.showError('앱 초기화 중 오류가 발생했습니다: ' + error.message);
        }
    }
    
    // 인증 코드 처리 (비정상 경로지만 대응)
    async processAuthCode(code) {
        try {
            this.logger.debug('인증 코드 처리 시작...');
            
            // 토큰 요청
            await this.auth.getAccessToken(code);
            
            // URL 정리
            const debugParam = this.isDebugMode ? '?debug=true' : '';
            window.history.replaceState({}, document.title, window.location.pathname + debugParam);
            
            // 사용자 정보 로드 후 SFli 페이지로 이동
            await this.loadUserProfile();
            
            return true;
        } catch (error) {
            this.logger.error('인증 코드 처리 중 오류:', error);
            this.ui.showError('인증 처리 중 오류가 발생했습니다: ' + error.message);
            return false;
        }
    }

    // 로그인 처리
    handleLogin() {
        try {
            this.logger.debug('로그인 처리 시작');
            
            // 이미 로그인 되어 있으면 SFli 페이지로 이동
            if (this.auth.isLoggedIn()) {
                this.logger.info('이미 로그인된 상태, SFli 페이지로 이동');
                this.router.redirectToSFli();
                return;
            }
            
            const authUrl = this.auth.getAuthUrl();
            
            // 디버그 모드면 쿼리 파라미터 유지
            if (this.isDebugMode) {
                const urlObj = new URL(authUrl);
                urlObj.searchParams.append('debug', 'true');
                this.logger.debug('디버그 모드 파라미터 추가된 인증 URL:', urlObj.toString());
                window.location.href = urlObj.toString();
            } else {
                this.logger.debug('인증 URL로 이동:', authUrl);
                window.location.href = authUrl;
            }
        } catch (error) {
            this.logger.error('로그인 중 오류:', error);
            this.ui.showError('로그인 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 로그아웃 처리
    handleLogout() {
        this.logger.debug('로그아웃 처리 시작');
        this.auth.logout();
        
        // 디버그 모드일 때 디버그 파라미터 유지
        const debugParam = this.isDebugMode ? '?debug=true' : '';
        
        // 로그인 페이지로 이동 (리다이렉션)
        const loginUrl = `${window.location.origin}/index.html${debugParam}`;
        this.logger.debug('로그아웃 후 이동:', loginUrl);
        window.location.href = loginUrl;
        
        this.logger.info('로그아웃 완료');
    }

    // 사용자 프로필 정보 로드
    async loadUserProfile() {
        this.logger.debug('사용자 프로필 로드 시작');
        this.ui.showLoading();
        
        try {
            // 토큰 유효성 확인
            const token = await this.auth.getValidAccessToken();
            if (!token) {
                this.logger.warn('유효한 액세스 토큰이 없음, 로그아웃 처리');
                this.auth.logout();
                this.router.redirectToLogin();
                throw new Error('유효한 인증 토큰이 없습니다. 다시 로그인해주세요.');
            }
            
            // 프로필 매니저에 토큰 설정
            this.profileManager.setToken(token);
            
            // 사용자 프로필 로드
            this.logger.debug('프로필 정보 요청 중...');
            const profile = await this.profileManager.loadUserProfile();
            
            if (!profile || !profile.id) {
                this.logger.error('프로필 정보 로드 실패');
                throw new Error('사용자 프로필 정보를 가져올 수 없습니다.');
            }
            
            this.logger.info('사용자 프로필 로드 완료:', {
                id: profile.id,
                display_name: profile.display_name || '사용자'
            });
            
            // UI 업데이트 - 로그인된 화면 표시
            this.ui.showLoggedIn(profile);
            
            return profile;
        } catch (error) {
            this.logger.error('프로필 로드 중 오류:', error);
            
            // 인증 관련 오류인 경우 로그아웃 처리
            if (error.message.includes('토큰') || error.message.includes('인증') || 
                error.message.includes('401') || error.message.includes('403')) {
                this.logger.warn('인증 관련 오류 감지, 로그아웃 처리');
                this.auth.logout();
                this.router.redirectToLogin();
                this.ui.showError('인증이 만료되었습니다. 다시 로그인해주세요.');
            } else {
                this.ui.showError('사용자 정보를 가져오는데 실패했습니다: ' + error.message);
            }
            
            return null;
        }
    }
    
    // 앱 상태 확인 (디버깅용)
    checkAppState() {
        this.logger.debug('앱 상태 확인:');
        this.logger.debug('- 디버그 모드:', this.isDebugMode);
        this.logger.debug('- 로그인 상태:', this.auth.isLoggedIn());
        
        // 로컬 스토리지 상태 확인
        const tokenData = localStorage.getItem('spotify_token_data');
        const authState = localStorage.getItem('spotify_auth_state');
        
        this.logger.debug('- 로컬 스토리지:', {
            'spotify_token_data': tokenData ? '있음' : '없음',
            'spotify_auth_state': authState ? '있음' : '없음'
        });
    }
}

// 앱 인스턴스 생성
const app = new SFliApp();

// 전역 오류 핸들러 설정
window.onerror = function(message, source, lineno, colno, error) {
    console.error('전역 오류 발생:', {message, source, lineno, colno, error});
    
    if (app && app.logger) {
        app.logger.error('전역 JS 오류:', message, source, lineno, colno);
    }
    
    // 오류를 더 처리하려면 false를 반환, 
    // 기본 처리를 유지하려면 true를 반환
    return false;
};

// 이벤트 리스너 설정 및 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 로그인/로그아웃 버튼 이벤트 설정
    document.getElementById('login-button')?.addEventListener('click', () => app.handleLogin());
    document.getElementById('logout-button')?.addEventListener('click', () => app.handleLogout());
    
    // 앱 상태 체크 (디버깅용)
    app.checkAppState();
    
    // 앱 초기화
    app.init();
});