/**
 * config.js
 * 애플리케이션의 환경 설정 관련 변수를 관리하는 모듈
 */

/**
 * 환경 변수에서 API 키를 가져오는 함수
 * 1. 프로세스 환경 변수에서 확인 (GitHub Actions 등에서 사용)
 * 2. window.__env__ 객체에서 확인 (로컬 환경에서 env.js 통해 로드)
 * 3. 로컬 스토리지에서 확인 (사용자가 직접 입력한 경우)
 * @returns {string|null} API 키 또는 null
 */
function getApiKey() {
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

/**
 * 애플리케이션 설정 객체
 */
const config = {
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

// 모듈 내보내기
export default config;