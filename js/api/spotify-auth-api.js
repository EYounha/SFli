/**
 * spotify-auth-api.js
 * 스포티파이 API 인증 요청 처리를 담당하는 모듈
 * 토큰 교환 및 갱신 기능 구현
 */

// SpotifyAuth 프로토타입에 메서드 추가
SpotifyAuth.prototype.checkAuthorizationResponse = function () {
    // URL 파라미터 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem(AUTH_CONFIG.STATE_KEY);

    // URL에서 코드를 확인, 상태 검증 및 인증 코드 교환
    if (code && state && storedState === state) {
        // 상태 사용 후 제거 (보안)
        localStorage.removeItem(AUTH_CONFIG.STATE_KEY);

        // 인증 코드를 토큰으로 교환
        this.exchangeCodeForToken(code);

        // URL에서 코드 제거 (히스토리 관리 및 보안)
        const cleanUrl = window.location.origin +
            window.location.pathname +
            (window.location.hash || '');
        window.history.replaceState({}, document.title, cleanUrl);
    }
};

/**
 * 인증 코드를 토큰으로 교환
 * @param {string} code - 인증 코드
 */
SpotifyAuth.prototype.exchangeCodeForToken = async function (code) {
    try {
        // Basic 인증 헤더 생성 (클라이언트 ID와 시크릿을 Base64로 인코딩)
        const credentials = btoa(`${AUTH_CONFIG.CLIENT_ID}:${AUTH_CONFIG.CLIENT_SECRET}`);

        // 토큰 요청
        const tokenResponse = await fetch(AUTH_CONFIG.TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: AUTH_CONFIG.REDIRECT_URI
            })
        });

        // 응답 오류 처리
        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('토큰 교환 오류 상세:', errorData);
            throw new Error(`토큰 교환 실패: ${errorData.error}`);
        }

        // 응답 데이터 처리
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
};

/**
 * 만료된 액세스 토큰 갱신
 */
SpotifyAuth.prototype.refreshAccessToken = async function () {
    // 리프레시 토큰이 없으면 로그아웃
    if (!this.refreshToken) {
        this.logout();
        return;
    }

    try {
        // Basic 인증 헤더 생성
        const credentials = btoa(`${AUTH_CONFIG.CLIENT_ID}:${AUTH_CONFIG.CLIENT_SECRET}`);

        // 토큰 갱신 요청
        const refreshResponse = await fetch(AUTH_CONFIG.TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken
            })
        });

        // 응답 오류 처리
        if (!refreshResponse.ok) {
            const errorData = await refreshResponse.json();
            console.error('토큰 갱신 오류 상세:', errorData);
            throw new Error(`토큰 갱신 실패: ${errorData.error}`);
        }

        // 응답 데이터 처리
        const refreshData = await refreshResponse.json();

        // 갱신된 토큰 저장 (새 리프레시 토큰이 없으면 기존 것 유지)
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
};

/**
 * 로그아웃 처리
 */
SpotifyAuth.prototype.logout = function () {
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
};