/**
 * config.js
 * 애플리케이션의 환경 설정 관련 변수를 관리하는 모듈
 */

import DEBUG_SPOTIFY_API_KEY from './debug_key.js';

/**
 * URL에서 파라미터 값을 가져오는 함수
 * @param {string} paramName - 가져올 파라미터 이름
 * @returns {string|null} 파라미터 값 또는 null
 */
function getUrlParam(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}

/**
 * 현재 환경이 GitHub Pages인지 확인
 * @returns {boolean} GitHub Pages 환경 여부
 */
function isGitHubPagesEnvironment() {
    return window.location.hostname === 'eyounha.github.io';
}

/**
 * 환경 변수에서 API 키를 가져오는 함수
 * 1. 디버그 모드일 때 debug_key.js에서 가져옴 (GitHub Pages 환경이 아닌 경우에만)
 * 2. 프로세스 환경 변수에서 확인 (GitHub Actions 등에서 사용)
 * 3. window.__env__ 객체에서 확인 (로컬 환경에서 env.js 통해 로드)
 * 4. 로컬 스토리지에서 확인 (사용자가 직접 입력한 경우)
 * @returns {string|null} API 키 또는 null
 */
function getApiKey() {
    // 디버그 모드 확인
    const isDebugMode = getUrlParam('debug') === 'true';
    const isGitHubPages = isGitHubPagesEnvironment();

    // GitHub Pages 환경이 아니고 디버그 모드일 때만 debug_key.js에서 키 사용
    if (!isGitHubPages && isDebugMode && DEBUG_SPOTIFY_API_KEY && DEBUG_SPOTIFY_API_KEY !== 'YOUR_SPOTIFY_CLIENT_ID_HERE') {
        return DEBUG_SPOTIFY_API_KEY;
    }

    // 브라우저 환경에서 window.__env__ 객체 확인 (env.js에서 설정)
    if (typeof window !== 'undefined' && window.__env__ && window.__env__.SPOTIFY_API_KEY) {
        return window.__env__.SPOTIFY_API_KEY;
    }

    // 로컬 스토리지에서 확인
    const storedApiKey = localStorage.getItem('spotify_api_key');
    if (storedApiKey) {
        return storedApiKey;
    }

    return null;
}

/**
 * API 키를 로컬 스토리지에 저장하는 함수
 * @param {string} apiKey - 저장할 API 키
 */
function saveApiKey(apiKey) {
    if (apiKey) {
        localStorage.setItem('spotify_api_key', apiKey);
    }
}

// URL에서 debug 파라미터 확인하여 디버그 모드 설정
const isDebugMode = getUrlParam('debug') === 'true';

/**
 * 애플리케이션 설정 객체
 */
const config = {
    // 디버그 모드 설정
    debug: {
        enabled: isDebugMode,

        /**
         * 디버그 로그를 출력하는 함수
         * @param {string} component - 로그를 출력하는 컴포넌트/모듈 이름
         * @param {string} message - 출력할 메시지
         * @param {any} data - 추가 데이터(선택 사항)
         */
        log(component, message, data) {
            if (!this.enabled) return;

            const timestamp = new Date().toISOString();
            const logPrefix = `[DEBUG][${timestamp}][${component}]`;

            if (data !== undefined) {
                console.log(`${logPrefix} ${message}`, data);
            } else {
                console.log(`${logPrefix} ${message}`);
            }
        },

        /**
         * 디버그 경고를 출력하는 함수
         * @param {string} component - 로그를 출력하는 컴포넌트/모듈 이름
         * @param {string} message - 출력할 메시지
         * @param {any} data - 추가 데이터(선택 사항)
         */
        warn(component, message, data) {
            if (!this.enabled) return;

            const timestamp = new Date().toISOString();
            const logPrefix = `[DEBUG][${timestamp}][${component}]`;

            if (data !== undefined) {
                console.warn(`${logPrefix} ${message}`, data);
            } else {
                console.warn(`${logPrefix} ${message}`);
            }
        },

        /**
         * 디버그 에러를 출력하는 함수
         * @param {string} component - 로그를 출력하는 컴포넌트/모듈 이름
         * @param {string} message - 출력할 메시지
         * @param {any} data - 추가 데이터(선택 사항)
         */
        error(component, message, data) {
            if (!this.enabled) return;

            const timestamp = new Date().toISOString();
            const logPrefix = `[DEBUG][${timestamp}][${component}]`;

            if (data !== undefined) {
                console.error(`${logPrefix} ${message}`, data);
            } else {
                console.error(`${logPrefix} ${message}`);
            }
        }
    },

    // 스포티파이 API 관련 설정
    spotify: {
        // API 키 (클라이언트 ID)
        clientId: getApiKey(),

        // 리디렉션 URI
        redirectUri: window.location.origin + window.location.pathname,

        // 권한 범위
        scopes: [
            'user-read-private',
            'user-read-email',
            'playlist-read-private',
            'playlist-read-collaborative',
            'playlist-modify-public',
            'playlist-modify-private'
        ]
    },

    // API 키가 설정되었는지 확인하는 함수
    isApiKeyConfigured() {
        return !!this.spotify.clientId;
    },

    // API 키를 업데이트하는 함수
    updateApiKey(apiKey) {
        this.spotify.clientId = apiKey;
        saveApiKey(apiKey);
    }
};

// 디버그 모드 시작 로그
if (isDebugMode) {
    config.debug.log('Config', '디버그 모드가 활성화되었습니다.');
    config.debug.log('Config', 'URL 파라미터:', window.location.search);
}

// 모듈 내보내기
export default config;