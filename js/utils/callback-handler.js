// callback-handler.js - 스포티파이 인증 콜백 처리 모듈

// 기본 로거 설정
const logger = {
    debug: (...args) => console.log('[SFli Debug]', ...args),
    info: (...args) => console.info('[SFli]', ...args),
    warn: (...args) => console.warn('[SFli Warning]', ...args),
    error: (...args) => console.error('[SFli Error]', ...args)
};

// 스토리지 키 상수 정의 - 일관성 유지를 위해
const STORAGE_KEYS = {
    AUTH_STATE: 'spotify_auth_state',
    AUTH_CODE: 'spotify_auth_code',
    TOKEN_DATA: 'spotify_token_data',
    IS_AUTHENTICATED: 'is_authenticated'
};

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

// URL 파라미터 파싱 함수
function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    
    return { code, state, error };
}

// UI 업데이트 함수
function updateUI(message, isError = false) {
    const messageElement = document.querySelector('.auth-message');
    const errorElement = document.getElementById('error-message');
    
    if (messageElement) {
        messageElement.textContent = message;
    }
    
    if (errorElement) {
        if (isError) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            errorElement.style.display = 'none';
        }
    }
}

// 프로그레스 바 업데이트
function updateProgressBar(percent) {
    const progressFill = document.querySelector('.auth-progress-fill');
    if (progressFill) {
        progressFill.style.width = `${percent}%`;
    }
}

// 메인 페이지로 리다이렉트 - 기존 URL 구조 기반으로 경로 설정
function redirectToMainPage(delay = 1000) {
    setTimeout(() => {
        debugLog('메인 페이지로 리다이렉트 중...');
        
        // 현재 URL을 기반으로 상대 경로 계산
        const currentUrl = new URL(window.location.href);
        const baseUrl = currentUrl.origin;
        const debugParam = isDebugMode() ? '?debug=true' : '';
        
        // 최상위 경로로 이동 (경로 문제 해결)
        const targetUrl = `${baseUrl}/SFli.html${debugParam}`;
        
        debugLog('리다이렉트 URL:', targetUrl);
        window.location.href = targetUrl;
    }, delay);
}

// 인증 오류 처리
function handleAuthError(error) {
    debugLog('인증 오류 발생:', error);
    updateUI(`인증 오류: ${error}`, true);
    
    // 오류 발생 시 3초 후 메인 페이지로 이동
    setTimeout(() => {
        // 현재 URL을 기반으로 상대 경로 계산
        const currentUrl = new URL(window.location.href);
        const baseUrl = currentUrl.origin;
        
        window.location.href = `${baseUrl}/index.html`;
    }, 3000);
}

// 메인 처리 함수
async function handleCallback() {
    debugLog('콜백 처리 시작');
    updateProgressBar(10);
    
    const { code, state, error } = parseUrlParams();
    
    // 오류 파라미터 확인
    if (error) {
        handleAuthError(`Spotify 인증 거부됨: ${error}`);
        return;
    }
    
    // 코드와 상태 파라미터 확인
    if (!code || !state) {
        handleAuthError('필수 인증 정보가 누락되었습니다');
        return;
    }
    
    updateProgressBar(30);
    
    try {
        // 여러 저장소에서 상태 값 확인 (보안 강화)
        const storedState = localStorage.getItem(STORAGE_KEYS.AUTH_STATE) || 
                           sessionStorage.getItem(STORAGE_KEYS.AUTH_STATE) ||
                           getCookie(STORAGE_KEYS.AUTH_STATE);
        
        debugLog('저장된 상태:', storedState, '받은 상태:', state);
        
        // CSRF 방지를 위한 상태 검증
        if (!storedState || state !== storedState) {
            // 개발 환경에서는 상태 불일치해도 계속 진행 (경고만 표시)
            if (isDebugMode()) {
                debugLog('상태 불일치 감지되었지만 디버그 모드에서 계속 진행합니다');
            } else {
                throw new Error('상태 토큰이 일치하지 않습니다. CSRF 공격 가능성이 있습니다.');
            }
        }
        
        updateProgressBar(50);
        updateUI('인증 성공! 처리 중...');
        
        // 로컬 스토리지에 인증 코드 저장 (spotify-auth.js에서 사용할 수 있도록)
        localStorage.setItem(STORAGE_KEYS.AUTH_CODE, code);
        localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
        
        // state 값은 이제 필요 없으므로 제거 (중복 처리 방지)
        localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
        setCookie(STORAGE_KEYS.AUTH_STATE, '', -1);
        
        updateProgressBar(80);
        updateUI('인증 완료! 리다이렉트 중...');
        
        // 메인 페이지로 리다이렉트
        redirectToMainPage(1500);
        
    } catch (error) {
        handleAuthError(error.message);
    }
}

// 쿠키 설정/읽기 함수
function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
}

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

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    debugLog('콜백 페이지 로드됨');
    handleCallback();
});