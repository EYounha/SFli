// 스포티파이 인증 처리 모듈

// API 설정
let SPOTIFY_CONFIG = {
    CLIENT_ID: '%SPOTIFY_CLIENT_ID%',
    CLIENT_SECRET: '%SPOTIFY_CLIENT_SECRET%',
    REDIRECT_URI: window.location.origin + '/callback.html', // 동적 URL 생성
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
const STORAGE_KEYS = {
    AUTH_STATE: 'spotify_auth_state',
    AUTH_CODE: 'spotify_auth_code',
    TOKEN_DATA: 'spotify_token_data',
    IS_AUTHENTICATED: 'is_authenticated'
};

// 로거 생성 (앱이 로드되기 전에는 로거가 없으므로 기본 콘솔 사용)
let logger = {
    debug: (...args) => console.log('[SFli Debug]', ...args),
    info: (...args) => console.info('[SFli]', ...args),
    warn: (...args) => console.warn('[SFli Warning]', ...args),
    error: (...args) => console.error('[SFli Error]', ...args)
};

// 로거 설정 함수
function setLogger(loggerInstance) {
    logger = loggerInstance;
}

// 디버그 모드 확인
function isDebugMode() {
    return new URLSearchParams(window.location.search).get('debug') === 'true';
}

// 로그 출력 (디버그 모드일 때만)
function debugLog(...args) {
    if (isDebugMode()) {
        logger.debug(...args);
    }
}

// 쿠키 설정 함수 추가
function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
}

// 쿠키 읽기 함수 추가
function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// 디버그 키 로드 (로컬 개발 환경인 경우)
async function loadCredentials() {
    try {
        logger.debug('자격 증명 로드 시작');
        
        // 동적 리디렉션 URI 설정
        SPOTIFY_CONFIG.REDIRECT_URI = window.location.origin + '/callback.html';
        logger.debug('리디렉션 URI 설정:', SPOTIFY_CONFIG.REDIRECT_URI);
        
        // 현재 호스트 확인
        const currentHost = window.location.hostname;
        
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            try {
                logger.debug('로컬 환경 감지됨, 디버그 키 로드 시도...');
                
                const debugCredentials = await import('../../debug_key.js')
                    .catch(e => {
                        logger.error('debug_key.js 로드 실패:', e);
                        throw new Error('디버그 키 파일을 로드할 수 없습니다. 파일이 루트 디렉토리에 있는지 확인하세요.');
                    });
                
                if (debugCredentials.default) {
                    logger.debug('디버그 키 로드됨');
                    
                    SPOTIFY_CONFIG.CLIENT_ID = debugCredentials.default.CLIENT_ID || SPOTIFY_CONFIG.CLIENT_ID;
                    SPOTIFY_CONFIG.CLIENT_SECRET = debugCredentials.default.CLIENT_SECRET || SPOTIFY_CONFIG.CLIENT_SECRET;
                    
                    // 로컬 환경에서 디버그 키의 REDIRECT_URI 사용
                    if (debugCredentials.default.REDIRECT_URI) {
                        SPOTIFY_CONFIG.REDIRECT_URI = debugCredentials.default.REDIRECT_URI;
                        logger.debug('커스텀 리디렉션 URI 사용:', SPOTIFY_CONFIG.REDIRECT_URI);
                    }
                }
            } catch (error) {
                logger.error('디버그 키 로드 중 오류:', error);
                // 오류가 발생해도 계속 진행 (프로덕션 값 사용)
            }
        } else {
            // GitHub Pages 등에서는 환경 변수 사용
            logger.debug('프로덕션 환경 감지됨');
        }
        
        // 설정 검증
        if (!SPOTIFY_CONFIG.CLIENT_ID || SPOTIFY_CONFIG.CLIENT_ID === '%SPOTIFY_CLIENT_ID%') {
            logger.error('유효한 CLIENT_ID가 설정되지 않았습니다');
            throw new Error('스포티파이 CLIENT_ID가 설정되지 않았습니다');
        }
        
        logger.debug('스포티파이 설정 완료:', {
            clientId: SPOTIFY_CONFIG.CLIENT_ID ? '설정됨' : '없음',
            clientSecret: SPOTIFY_CONFIG.CLIENT_SECRET ? '설정됨' : '없음',
            redirectUri: SPOTIFY_CONFIG.REDIRECT_URI
        });
        
        // 콜백 핸들러가 저장한 인증 코드가 있는지 확인
        const authCode = localStorage.getItem(STORAGE_KEYS.AUTH_CODE);
        if (authCode) {
            logger.debug('저장된 인증 코드 발견, 처리 중...');
            await checkForAuthCode();
        } else {
            logger.debug('저장된 인증 코드 없음');
        }
        
        return true;
    } catch (error) {
        logger.error('자격 증명 로드 오류:', error);
        return false;
    }
}

// 콜백 핸들러가 저장한 인증 코드 확인
async function checkForAuthCode() {
    const authCode = localStorage.getItem(STORAGE_KEYS.AUTH_CODE);
    
    if (authCode) {
        logger.debug('저장된 인증 코드 발견, 처리 중...');
        
        try {
            // 인증 코드로 토큰 요청
            await getAccessToken(authCode);
            
            // 인증 코드 삭제 (토큰 획득 후)
            localStorage.removeItem(STORAGE_KEYS.AUTH_CODE);
            logger.debug('인증 코드 처리 완료, 코드 삭제됨');
            
            return true;
        } catch (error) {
            logger.error('저장된 인증 코드 처리 중 오류:', error);
            // 인증 코드 재사용 방지
            localStorage.removeItem(STORAGE_KEYS.AUTH_CODE);
            return false;
        }
    } else {
        logger.debug('저장된 인증 코드 없음');
        return false;
    }
}

// 인증 URL 생성
function getAuthUrl() {
    const state = generateRandomString(16);
    
    // 안전성을 위해 여러 저장소에 일관된 상태 저장
    try {
        localStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);
        sessionStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);
        setCookie(STORAGE_KEYS.AUTH_STATE, state, 1); // 1일 유효
        
        logger.debug('인증 상태 저장됨:', state);
    } catch (e) {
        // 개인정보 보호 모드에서는 에러 발생 가능
        logger.warn('인증 상태 저장 중 오류:', e);
    }
    
    const params = new URLSearchParams({
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        response_type: 'code',
        redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
        state: state,
        scope: SPOTIFY_CONFIG.SCOPES.join(' '),
        show_dialog: true // 항상 로그인 화면 표시
    });
    
    const authUrl = `${SPOTIFY_CONFIG.AUTH_ENDPOINT}?${params.toString()}`;
    logger.debug('인증 URL 생성됨:', authUrl);
    
    return authUrl;
}

// 저장된 인증 상태 가져오기
function getStoredAuthState() {
    // 여러 저장소에서 시도
    let localState, sessionState, cookieState;
    
    try {
        localState = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);
        sessionState = sessionStorage.getItem(STORAGE_KEYS.AUTH_STATE);
        cookieState = getCookie(STORAGE_KEYS.AUTH_STATE);
        
        logger.debug('저장된 인증 상태 확인:', {
            localStorage: localState,
            sessionStorage: sessionState,
            cookie: cookieState
        });
        
        // 어느 하나라도 있으면 반환 (localStorage 우선)
        return localState || sessionState || cookieState;
    } catch (e) {
        logger.error('인증 상태 읽기 중 오류:', e);
        return null;
    }
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
    logger.debug('인증 코드로 액세스 토큰 요청 중...');
    logger.debug('사용 중인 리디렉션 URI:', SPOTIFY_CONFIG.REDIRECT_URI);
    
    // 이전의 Authentication 관련 오류 초기화
    localStorage.removeItem('auth_error');
    
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
            const errorData = await response.text();
            logger.error('토큰 요청 실패:', response.status, errorData);
            
            // 오류 정보 저장 (디버깅용)
            localStorage.setItem('auth_error', JSON.stringify({
                status: response.status,
                error: errorData,
                timestamp: Date.now()
            }));
            
            throw new Error(`토큰 요청 실패 (${response.status}): ${errorData}`);
        }
        
        const data = await response.json();
        logger.debug('토큰 응답 받음:', {
            accessToken: data.access_token ? '설정됨' : '없음',
            refreshToken: data.refresh_token ? '설정됨' : '없음',
            expiresIn: data.expires_in
        });
        
        // 토큰 저장
        saveTokenData(data);
        
        return data;
    } catch (error) {
        logger.error('토큰 요청 오류:', error);
        throw error;
    }
}

// 토큰 데이터 저장
function saveTokenData(data) {
    if (!data.access_token) {
        logger.error('액세스 토큰이 없어 저장할 수 없습니다');
        return false;
    }
    
    const tokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000)
    };
    
    try {
        // 토큰 데이터 저장
        localStorage.setItem(STORAGE_KEYS.TOKEN_DATA, JSON.stringify(tokenData));
        localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
        
        // 쿠키에도 인증 상태 저장 (크로스 탭 동기화 지원)
        setCookie(STORAGE_KEYS.IS_AUTHENTICATED, 'true', 7); // 7일간 유효
        
        logger.debug('토큰 데이터 저장 성공');
        return true;
    } catch (e) {
        logger.error('토큰 데이터 저장 중 오류:', e);
        return false;
    }
}

// 저장된 토큰 데이터 가져오기
function getTokenData() {
    try {
        const tokenString = localStorage.getItem(STORAGE_KEYS.TOKEN_DATA);
        if (!tokenString) {
            logger.debug('저장된 토큰 데이터 없음');
            return null;
        }
        
        const data = JSON.parse(tokenString);
        
        // 유효한 토큰 데이터인지 검증
        if (!data || !data.access_token) {
            logger.warn('저장된 토큰 데이터가 유효하지 않음, 삭제 처리');
            localStorage.removeItem(STORAGE_KEYS.TOKEN_DATA);
            return null;
        }
        
        logger.debug('토큰 데이터 로드됨:', {
            accessToken: '설정됨',
            refreshToken: data.refresh_token ? '설정됨' : '없음',
            expiresAt: new Date(data.expires_at).toLocaleString()
        });
        
        return data;
    } catch (e) {
        logger.error('토큰 데이터 파싱 오류:', e);
        localStorage.removeItem(STORAGE_KEYS.TOKEN_DATA); // 손상된 데이터 제거
        return null;
    }
}

// 토큰이 만료됐는지 확인
function isTokenExpired() {
    const tokenData = getTokenData();
    if (!tokenData) return true;
    
    // 토큰 만료 5분 전에 미리 갱신하도록 설정
    const isExpired = Date.now() > (tokenData.expires_at - 5 * 60 * 1000);
    logger.debug('토큰 만료 여부:', isExpired);
    return isExpired;
}

// 리프레시 토큰으로 액세스 토큰 갱신
async function refreshAccessToken() {
    const tokenData = getTokenData();
    if (!tokenData || !tokenData.refresh_token) {
        logger.error('리프레시 토큰이 없습니다.');
        return null;
    }
    
    logger.debug('액세스 토큰 갱신 중...');
    
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
            const errorData = await response.text();
            logger.error('토큰 갱신 실패:', response.status, errorData);
            
            // 401, 400, 403 오류는 리프레시 토큰 만료로 판단
            if ([400, 401, 403].includes(response.status)) {
                logger.warn('리프레시 토큰이 만료되었거나 유효하지 않습니다. 재로그인이 필요합니다.');
                logout(); // 토큰 삭제 후 로그아웃 처리
                return null;
            }
            
            throw new Error(`토큰 갱신 실패 (${response.status}): ${errorData}`);
        }
        
        const data = await response.json();
        logger.debug('토큰 갱신됨');
        
        // 새 액세스 토큰 저장 (리프레시 토큰은 같이 안 올 수도 있음)
        const newTokenData = {
            access_token: data.access_token,
            refresh_token: data.refresh_token || tokenData.refresh_token,
            expires_at: Date.now() + (data.expires_in * 1000)
        };
        
        localStorage.setItem(STORAGE_KEYS.TOKEN_DATA, JSON.stringify(newTokenData));
        
        return data;
    } catch (error) {
        logger.error('토큰 갱신 오류:', error);
        
        // 심각한 오류인 경우 로그아웃 처리
        if (error.message && (
            error.message.includes('invalid_grant') ||
            error.message.includes('invalid_token')
        )) {
            logout();
        }
        
        throw error;
    }
}

// 유효한 액세스 토큰 가져오기 (필요시 갱신)
async function getValidAccessToken() {
    // 토큰이 만료되었는지 확인
    if (isTokenExpired()) {
        logger.debug('토큰이 만료되었거나 만료 예정입니다. 갱신 시도...');
        try {
            const refreshResult = await refreshAccessToken();
            if (!refreshResult) {
                logger.warn('토큰 갱신 실패, 인증이 필요합니다.');
                return null;
            }
        } catch (error) {
            logger.error('토큰 갱신 실패, 인증이 필요합니다:', error);
            return null;
        }
    }
    
    // 갱신 후 다시 토큰 데이터 가져오기
    const tokenData = getTokenData();
    
    // 토큰 없으면 null 반환
    if (!tokenData || !tokenData.access_token) {
        logger.warn('유효한 액세스 토큰이 없습니다');
        return null;
    }
    
    logger.debug('유효한 액세스 토큰 반환');
    return tokenData.access_token;
}

// 로그인 상태 확인
function isLoggedIn() {
    try {
        // 1. 토큰 데이터 유효성 확인
        const tokenData = getTokenData();
        if (!tokenData || !tokenData.access_token) {
            logger.debug('토큰 데이터 없거나 유효하지 않음, 로그아웃 상태');
            return false;
        }
        
        // 2. 인증 상태 확인
        const isAuthenticatedStorage = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
        const isAuthenticatedCookie = getCookie(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
        const isAuthenticated = isAuthenticatedStorage || isAuthenticatedCookie;
        
        if (!isAuthenticated) {
            logger.debug('인증 상태 없음, 로그아웃 상태');
            return false;
        }
        
        // 3. 토큰이 완전히 만료되었고 리프레시 토큰도 없으면 로그아웃 상태
        const now = Date.now();
        if (tokenData.expires_at < now && !tokenData.refresh_token) {
            logger.debug('토큰 만료 & 리프레시 토큰 없음, 로그아웃 상태');
            return false;
        }
        
        logger.debug('로그인 상태 확인: 로그인됨');
        return true;
    } catch (e) {
        logger.error('로그인 상태 확인 오류:', e);
        return false;
    }
}

// 로그아웃 (토큰 삭제)
function logout() {
    // 모든 인증 관련 데이터 삭제
    localStorage.removeItem(STORAGE_KEYS.TOKEN_DATA);
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    localStorage.removeItem(STORAGE_KEYS.AUTH_CODE);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem('auth_error'); // 디버깅용 오류 정보도 삭제
    
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    setCookie(STORAGE_KEYS.AUTH_STATE, '', -1); // 쿠키 삭제
    setCookie(STORAGE_KEYS.IS_AUTHENTICATED, '', -1); // 인증 쿠키 삭제
    
    logger.debug('로그아웃됨');
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
    debugLog,
    setLogger,
    getStoredAuthState,
    checkForAuthCode
};