// 스포티파이 인증 처리 모듈

// API 설정
let SPOTIFY_CONFIG = {
    CLIENT_ID: '%SPOTIFY_CLIENT_ID%',
    CLIENT_SECRET: '%SPOTIFY_CLIENT_SECRET%',
    REDIRECT_URI: '%SPOTIFY_REDIRECT_URI%',
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

// 디버그 키 로드 (로컬 개발 환경인 경우)
async function loadCredentials() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
            const debugCredentials = await import('/debug_key.js');
            SPOTIFY_CONFIG.CLIENT_ID = debugCredentials.default.CLIENT_ID;
            SPOTIFY_CONFIG.CLIENT_SECRET = debugCredentials.default.CLIENT_SECRET;
            SPOTIFY_CONFIG.REDIRECT_URI = debugCredentials.default.REDIRECT_URI;
            if (isDebugMode()) {
                console.log('로컬 환경에서 스포티파이 API 키 로드됨');
            }
        } catch (error) {
            console.error('debug_key.js 파일을 로드할 수 없습니다:', error);
        }
    }
}

// 디버그 모드 확인
function isDebugMode() {
    return new URLSearchParams(window.location.search).get('debug') === 'true';
}

// 로그 출력 (디버그 모드일 때만)
function debugLog(...args) {
    if (isDebugMode()) {
        console.log('[SFli Debug]', ...args);
    }
}

// 인증 URL 생성
function getAuthUrl() {
    const state = generateRandomString(16);
    localStorage.setItem('spotify_auth_state', state);
    
    const params = new URLSearchParams({
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        response_type: 'code',
        redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
        state: state,
        scope: SPOTIFY_CONFIG.SCOPES.join(' ')
    });
    
    return `${SPOTIFY_CONFIG.AUTH_ENDPOINT}?${params.toString()}`;
}

// 랜덤 문자열 생성 (state 용)
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    
    return text;
}

// 인증 코드로 액세스 토큰 요청
async function getAccessToken(code) {
    debugLog('인증 코드로 액세스 토큰 요청 중...');
    
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        client_secret: SPOTIFY_CONFIG.CLIENT_SECRET
    });
    
    try {
        const response = await fetch(SPOTIFY_CONFIG.TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        debugLog('토큰 응답 받음', data);
        
        // 토큰 저장
        saveTokenData(data);
        
        return data;
    } catch (error) {
        debugLog('토큰 요청 오류:', error);
        throw error;
    }
}

// 토큰 데이터 로컬 스토리지에 저장
function saveTokenData(data) {
    const tokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000)
    };
    
    localStorage.setItem('spotify_token_data', JSON.stringify(tokenData));
    debugLog('토큰 데이터 저장됨');
}

// 저장된 토큰 데이터 가져오기
function getTokenData() {
    const tokenString = localStorage.getItem('spotify_token_data');
    if (!tokenString) return null;
    
    try {
        return JSON.parse(tokenString);
    } catch (e) {
        debugLog('토큰 데이터 파싱 오류:', e);
        return null;
    }
}

// 토큰이 만료됐는지 확인
function isTokenExpired() {
    const tokenData = getTokenData();
    if (!tokenData) return true;
    
    // 토큰 만료 5분 전에 미리 갱신하도록 설정
    return Date.now() > (tokenData.expires_at - 5 * 60 * 1000);
}

// 리프레시 토큰으로 액세스 토큰 갱신
async function refreshAccessToken() {
    const tokenData = getTokenData();
    if (!tokenData || !tokenData.refresh_token) {
        debugLog('리프레시 토큰이 없습니다.');
        return null;
    }
    
    debugLog('액세스 토큰 갱신 중...');
    
    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        client_secret: SPOTIFY_CONFIG.CLIENT_SECRET
    });
    
    try {
        const response = await fetch(SPOTIFY_CONFIG.TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        debugLog('토큰 갱신됨');
        
        // 새 액세스 토큰 저장 (리프레시 토큰은 같이 안 올 수도 있음)
        const newTokenData = {
            access_token: data.access_token,
            refresh_token: data.refresh_token || tokenData.refresh_token,
            expires_at: Date.now() + (data.expires_in * 1000)
        };
        
        localStorage.setItem('spotify_token_data', JSON.stringify(newTokenData));
        
        return data;
    } catch (error) {
        debugLog('토큰 갱신 오류:', error);
        throw error;
    }
}

// 유효한 액세스 토큰 가져오기 (필요시 갱신)
async function getValidAccessToken() {
    if (isTokenExpired()) {
        debugLog('토큰이 만료되었거나 만료 예정입니다. 갱신 시도...');
        try {
            await refreshAccessToken();
        } catch (error) {
            debugLog('토큰 갱신 실패, 인증이 필요합니다');
            return null;
        }
    }
    
    const tokenData = getTokenData();
    return tokenData ? tokenData.access_token : null;
}

// 로그인 상태 확인
function isLoggedIn() {
    return !!getTokenData();
}

// 로그아웃 (토큰 삭제)
function logout() {
    localStorage.removeItem('spotify_token_data');
    localStorage.removeItem('spotify_auth_state');
    debugLog('로그아웃됨');
}

// 모듈 내보내기
export default {
    loadCredentials,
    getAuthUrl,
    getAccessToken,
    getValidAccessToken,
    isLoggedIn,
    logout,
    isDebugMode,
    debugLog
};