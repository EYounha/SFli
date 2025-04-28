// router.js - URL 라우팅 및 경로 처리
import SpotifyAuth from '../api/spotify-auth.js';
import Logger from './logger.js';

class Router {
    constructor(isDebugMode = false) {
        this.isDebugMode = isDebugMode;
        this.logger = new Logger(isDebugMode);
        this.auth = SpotifyAuth;
        this.routes = {
            '/login': this.showLoginPage.bind(this),
            '/SFli': this.showSFliPage.bind(this)
        };
    }

    // 초기화 및 현재 경로 처리
    init() {
        this.logger.debug('라우터 초기화...');
        
        // 현재 URL에서 경로 가져오기
        const currentPath = this.getCurrentPath();
        this.logger.debug('현재 경로:', currentPath);
        
        // 현재 경로에 따라 페이지 라우팅
        this.navigateToPath(currentPath);
    }

    // 현재 URL 경로 가져오기
    getCurrentPath() {
        const path = window.location.pathname;
        // 도메인 이후의 경로 부분을 추출
        const lastSlashIndex = path.lastIndexOf('/');
        
        // 경로의 마지막 부분이 파일명인 경우
        if (path.includes('.html')) {
            const filename = path.substring(lastSlashIndex + 1);
            if (filename === 'index.html') {
                return '/login';
            } else if (filename === 'SFli.html') {
                return '/SFli';
            }
        }
        
        // URL이 / 또는 빈 문자열로 끝날 경우 로그인 페이지로 연결
        if (path === '/' || path === '') {
            return '/login';
        }
        
        // 경로의 마지막 부분 반환
        const pathSegment = path.substring(lastSlashIndex);
        if (pathSegment === '/login' || pathSegment === '/SFli') {
            return pathSegment;
        }
        
        // 기본값은 로그인 페이지
        return '/login';
    }

    // 경로에 따라 페이지 이동
    navigateToPath(path) {
        this.logger.debug('경로로 이동:', path);
        
        if (this.routes[path]) {
            this.routes[path]();
        } else {
            // 경로가 존재하지 않으면 기본적으로 로그인 페이지로
            this.logger.warn('알 수 없는 경로:', path);
            this.showLoginPage();
        }
    }

    // 로그인 페이지 표시
    showLoginPage() {
        this.logger.debug('로그인 페이지 표시');
        
        // 이미 로그인 되어 있다면 SFli 페이지로 리디렉션
        if (this.auth.isLoggedIn()) {
            this.logger.info('이미 로그인되어 있어 SFli 페이지로 리디렉션');
            this.redirectToSFli();
            return;
        }
        
        // 현재 페이지가 이미 로그인 페이지가 아니라면 리디렉션
        if (!window.location.pathname.includes('index.html') && 
            !window.location.pathname.endsWith('/login')) {
            this.redirectToLogin();
            return;
        }
        
        // 이미 로그인 페이지에 있으면 아무것도 하지 않음
        this.logger.debug('이미 로그인 페이지에 있음');
    }

    // SFli 페이지 표시
    showSFliPage() {
        this.logger.debug('SFli 페이지 표시 요청');
        
        // 로그인 되어 있지 않으면 로그인 페이지로 리디렉션
        if (!this.auth.isLoggedIn()) {
            this.logger.warn('로그인 안됨 - 로그인 페이지로 리디렉션');
            this.redirectToLogin();
            return;
        }
        
        // 현재 페이지가 SFli가 아니라면 리디렉션
        if (!window.location.pathname.includes('SFli.html') && 
            !window.location.pathname.endsWith('/SFli')) {
            this.redirectToSFli();
            return;
        }
        
        // 이미 SFli 페이지에 있으면 아무것도 하지 않음
        this.logger.debug('이미 SFli 페이지에 있음');
    }

    // 로그인 페이지로 리디렉션
    redirectToLogin() {
        const debugParam = this.isDebugMode ? '?debug=true' : '';
        
        // 현재 경로와 호스트를 기반으로 로그인 페이지 URL 구성
        let redirectUrl;
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        
        if (basePath) {
            redirectUrl = `${window.location.origin}${basePath}index.html${debugParam}`;
        } else {
            redirectUrl = `${window.location.origin}/index.html${debugParam}`;
        }

        this.logger.debug('로그인 페이지로 리디렉션:', redirectUrl);
        window.location.href = redirectUrl;
    }

    // SFli 페이지로 리디렉션
    redirectToSFli() {
        const debugParam = this.isDebugMode ? '?debug=true' : '';
        
        // 현재 경로와 호스트를 기반으로 SFli 페이지 URL 구성
        let redirectUrl;
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        
        if (basePath) {
            redirectUrl = `${window.location.origin}${basePath}SFli.html${debugParam}`;
        } else {
            redirectUrl = `${window.location.origin}/SFli.html${debugParam}`;
        }
        
        this.logger.debug('SFli 페이지로 리디렉션:', redirectUrl);
        window.location.href = redirectUrl;
    }
    
    // 라우팅 처리 테스트 (디버깅용)
    testRouting() {
        this.logger.debug('라우팅 테스트...');
        this.logger.debug('- 현재 경로:', this.getCurrentPath());
        this.logger.debug('- 로그인 상태:', this.auth.isLoggedIn());
    }
}

export default Router;