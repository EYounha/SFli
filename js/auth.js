/**
 * auth.js
 * 스포티파이 API 인증 관련 기능을 처리하는 모듈
 */

import config from './config.js';
import { showToast } from './ui.js';

/**
 * 디버그 로그 출력 헬퍼 함수 (config 객체를 사용할 수 없는 경우 대비)
 * @param {string} message - 로그 메시지
 * @param {any} data - 추가 데이터(선택 사항)
 */
function debugLog(message, data) {
    const urlParams = new URLSearchParams(window.location.search);
    const isDebug = urlParams.get('debug') === 'true';

    if (isDebug) {
        const prefix = '[DEBUG][Auth]';
        if (data !== undefined) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    }
}

/**
 * 스포티파이 인증 페이지로 리디렉션하는 함수
 * OAuth 2.0 인증 흐름을 시작합니다.
 */
function authorize() {
    // 안전하게 config 객체 사용을 시도하고, 없으면 fallback 로깅 사용
    try {
        config.debug.log('Auth', '인증 프로세스 시작');
    } catch (e) {
        debugLog('인증 프로세스 시작');
    }

    try {
        // API 키가 설정되어 있는지 확인
        const apiKey = getApiKey();

        if (!apiKey) {
            debugLog('API 키가 설정되지 않음');
            // 안전하게 UI 함수 호출
            try {
                showToast('스포티파이 API 키(클라이언트 ID)가 설정되지 않았습니다. 관리자에게 문의하세요.', 'error', 5000);
            } catch (e) {
                alert('스포티파이 API 키가 설정되지 않았습니다. 관리자에게 문의하세요.');
            }
            return;
        }

        // 리디렉션 URI 및 스코프 설정
        const redirectUri = window.location.origin + window.location.pathname;
        const scopes = [
            'user-read-private',
            'user-read-email',
            'playlist-read-private',
            'playlist-read-collaborative',
            'playlist-modify-public',
            'playlist-modify-private'
        ];

        // 인증 URL 생성 및 리디렉션
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${apiKey}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}`;

        debugLog('인증 URL로 리디렉션:', authUrl);
        window.location.href = authUrl;

    } catch (error) {
        debugLog('인증 프로세스 오류:', error);
        console.error('인증 프로세스 오류:', error);
    }
}

/**
 * 현재 환경이 GitHub Pages인지 확인
 * @returns {boolean} GitHub Pages 환경 여부
 */
function isGitHubPagesEnvironment() {
    return window.location.hostname === 'eyounha.github.io';
}

/**
 * API 키(클라이언트 ID)를 가져오는 함수
 * 여러 소스에서 확인 (debug_key, config, env, 로컬 스토리지)
 * @returns {string|null} API 키 또는 null
 */
function getApiKey() {
    // GitHub Pages 환경에서는 debug_key.js를 사용하지 않음
    if (isGitHubPagesEnvironment()) {
        debugLog('GitHub Pages 환경 감지: debug_key.js 사용 안함');
    } else {
        // 디버그 모드일 때 debug_key.js에서 API 키 사용
        const urlParams = new URLSearchParams(window.location.search);
        const isDebug = urlParams.get('debug') === 'true';

        if (isDebug && window.DEBUG_SPOTIFY_API_KEY && window.DEBUG_SPOTIFY_API_KEY !== 'YOUR_ACTUAL_SPOTIFY_CLIENT_ID') {
            debugLog('debug_key.js에서 API 키 사용');
            return window.DEBUG_SPOTIFY_API_KEY;
        }
    }

    // config 객체에서 시도
    try {
        if (config && config.spotify && config.spotify.clientId) {
            return config.spotify.clientId;
        }
    } catch (e) {
        debugLog('config에서 API 키를 가져오는 중 오류 발생');
    }

    // window.__env__ 객체에서 확인
    try {
        if (window.__env__ && window.__env__.SPOTIFY_API_KEY) {
            const key = window.__env__.SPOTIFY_API_KEY;
            if (key !== '%SPOTIFY_API_KEY%') { // 치환되지 않은 플레이스홀더 감지
                return key;
            }
        }
    } catch (e) {
        debugLog('env에서 API 키를 가져오는 중 오류 발생');
    }

    // 로컬 스토리지에서 확인
    try {
        return localStorage.getItem('spotify_api_key');
    } catch (e) {
        debugLog('로컬 스토리지에서 API 키를 가져오는 중 오류 발생');
    }

    return null;
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