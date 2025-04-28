// spotify-auth-config.js - 스포티파이 인증 관련 설정 및 상수

// API 설정
export const SPOTIFY_CONFIG = {
    CLIENT_ID: '%SPOTIFY_CLIENT_ID%',
    CLIENT_SECRET: '%SPOTIFY_CLIENT_SECRET%',
    REDIRECT_URI: '', // 동적으로 설정될 예정
    AUTH_ENDPOINT: 'https://accounts.spotify.com/authorize',
    TOKEN_ENDPOINT: 'https://accounts.spotify.com/api/token',
    SCOPES: [
        'user-read-private',
        'user-read-email',
        'user-top-read',
        'user-library-read',
        'playlist-read-private',
        'user-read-recently-played'
    ]
};

// 스토리지 키 상수 정의 - callback-handler.js와 일관성 유지
export const STORAGE_KEYS = {
    AUTH_STATE: 'spotify_auth_state',
    AUTH_CODE: 'spotify_auth_code',
    TOKEN_DATA: 'spotify_token_data',
    IS_AUTHENTICATED: 'is_authenticated'
};

// 로거 생성 (앱이 로드되기 전에는 로거가 없으므로 기본 콘솔 사용)
export let logger = {
    debug: (...args) => console.log('[SFli Debug]', ...args),
    info: (...args) => console.info('[SFli]', ...args),
    warn: (...args) => console.warn('[SFli Warning]', ...args),
    error: (...args) => console.error('[SFli Error]', ...args)
};

// 로거 설정 함수
export function setLogger(loggerInstance) {
    logger = loggerInstance;
}

// 디버그 모드 확인
export function isDebugMode() {
    return new URLSearchParams(window.location.search).get('debug') === 'true';
}

// 로그 출력 (디버그 모드일 때만)
export function debugLog(...args) {
    if (isDebugMode()) {
        logger.debug(...args);
    }
}