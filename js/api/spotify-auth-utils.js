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
    const origin = location.origin; // 'https://eyounha.github.io'
    const pathname = location.pathname; // '/SFli/index.html' 또는 '/SFli/'
    const hostname = location.hostname; // 'eyounha.github.io' 또는 'localhost'
    
    logger.debug('현재 URL 정보:', {
        origin,
        pathname,
        hostname,
        href: location.href
    });
    
    // GitHub Pages 환경인지 확인
    const isGitHubPages = hostname.includes('github.io');
    
    // EYounha의 GitHub Pages에 맞는 리디렉션 URI 생성
    if (isGitHubPages && hostname === 'eyounha.github.io') {
        // 이미 개발자 대시보드에 등록된 URI 사용
        if (pathname.startsWith('/SFli/')) {
            // https://eyounha.github.io/SFli/ 형식
            return 'https://eyounha.github.io/SFli/';
        } else {
            // https://eyounha.github.io/ 형식
            return 'https://eyounha.github.io/';
        }
    }
    
    // 로컬 개발 환경인 경우
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // index.html 또는 callback.html 확인
        if (pathname.includes('callback.html')) {
            return 'http://localhost:5500/callback.html';
        } else {
            return 'http://127.0.0.1:5500/index.html';
        }
    }
    
    // 기존 로직 (다른 환경을 위한 폴백)
    let basePath;
    if (pathname.includes('/')) {
        basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    } else {
        basePath = '/';
    }
    
    // 리디렉션 URI 구성
    let redirectUri = origin + basePath + 'callback.html';
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