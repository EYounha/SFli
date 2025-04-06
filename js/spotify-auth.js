/**
 * spotify-auth.js
 * 스포티파이 OAuth 인증 처리를 담당하는 모듈
 */

// 스포티파이 API 관련 상수
const AUTH_CONFIG = {
    // 개발자 포털에서 발급받은 클라이언트 ID
    CLIENT_ID: '여기에_클라이언트_ID_입력',
    // 리다이렉트 URI (스포티파이 개발자 포털에 등록된 URI와 일치해야 함)
    REDIRECT_URI: window.location.origin,
    // 필요한 권한 범위 설정
    SCOPES: [
        'user-read-private',
        'user-read-email',
        'playlist-read-private',
        'playlist-read-collaborative',
        'playlist-modify-public',
        'playlist-modify-private'
    ],
    // 인증 엔드포인트
    AUTH_ENDPOINT: 'https://accounts.spotify.com/authorize',
    // 토큰 엔드포인트
    TOKEN_ENDPOINT: 'https://accounts.spotify.com/api/token',
    // 로컬 스토리지 키
    TOKEN_KEY: 'spotify_access_token',
    REFRESH_TOKEN_KEY: 'spotify_refresh_token',
    EXPIRATION_KEY: 'spotify_token_expiration'
};

/**
 * 스포티파이 인증 클래스
 * 토큰 관리 및 인증 흐름을 처리
 */
class SpotifyAuth {
    constructor() {
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
     */
    initiateLogin() {
        // 상태 매개변수 생성(CSRF 보호)
        const state = this.generateRandomString(16);
        localStorage.setItem('spotify_auth_state', state);

        // 인증 URL 구성
        const authUrl = new URL(AUTH_CONFIG.AUTH_ENDPOINT);
        const params = {
            client_id: AUTH_CONFIG.CLIENT_ID,
            response_type: 'code',
            redirect_uri: AUTH_CONFIG.REDIRECT_URI,
            state: state,
            scope: AUTH_CONFIG.SCOPES.join(' ')
        };

        Object.keys(params).forEach(key =>
            authUrl.searchParams.append(key, params[key])
        );

        // 인증 페이지로 리다이렉트
        window.location.href = authUrl.toString();
    }

    /**
     * 랜덤 문자열 생성 (상태 매개변수용)
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
     * URL에서 인증 응답 확인 및 처리
     */
    checkAuthorizationResponse() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = localStorage.getItem('spotify_auth_state');

        // URL에서 코드를 확인, 상태 검증 및 인증 코드 교환
        if (code && state && storedState === state) {
            // 상태 사용 후 제거
            localStorage.removeItem('spotify_auth_state');

            // 인증 코드를 토큰으로 교환
            this.exchangeCodeForToken(code);

            // URL에서 코드 제거 (히스토리 관리)
            const cleanUrl = window.location.origin +
                window.location.pathname +
                (window.location.hash || '');
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    /**
     * 인증 코드를 토큰으로 교환
     */
    async exchangeCodeForToken(code) {
        try {
            const tokenResponse = await fetch(AUTH_CONFIG.TOKEN_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: AUTH_CONFIG.REDIRECT_URI,
                    client_id: AUTH_CONFIG.CLIENT_ID
                })
            });

            if (!tokenResponse.ok) {
                throw new Error('토큰 교환 실패');
            }

            const tokenData = await tokenResponse.json();

            // 토큰 저장 및 상태 업데이트
            this.saveTokensToStorage(
                tokenData.access_token,
                tokenData.refresh_token,
                tokenData.expires_in
            );

            // 인증 상태 이벤트 발생
            this.dispatchAuthEvent(true);

        } catch (error) {
            console.error('인증 코드 교환 중 오류 발생:', error);
            this.dispatchAuthEvent(false, error.message);
        }
    }

    /**
     * 만료된 액세스 토큰 갱신
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            this.logout();
            return;
        }

        try {
            const refreshResponse = await fetch(AUTH_CONFIG.TOKEN_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken,
                    client_id: AUTH_CONFIG.CLIENT_ID
                })
            });

            if (!refreshResponse.ok) {
                throw new Error('토큰 갱신 실패');
            }

            const refreshData = await refreshResponse.json();

            // 갱신된 토큰 저장
            const newRefreshToken = refreshData.refresh_token || this.refreshToken;
            this.saveTokensToStorage(
                refreshData.access_token,
                newRefreshToken,
                refreshData.expires_in
            );

            // 인증 상태 이벤트 발생
            this.dispatchAuthEvent(true);

        } catch (error) {
            console.error('토큰 갱신 중 오류 발생:', error);
            this.logout();
        }
    }

    /**
     * 로그아웃 처리
     */
    logout() {
        // 로컬 스토리지에서 토큰 제거
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.EXPIRATION_KEY);

        // 인증 상태 초기화
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiration = null;
        this.isAuthenticated = false;

        // 인증 상태 이벤트 발생
        this.dispatchAuthEvent(false);
    }

    /**
     * 인증 상태 변경 이벤트 발생
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
     */
    getAccessToken() {
        return this.accessToken;
    }

    /**
     * 인증 상태 확인
     */
    getAuthStatus() {
        return this.isAuthenticated;
    }
}

// 인스턴스 생성 및 내보내기
const spotifyAuth = new SpotifyAuth();