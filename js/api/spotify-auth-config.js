/**
 * spotify-auth-config.js
 * 스포티파이 OAuth 인증에 필요한 설정값들을 관리하는 모듈
 */

// 스포티파이 API 관련 설정 상수
const AUTH_CONFIG = {
    // 개발자 포털에서 발급받은 클라이언트 ID (환경 변수에서 가져옴)
    CLIENT_ID: '%SPOTIFY_CLIENT_ID%',

    // 클라이언트 시크릿 (환경 변수에서 가져옴)
    CLIENT_SECRET: '%SPOTIFY_CLIENT_SECRET%',

    // 리다이렉트 URI (스포티파이 개발자 포털에 등록된 URI와 일치해야 함)
    REDIRECT_URI: '%SPOTIFY_REDIRECT_URI%',

    // 필요한 권한 범위 설정 (사용자 정보, 플레이리스트 접근 및 수정 권한)
    SCOPES: [
        'user-read-private',
        'user-read-email',
        'playlist-read-private',
        'playlist-read-collaborative',
        'playlist-modify-public',
        'playlist-modify-private'
    ],

    // 인증 관련 엔드포인트
    AUTH_ENDPOINT: 'https://accounts.spotify.com/authorize',
    TOKEN_ENDPOINT: 'https://accounts.spotify.com/api/token',

    // 로컬 스토리지 키 (토큰 저장용)
    TOKEN_KEY: 'spotify_access_token',
    REFRESH_TOKEN_KEY: 'spotify_refresh_token',
    EXPIRATION_KEY: 'spotify_token_expiration',
    STATE_KEY: 'spotify_auth_state'
};

// 다른 파일에서 사용할 수 있도록 내보내기
window.AUTH_CONFIG = AUTH_CONFIG;