/**
 * auth-handler.js
 * 스포티파이 인증 처리를 담당하는 모듈
 * 인증 토큰 관리 및 API 키 설정 기능 포함
 */

/**
 * 디버그 로그 출력 함수 - 환경 설정에서 제공하는 로그 함수 사용
 * @param {string} message - 출력할 메시지
 */
function log(message) {
    if (window.__env__ && typeof window.__env__.log === 'function') {
        window.__env__.log('Auth', message);
    }
}

// 스포티파이 인증 설정
const config = {
    // API 키 (클라이언트 ID)
    clientId: null, // 초기값은 null로 설정

    // 리디렉션 URI 설정
    // 현재 애플리케이션이 실행되는 정확한 URI를 사용
    // 쿼리 파라미터와 해시가 제거된 기본 URL만 사용
    redirectUri: window.location.origin + window.location.pathname.split('?')[0].split('#')[0],

    // 권한 범위
    scopes: [
        'user-read-private',
        'user-read-email',
        'playlist-read-private',
        'playlist-read-collaborative',
        'playlist-modify-public',
        'playlist-modify-private'
    ]
};

/**
 * API 키 초기화 및 유효성 검증
 * @returns {boolean} API 키 유효 여부
 */
function initApiKey() {
    // 환경 변수에서 API 키 확인
    let apiKey = window.__env__?.SPOTIFY_API_KEY;
    let apiKeySource = window.__env__?.API_KEY_SOURCE || '알 수 없음';

    // API 키가 플레이스홀더인 경우 체크
    if (apiKey === '%SPOTIFY_API_KEY%') {
        log('환경 변수의 API 키가 플레이스홀더 상태입니다');
        apiKey = null;
    } else if (apiKey) {
        log(`API 키 소스: ${apiKeySource}`);
    }

    // 로컬 스토리지에서 API 키 확인
    if (!apiKey) {
        apiKey = localStorage.getItem('spotify_api_key');
        if (apiKey) {
            log('로컬 스토리지에서 API 키를 불러왔습니다');
            apiKeySource = 'localStorage';
        }
    }

    // API 키 설정
    config.clientId = apiKey;

    // API 키 유효성 확인
    if (!apiKey) {
        log('유효한 API 키가 없습니다');
        showApiKeyError();
        return false;
    }

    log(`API 키가 설정되었습니다 (소스: ${apiKeySource})`);
    return true;
}

/**
 * API 키 오류 메시지 표시 및 입력 폼 생성
 */
function showApiKeyError() {
    // 오류 메시지 요소 가져오기 또는 생성
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'error-message';
        document.querySelector('main').prepend(errorElement);
    }

    // 폼 HTML 생성
    errorElement.innerHTML = `
        <div class="api-key-error">
            <p>INVALID_CLIENT: Invalid client 오류가 발생했습니다.</p>
            <p>API 키가 유효하지 않거나 설정되지 않았습니다.</p>
            <div class="api-key-form">
                <label for="api-key-input">스포티파이 API 키(클라이언트 ID):</label>
                <input type="text" id="api-key-input" placeholder="스포티파이 개발자 대시보드에서 확인">
                <button id="save-api-key">저장</button>
            </div>
        </div>
    `;

    // 입력된 API 키 저장 이벤트 등록
    setTimeout(() => {
        const saveButton = document.getElementById('save-api-key');
        if (saveButton) {
            saveButton.addEventListener('click', saveApiKeyHandler);
        }
    }, 100);

    errorElement.style.display = 'block';
}

/**
 * API 키 저장 버튼 클릭 핸들러
 */
function saveApiKeyHandler() {
    const inputElement = document.getElementById('api-key-input');
    const newApiKey = inputElement?.value?.trim();

    if (newApiKey) {
        localStorage.setItem('spotify_api_key', newApiKey);
        config.clientId = newApiKey;
        log('새 API 키가 저장되었습니다');

        // 오류 메시지 숨기기
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }

        // 페이지 새로고침
        window.location.reload();
    } else {
        alert('유효한 API 키를 입력해주세요.');
    }
}

/**
 * 스포티파이 인증 페이지로 리디렉션
 */
function authorize() {
    log('인증 프로세스 시작');

    // API 키 초기화 및 확인
    if (!initApiKey()) {
        log('API 키가 유효하지 않아 인증 프로세스를 중단합니다');
        return;
    }

    // 로컬호스트에서 실행 중인지 확인
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('192.168.');

    // GitHub Pages에서 실행 중인지 확인
    const isGitHubPages = window.location.hostname === 'eyounha.github.io';

    // 환경에 맞는 리디렉션 URI 사용
    let finalRedirectUri = config.redirectUri;

    // 특정 환경에 따른 URI 조정
    if (isGitHubPages) {
        // GitHub Pages용 리디렉션 URI
        finalRedirectUri = 'https://eyounha.github.io/SportyFli/';
        log(`GitHub Pages 환경 감지, 리디렉션 URI: ${finalRedirectUri}`);
    }

    // 디버그 모드인 경우 로깅
    if (window.__env__?.DEBUG_MODE) {
        log(`사용할 리디렉션 URI: ${finalRedirectUri}`);
        log(`호스트명: ${window.location.hostname}`);
    }

    // 인증 상태 값 생성 (CSRF 방지)
    const state = generateRandomString(16);
    localStorage.setItem('spotify_auth_state', state);

    // 인증 URL 구성
    const authUrl = 'https://accounts.spotify.com/authorize' +
        `?client_id=${encodeURIComponent(config.clientId)}` +
        '&response_type=token' +
        `&redirect_uri=${encodeURIComponent(finalRedirectUri)}` +
        `&scope=${encodeURIComponent(config.scopes.join(' '))}` +
        `&state=${encodeURIComponent(state)}` +
        '&show_dialog=true';  // 매번 로그인 대화상자 표시 (테스트 용도)

    log(`인증 URL로 리디렉션: ${authUrl}`);
    window.location.href = authUrl;
}

/**
 * 무작위 문자열 생성 함수 (인증 상태 값 생성용)
 * @param {number} length - 생성할 문자열 길이
 * @returns {string} 무작위 문자열
 */
function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

/**
 * 인증 토큰 처리
 * @param {Function} onSuccess - 인증 성공 시 호출할 콜백 함수
 */
function handleAuthentication(onSuccess) {
    log('인증 상태 확인 중');

    // URL 해시에서 토큰 추출
    const hash = window.location.hash.substring(1);
    if (hash) {
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        const state = params.get('state');
        const storedState = localStorage.getItem('spotify_auth_state');

        // 상태 값 검증 (CSRF 방지)
        if (state && storedState && state === storedState) {
            // 상태 값 사용 후 제거
            localStorage.removeItem('spotify_auth_state');

            if (token) {
                log('액세스 토큰 발견 (상태 검증 성공)');
                localStorage.setItem('spotify_access_token', token);

                // 토큰 만료 시간 계산 및 저장 (기본 1시간)
                const expiresIn = params.get('expires_in') || 3600;
                const expirationTime = Date.now() + (expiresIn * 1000);
                localStorage.setItem('spotify_token_expiration', expirationTime);

                // 해시 제거
                window.history.replaceState({}, document.title, window.location.pathname);

                // 성공 콜백 호출
                if (typeof onSuccess === 'function') {
                    onSuccess(token);
                }

                return true;
            }
        } else if (state) {
            // 상태 값이 일치하지 않는 경우
            log('보안 경고: 인증 상태 값이 일치하지 않습니다 (CSRF 가능성)');
            showSecurityWarning();
            return false;
        }
    } else if (localStorage.getItem('spotify_access_token')) {
        // 저장된 토큰의 만료 여부 확인
        const expirationTime = localStorage.getItem('spotify_token_expiration');
        if (expirationTime && Date.now() < expirationTime) {
            log('저장된 유효 토큰 발견');

            // 성공 콜백 호출
            if (typeof onSuccess === 'function') {
                onSuccess(localStorage.getItem('spotify_access_token'));
            }

            return true;
        } else {
            log('저장된 토큰이 만료되었습니다. 새로 인증이 필요합니다.');
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_token_expiration');
        }
    }

    return false;
}

/**
 * 보안 경고 메시지 표시
 */
function showSecurityWarning() {
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'error-message';
        document.querySelector('main').prepend(errorElement);
    }

    errorElement.innerHTML = `
        <div class="security-warning">
            <p><strong>보안 경고:</strong> 인증 과정에서 보안 문제가 감지되었습니다.</p>
            <p>다시 로그인을 시도해주세요.</p>
            <button id="retry-login-btn" class="login-btn">다시 로그인</button>
        </div>
    `;

    // 다시 로그인 버튼에 이벤트 추가
    setTimeout(() => {
        const retryButton = document.getElementById('retry-login-btn');
        if (retryButton) {
            retryButton.addEventListener('click', function () {
                errorElement.style.display = 'none';
                authorize();
            });
        }
    }, 100);

    errorElement.style.display = 'block';
}

/**
 * 액세스 토큰 가져오기
 * @returns {string|null} 저장된 액세스 토큰 또는 null
 */
function getAccessToken() {
    return localStorage.getItem('spotify_access_token');
}

/**
 * 로그아웃 - 토큰 제거
 */
function logout() {
    log('로그아웃 실행');
    localStorage.removeItem('spotify_access_token');
    // 페이지 새로고침
    window.location.reload();
}

// 모듈 내보내기
window.authHandler = {
    authorize,
    handleAuthentication,
    getAccessToken,
    logout
};

// 인증 핸들러 로드 로그
log('auth-handler.js 로드됨');