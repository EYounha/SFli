// spotify-auth-utils.js - 스포티파이 인증 관련 유틸리티 함수들

import { logger, debugLog, isDebugMode } from './spotify-auth-config.js';

// 쿠키 설정 함수 추가
export function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
}

// 쿠키 읽기 함수 추가
export function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// GitHub Pages와 같은 서브디렉토리 환경에서도 올바른 리디렉션 URI 생성
export function getRedirectUri() {
    // 기본 URL 구조 분석
    const location = window.location;
    const origin = location.origin; // 'https://username.github.io'
    const pathname = location.pathname; // '/repository-name/SFli.html' 또는 '/SFli.html'
    const hostname = location.hostname; // 'username.github.io' 또는 'localhost'
    
    logger.debug('현재 URL 정보:', {
        origin,
        pathname,
        hostname,
        href: location.href
    });
    
    // GitHub Pages 환경인지 확인 (username.github.io 형식)
    const isGitHubPages = hostname.includes('github.io');
    
    // 현재 경로에서 파일 이름 제외하고 경로 추출
    let basePath;
    
    if (pathname.includes('/')) {
        // 마지막 '/'까지의 경로 추출 (파일명 제외)
        basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    } else {
        // '/'가 없는 경우 (루트 경로)
        basePath = '/';
    }
    
    // 리디렉션 URI 구성
    let redirectUri = origin + basePath + 'callback.html';
    
    // 만약 GitHub Pages이고 리포지토리 이름이 있는 경우 (username.github.io/repo-name)
    // 또는 개인 GitHub Pages (username.github.io)인 경우 처리
    if (isGitHubPages) {
        logger.debug('GitHub Pages 환경 감지됨', { basePath });
    }
    
    logger.debug('생성된 리디렉션 URI:', redirectUri);
    
    return redirectUri;
}

// 스포티파이 개발자 대시보드에 설정해야 할 정확한 리디렉션 URI 반환
export function getSpotifyDashboardRedirectUri() {
    const redirectUri = getRedirectUri();
    
    // 개발자에게 보여줄 메시지 로깅
    logger.info('===== 스포티파이 개발자 대시보드에 등록할 리디렉션 URI =====');
    logger.info(redirectUri);
    logger.info('위 URI를 스포티파이 개발자 대시보드에서 반드시 등록해야 합니다.');
    logger.info('===============================================');
    
    return redirectUri;
}

// 랜덤 문자열 생성 (state 용)
export function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    
    return text;
}

// 저장된 인증 상태 가져오기
export function getStoredAuthState() {
    // 여러 저장소에서 시도
    let localState, sessionState, cookieState;
    
    try {
        localState = localStorage.getItem('spotify_auth_state');
        sessionState = sessionStorage.getItem('spotify_auth_state');
        cookieState = getCookie('spotify_auth_state');
        
        logger.debug('저장된 인증 상태 확인:', {
            localStorage: localState,
            sessionStorage: sessionState,
            cookie: cookieState
        });
        
        // 어느 하나라도 있으면 반환 (localStorage 우선)
        return localState || sessionState || cookieState;
    } catch (e) {
        logger.error('인증 상태 읽기 중 오류:', e);
        return null;
    }
}