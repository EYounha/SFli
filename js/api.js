/**
 * api.js
 * 스포티파이 API 호출 관련 기능을 처리하는 모듈
 */

import { getToken, removeToken } from './auth.js';
import config from './config.js';

// 스포티파이 API 기본 URL
const API_BASE_URL = 'https://api.spotify.com/v1';

/**
 * API 요청에 사용할 기본 헤더를 생성하는 함수
 * @returns {Object} 인증 토큰이 포함된 헤더 객체
 */
function getHeaders() {
    const token = getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
    };
}

/**
 * API 호출 로그를 상세하게 기록하는 함수
 * @param {string} method - HTTP 메서드 (GET, POST 등)
 * @param {string} endpoint - API 엔드포인트 경로
 * @param {Object} params - 요청 파라미터 (쿼리 파라미터 또는 body)
 */
function logApiCall(method, endpoint, params = null) {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const timestamp = new Date().toISOString();

    let logMessage = `[${timestamp}] API 요청: ${method} ${fullUrl}`;

    // API 이름 추출 (예: /me/playlists -> getUserPlaylists)
    let apiName = '알 수 없음';
    if (endpoint.startsWith('/me/playlists')) {
        apiName = 'getUserPlaylists';
    } else if (endpoint === '/me') {
        apiName = 'getCurrentUserProfile';
    } else if (endpoint.startsWith('/playlists/')) {
        apiName = 'getPlaylistDetails';
    } else if (endpoint.includes('/playlists')) {
        apiName = 'createPlaylist';
    } else if (endpoint.includes('/tracks')) {
        apiName = 'trackOperation';
    } else if (endpoint.includes('/search')) {
        apiName = 'search';
    }

    logMessage += ` [API 함수: ${apiName}]`;

    if (params) {
        // 파라미터가 있으면 로그에 추가
        try {
            if (typeof params === 'string') {
                // JSON 문자열인 경우 파싱
                try {
                    const parsedParams = JSON.parse(params);
                    logMessage += `\n파라미터: ${JSON.stringify(parsedParams, null, 2)}`;
                } catch {
                    logMessage += `\n파라미터: ${params}`;
                }
            } else {
                // 객체인 경우 직접 문자열화
                logMessage += `\n파라미터: ${JSON.stringify(params, null, 2)}`;
            }
        } catch (e) {
            logMessage += `\n파라미터: (직렬화 불가)`;
        }
    }

    config.debug.log('API', logMessage);

    // 브라우저 콘솔에 색상을 적용한 로그 출력 (디버그 모드일 경우)
    if (config.debug.enabled) {
        console.log(`%c${logMessage}`, 'color: #3498db; font-weight: bold;');
    }
}

/**
 * 스포티파이 API에 요청을 보내는 기본 함수
 * @param {string} endpoint - API 엔드포인트 경로
 * @param {Object} options - fetch 옵션 (method, body 등)
 * @returns {Promise<Object>} API 응답 데이터
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        ...getHeaders(),
        ...options.headers
    };
    const method = options.method || 'GET';

    // API 호출 상세 로깅
    logApiCall(method, endpoint, options.body || (endpoint.includes('?') ? endpoint.split('?')[1] : null));

    try {
        // API 요청 객체 구성 (보안 관련 설정 추가)
        const requestOptions = {
            ...options,
            method,
            headers,
            mode: 'cors',  // CORS 활성화
            cache: 'no-cache',  // 캐시 비활성화
            credentials: 'same-origin',  // 자격 증명 정책
            redirect: 'follow',  // 리디렉션 자동 따름
            referrerPolicy: 'no-referrer-when-downgrade'  // 참조자 정책
        };

        const response = await fetch(url, requestOptions);

        config.debug.log('API', `응답 상태: ${response.status} (${response.statusText})`);

        // 인증 오류 처리 (상태 코드 401)
        if (response.status === 401) {
            config.debug.error('API', '인증 오류: 토큰이 만료되었거나 유효하지 않음');

            // 토큰 제거 및 저장된 만료 시간 제거
            removeToken();
            localStorage.removeItem('spotify_token_expiration');

            // 인증 오류 메시지
            const errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';

            // 재인증 팝업 표시 또는 로그인 페이지로 리디렉션 처리
            showAuthErrorPopup(errorMessage);

            throw new Error(errorMessage);
        }

        // 특정 브라우저/앱 호환성 오류 처리 (상태 코드 403)
        if (response.status === 403) {
            config.debug.error('API', '접근 권한 오류: 호환성 문제 가능성');

            const errorText = await response.text();
            let errorInfo;

            try {
                errorInfo = JSON.parse(errorText);
            } catch {
                errorInfo = { error: { message: errorText || response.statusText } };
            }

            // 브라우저 호환성 문제 메시지 표시
            showBrowserCompatibilityError(errorInfo.error?.message || '접근이 거부되었습니다. 브라우저 호환성 문제일 수 있습니다.');

            throw new Error('API 접근 거부: 호환성 문제');
        }

        // 기타 오류 처리
        if (!response.ok) {
            const errorText = await response.text();
            let errorInfo;
            try {
                errorInfo = JSON.parse(errorText);
            } catch {
                errorInfo = { error: { message: errorText || response.statusText } };
            }

            config.debug.error('API', `API 오류: ${response.status} ${response.statusText}`, errorInfo);
            throw new Error(`API 요청 실패: ${errorInfo.error?.message || response.statusText}`);
        }

        const data = await response.json();
        config.debug.log('API', `응답 데이터 수신 (${method} ${endpoint})`, {
            요약: getSummaryOfResponse(data),
            전체: data
        });
        return data;
    } catch (error) {
        config.debug.error('API', `요청 오류 (${method} ${endpoint}):`, error);
        throw error;
    }
}

/**
 * 인증 오류 팝업 표시
 * @param {string} message - 표시할 오류 메시지
 */
function showAuthErrorPopup(message) {
    // 페이지에 오류 메시지 요소 추가
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'error-message';
        document.querySelector('main')?.prepend(errorElement);
    }

    // 오류 메시지 HTML 생성
    errorElement.innerHTML = `
        <div class="auth-error">
            <p>${message}</p>
            <button id="relogin-btn" class="login-btn">다시 로그인</button>
        </div>
    `;

    // 다시 로그인 버튼 이벤트 등록
    setTimeout(() => {
        const reloginButton = document.getElementById('relogin-btn');
        if (reloginButton) {
            reloginButton.addEventListener('click', function () {
                // 페이지 새로고침으로 로그인 프로세스 다시 시작
                window.location.href = window.location.pathname;
            });
        }
    }, 100);

    errorElement.style.display = 'block';
}

/**
 * 브라우저 호환성 오류 메시지 표시
 * @param {string} message - 표시할 오류 메시지
 */
function showBrowserCompatibilityError(message) {
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'error-message';
        document.querySelector('main')?.prepend(errorElement);
    }

    errorElement.innerHTML = `
        <div class="compatibility-error">
            <p><strong>브라우저 호환성 문제:</strong> ${message}</p>
            <p>다음 해결 방법을 시도해 보세요:</p>
            <ul>
                <li>최신 버전의 Chrome, Firefox, Edge 또는 Safari 브라우저를 사용해 보세요.</li>
                <li>브라우저의 개인정보 보호 모드를 해제하거나 다른 브라우저로 시도해 보세요.</li>
                <li>웹 브라우저 설정에서 쿠키 및 사이트 데이터를 허용해 주세요.</li>
                <li>원활한 로그인을 위해 팝업 차단을 비활성화해 주세요.</li>
            </ul>
            <button id="retry-btn" class="login-btn">다시 시도</button>
        </div>
    `;

    setTimeout(() => {
        const retryButton = document.getElementById('retry-btn');
        if (retryButton) {
            retryButton.addEventListener('click', function () {
                window.location.reload();
            });
        }
    }, 100);

    errorElement.style.display = 'block';
}

/**
 * API 응답 데이터 요약 정보를 생성하는 함수
 * @param {Object} data - API 응답 데이터
 * @returns {Object} 요약된 응답 정보
 */
function getSummaryOfResponse(data) {
    if (!data) return null;

    // 배열인 경우 길이만 반환
    if (Array.isArray(data)) {
        return `배열 (${data.length}개 항목)`;
    }

    // 객체인 경우 주요 정보만 추출
    const summary = {};

    // playlists 컬렉션인 경우
    if (data.items && data.total !== undefined) {
        summary.total = data.total;
        summary.count = data.items.length;
        summary.type = data.items[0]?.type || 'unknown';
    }

    // 단일 객체 (플레이리스트, 트랙, 사용자 등)
    if (data.id) {
        summary.id = data.id;
        summary.type = data.type;
        if (data.name) summary.name = data.name;
        if (data.display_name) summary.display_name = data.display_name;
    }

    return Object.keys(summary).length > 0 ? summary : '(자세한 내용은 전체 응답 참조)';
}

/**
 * 현재 사용자 프로필 정보를 가져오는 함수
 * @returns {Promise<Object>} 사용자 프로필 데이터
 */
function getCurrentUserProfile() {
    config.debug.log('API', '사용자 프로필 정보 요청');
    return apiRequest('/me');
}

/**
 * 사용자의 플레이리스트 목록을 가져오는 함수
 * @param {number} limit - 한 번에 가져올 플레이리스트 수
 * @param {number} offset - 시작 오프셋
 * @returns {Promise<Object>} 플레이리스트 목록 데이터
 */
function getUserPlaylists(limit = 20, offset = 0) {
    config.debug.log('API', `플레이리스트 목록 요청 (limit: ${limit}, offset: ${offset})`);
    return apiRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
}

/**
 * 특정 플레이리스트의 상세 정보를 가져오는 함수
 * @param {string} playlistId - 플레이리스트 ID
 * @returns {Promise<Object>} 플레이리스트 상세 데이터
 */
function getPlaylistDetails(playlistId) {
    config.debug.log('API', `플레이리스트 상세 정보 요청: ${playlistId}`);
    return apiRequest(`/playlists/${playlistId}`);
}

/**
 * 새 플레이리스트를 생성하는 함수
 * @param {string} userId - 사용자 ID
 * @param {string} name - 플레이리스트 이름
 * @param {string} description - 플레이리스트 설명
 * @param {boolean} isPublic - 공개 여부
 * @returns {Promise<Object>} 생성된 플레이리스트 데이터
 */
function createPlaylist(userId, name, description = '', isPublic = true) {
    config.debug.log('API', `플레이리스트 생성 요청: ${name}`);
    return apiRequest(`/users/${userId}/playlists`, {
        method: 'POST',
        body: JSON.stringify({
            name,
            description,
            public: isPublic
        })
    });
}

// 모듈 내보내기
export {
    getCurrentUserProfile,
    getUserPlaylists,
    getPlaylistDetails,
    createPlaylist
};