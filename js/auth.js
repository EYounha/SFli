/**
 * auth.js
 * 스포티파이 API 인증 관련 기능을 처리하는 모듈
 */

import config from './config.js';
import { showToast } from './ui.js';

/**
 * 스포티파이 인증 페이지로 리디렉션하는 함수
 * OAuth 2.0 인증 흐름을 시작합니다.
 */
function authorize() {
    config.debug.log('Auth', '인증 프로세스 시작');
    
    // API 키가 설정되어 있는지 확인
    if (!config.isApiKeyConfigured()) {
        config.debug.error('Auth', 'API 키가 설정되지 않음');
        // API 키가 없을 경우 토스트 메시지로 안내
        showToast('스포티파이 API 키(클라이언트 ID)가 설정되지 않았습니다. 관리자에게 문의하세요.', 'error', 5000);
        return;
    }
    
    // 인증 URL 생성 및 리디렉션
    const { clientId, redirectUri, scopes } = config.spotify;
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}`;
    
    config.debug.log('Auth', '인증 URL로 리디렉션:', authUrl);
    window.location.href = authUrl;
}

/**
 * URL 해시에서 액세스 토큰을 추출하는 함수
 * @returns {string|null} 액세스 토큰 또는 null
 */
function getTokenFromUrl() {
    config.debug.log('Auth', 'URL 해시에서 토큰 추출 시도');
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get('access_token');
    
    if (token) {
        config.debug.log('Auth', '토큰 추출 성공');
    } else {
        config.debug.log('Auth', '토큰이 URL에 없음');
    }
    
    return token;
}

/**
 * 액세스 토큰을 로컬 스토리지에 저장하는 함수
 * @param {string} token - 저장할 액세스 토큰
 */
function saveToken(token) {
    config.debug.log('Auth', '토큰 저장');
    localStorage.setItem('spotify_access_token', token);
}

/**
 * 저장된 액세스 토큰을 가져오는 함수
 * @returns {string|null} 저장된 액세스 토큰 또는 null
 */
function getToken() {
    const token = localStorage.getItem('spotify_access_token');
    config.debug.log('Auth', '저장된 토큰 확인:', !!token);
    return token;
}

/**
 * 토큰을 제거하는 함수 (로그아웃 시 사용)
 */
function removeToken() {
    config.debug.log('Auth', '토큰 제거');
    localStorage.removeItem('spotify_access_token');
}

/**
 * 인증 상태를 확인하는 함수
 * @returns {boolean} 인증 여부
 */
function isAuthenticated() {
    const authenticated = !!getToken();
    config.debug.log('Auth', '인증 상태:', authenticated);
    return authenticated;
}

// 모듈 내보내기
export {
    authorize,
    getTokenFromUrl,
    saveToken,
    getToken,
    removeToken,
    isAuthenticated
};