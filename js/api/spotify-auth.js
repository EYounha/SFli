/**
 * spotify-auth.js
 * 스포티파이 OAuth 인증 처리를 담당하는 모듈
 * 인증 흐름 및 토큰 관리 기능 포함
 */

/**
 * 스포티파이 인증 클래스
 * 토큰 관리 및 인증 흐름을 처리
 */
class SpotifyAuth {
    /**
     * 생성자 - 초기 상태 설정 및 토큰 확인
     */
    constructor() {
        // 인증 상태 초기화
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiration = null;
        this.isAuthenticated = false;

        // 페이지 로드 시 토큰 확인
        this.loadTokensFromStorage();
        // URL에서 인증 코드 확인
        this.checkAuthorizationResponse();
    }

    /**
     * 로컬 스토리지에서 토큰 불러오기
     */
    loadTokensFromStorage() {
        this.accessToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        this.refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        this.tokenExpiration = localStorage.getItem(AUTH_CONFIG.EXPIRATION_KEY);

        // 토큰 만료 확인
        if (this.accessToken && this.tokenExpiration) {
            const now = new Date().getTime();
            if (now > parseInt(this.tokenExpiration)) {
                // 토큰이 만료된 경우 갱신
                this.refreshAccessToken();
            } else {
                this.isAuthenticated = true;
                // 인증 상태 이벤트 발생
                this.dispatchAuthEvent(true);
            }
        }
    }

    /**
     * 로컬 스토리지에 토큰 저장
     * @param {string} accessToken - 액세스 토큰
     * @param {string} refreshToken - 리프레시 토큰
     * @param {number} expiresIn - 만료 시간(초)
     */
    saveTokensToStorage(accessToken, refreshToken, expiresIn) {
        const expirationTime = new Date().getTime() + (expiresIn * 1000);

        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, accessToken);
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(AUTH_CONFIG.EXPIRATION_KEY, expirationTime.toString());

        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiration = expirationTime.toString();
        this.isAuthenticated = true;
    }

    /**
     * 스포티파이 로그인 시작
     * 사용자를 스포티파이 인증 페이지로 리다이렉트
     */
    initiateLogin() {
        // 상태 매개변수 생성(CSRF 보호)
        const state = this.generateRandomString(16);
        localStorage.setItem(AUTH_CONFIG.STATE_KEY, state);

        // 인증 URL 구성
        const authUrl = new URL(AUTH_CONFIG.AUTH_ENDPOINT);
        const params = {
            client_id: AUTH_CONFIG.CLIENT_ID,
            response_type: 'code',
            redirect_uri: AUTH_CONFIG.REDIRECT_URI,
            state: state,
            scope: AUTH_CONFIG.SCOPES.join(' ')
        };

        // URL 파라미터 추가
        Object.keys(params).forEach(key =>
            authUrl.searchParams.append(key, params[key])
        );

        // 인증 페이지로 리다이렉트
        window.location.href = authUrl.toString();
    }

    /**
     * 랜덤 문자열 생성 (상태 매개변수용)
     * @param {number} length - 생성할 문자열 길이
     * @returns {string} 랜덤 문자열
     */
    generateRandomString(length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let text = '';

        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    /**
     * 인증 상태 변경 이벤트 발생
     * @param {boolean} isAuthenticated - 인증 성공 여부
     * @param {string} errorMessage - 오류 메시지 (있는 경우)
     */
    dispatchAuthEvent(isAuthenticated, errorMessage = null) {
        const authEvent = new CustomEvent('spotifyAuthStateChange', {
            detail: {
                isAuthenticated: isAuthenticated,
                error: errorMessage
            }
        });

        document.dispatchEvent(authEvent);
    }

    /**
     * 현재 액세스 토큰 반환
     * @returns {string} 액세스 토큰
     */
    getAccessToken() {
        return this.accessToken;
    }

    /**
     * 인증 상태 확인
     * @returns {boolean} 인증 여부
     */
    getAuthStatus() {
        return this.isAuthenticated;
    }
}

// 인스턴스 생성 및 전역으로 내보내기
window.spotifyAuth = new SpotifyAuth();