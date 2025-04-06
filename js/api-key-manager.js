/**
 * api-key-manager.js
 * Spotify API 키 관리를 위한 유틸리티 함수
 */

// API 키 입력 폼을 표시하는 함수
function showApiKeyForm() {
    // 오류 메시지 요소 가져오기 또는 생성
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'error-message';
        document.querySelector('main')?.prepend(errorElement);
    }

    // API 키 입력 폼 HTML 생성
    errorElement.innerHTML = `
        <div class="api-key-error">
            <h3>INVALID_CLIENT: Failed to get client</h3>
            <p>Spotify API 클라이언트 ID가 유효하지 않거나 설정되지 않았습니다.</p>
            <div class="api-key-form">
                <label for="api-key-input">Spotify 클라이언트 ID 입력:</label>
                <input type="text" id="api-key-input" placeholder="Spotify 개발자 대시보드에서 클라이언트 ID 확인">
                <div class="api-key-help">
                    <p><small>Spotify 클라이언트 ID를 가져오는 방법:</small></p>
                    <ol>
                        <li><small><a href="https://developer.spotify.com/dashboard" target="_blank">Spotify 개발자 대시보드</a>에 로그인하세요.</small></li>
                        <li><small>새 앱을 생성하거나 기존 앱을 선택하세요.</small></li>
                        <li><small>클라이언트 ID를 복사하여 위 입력란에 붙여넣으세요.</small></li>
                        <li><small>앱 설정에서 리디렉션 URI를 <code>${window.location.origin}${window.location.pathname}</code>로 설정하세요.</small></li>
                    </ol>
                </div>
                <button id="save-api-key" class="login-btn">저장</button>
            </div>
        </div>
    `;

    // 저장 버튼에 이벤트 리스너 등록
    setTimeout(() => {
        const saveButton = document.getElementById('save-api-key');
        if (saveButton) {
            saveButton.addEventListener('click', saveApiKey);
        }
    }, 100);

    errorElement.style.display = 'block';
}

// API 키 저장 처리
function saveApiKey() {
    const inputElement = document.getElementById('api-key-input');
    const apiKey = inputElement?.value?.trim();

    if (!apiKey) {
        alert('유효한 Spotify 클라이언트 ID를 입력해주세요.');
        return;
    }

    // 로컬 스토리지에 API 키 저장
    localStorage.setItem('spotify_api_key', apiKey);

    // 오류 메시지 숨기기
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }

    // 페이지 새로고침
    window.location.reload();
}

// 페이지 로드 시 API 키 상태 확인
function checkApiKeyOnLoad() {
    // 이미 로그인 시도가 있었고 오류가 있는지 확인
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthError = urlParams.get('auth_error') === 'invalid_client';

    // 로컬 스토리지에서 API 키 확인
    const apiKey = localStorage.getItem('spotify_api_key');

    // URL에 오류 파라미터가 있거나 API 키가 없는 경우 폼 표시
    if (hasAuthError || !apiKey) {
        showApiKeyForm();

        // URL에서 오류 파라미터 제거
        if (hasAuthError) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// 전역 객체로 함수 노출
window.apiKeyManager = {
    showApiKeyForm,
    saveApiKey,
    checkApiKeyOnLoad
};

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', checkApiKeyOnLoad);