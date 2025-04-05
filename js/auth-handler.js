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
        window.__env__.log(message);
    }
}

// 스포티파이 인증 설정
const config = {
    // API 키 (클라이언트 ID)
    clientId: null, // 초기값은 null로 설정

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
};

/**
 * API 키 초기화 및 유효성 검증
 * @returns {boolean} API 키 유효 여부
 */
function initApiKey() {
    // 환경 변수에서 API 키 확인
    let apiKey = window.__env__?.SPOTIFY_API_KEY;

    // API 키가 플레이스홀더인 경우 체크
    if (apiKey === '%SPOTIFY_API_KEY%') {
        log('환경 변수의 API 키가 플레이스홀더 상태입니다');
        apiKey = null;
    }

    // 로컬 스토리지에서 API 키 확인
    if (!apiKey) {
        apiKey = localStorage.getItem('spotify_api_key');
        if (apiKey) {
            log('로컬 스토리지에서 API 키를 불러왔습니다');
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

    log('API 키가 설정되었습니다');
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

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${config.clientId}&response_type=token&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scopes.join(' '))}`;

    log(`인증 URL로 리디렉션: ${authUrl}`);
    window.location.href = authUrl;
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

        if (token) {
            log('액세스 토큰 발견');
            localStorage.setItem('spotify_access_token', token);

            // 해시 제거
            window.history.replaceState({}, document.title, window.location.pathname);

            // 성공 콜백 호출
            if (typeof onSuccess === 'function') {
                onSuccess(token);
            }

            return true;
        }
    } else if (localStorage.getItem('spotify_access_token')) {
        log('저장된 토큰 발견');

        // 성공 콜백 호출
        if (typeof onSuccess === 'function') {
            onSuccess(localStorage.getItem('spotify_access_token'));
        }

        return true;
    }

    return false;
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