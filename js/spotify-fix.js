/**
 * spotify-fix.js
 * Spotify 인증 문제 해결을 위한 도구
 */

// 디버그 정보 출력 함수
function logDebugInfo(message, data) {
    console.log(`[Spotify 문제 해결] ${message}`, data || '');
}

// Spotify 인증 오류 해결 도구
const SpotifyFix = {
    // 현재 저장된 모든 인증 정보 표시
    showCurrentSettings() {
        const settings = {
            localStorage: {
                spotify_access_token: localStorage.getItem('spotify_access_token'),
                spotify_token_expiration: localStorage.getItem('spotify_token_expiration'),
                spotify_api_key: localStorage.getItem('spotify_api_key'),
                spotify_auth_state: localStorage.getItem('spotify_auth_state')
            },
            windowEnv: window.__env__?.SPOTIFY_API_KEY,
            debugKey: window.DEBUG_SPOTIFY_API_KEY,
            configValue: null
        };

        // config.js의 값도 가져오기 시도
        try {
            if (typeof config !== 'undefined' && config.spotify && config.spotify.clientId) {
                settings.configValue = config.spotify.clientId;
            }
        } catch (e) {
            console.error('config 객체 접근 실패:', e);
        }

        logDebugInfo('현재 Spotify 인증 설정', settings);
        return settings;
    },

    // 모든 인증 정보 초기화
    clearAllStoredData() {
        // 로컬 스토리지 항목 삭제
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_expiration');
        localStorage.removeItem('spotify_api_key');
        localStorage.removeItem('spotify_auth_state');

        logDebugInfo('모든 Spotify 인증 정보가 초기화되었습니다');

        // 페이지 새로고침 권장
        if (confirm('인증 정보가 초기화되었습니다. 페이지를 새로고침할까요?')) {
            window.location.reload();
        }
    },

    // 새 API 키 설정
    setNewApiKey() {
        const apiKey = prompt('Spotify 클라이언트 ID를 입력하세요:', '');

        if (apiKey) {
            localStorage.setItem('spotify_api_key', apiKey);

            // 가능하면 config 객체 업데이트
            try {
                if (typeof config !== 'undefined' && config.updateApiKey) {
                    config.updateApiKey(apiKey);
                }
            } catch (e) {
                console.error('config 객체 업데이트 실패:', e);
            }

            logDebugInfo('새 API 키가 설정되었습니다:', apiKey);

            // 페이지 새로고침 권장
            if (confirm('API 키가 설정되었습니다. 페이지를 새로고침할까요?')) {
                window.location.reload();
            }
        }
    },

    // 현재 리디렉션 URI 표시 (Spotify 개발자 대시보드에 등록해야 함)
    showRedirectUri() {
        const redirectUri = window.location.origin + window.location.pathname;
        logDebugInfo('Spotify 개발자 대시보드에 등록해야 하는 리디렉션 URI:', redirectUri);

        // 복사 가능한 형태로 alert 표시
        alert(`다음 리디렉션 URI를 Spotify 개발자 대시보드에 등록하세요:\n\n${redirectUri}`);

        return redirectUri;
    },

    // 문제 해결 가이드 표시
    showTroubleshootingGuide() {
        const guide = `
1. Spotify 개발자 대시보드(https://developer.spotify.com/dashboard)에서 앱을 등록했는지 확인하세요.
2. 등록한 앱의 클라이언트 ID가 정확한지 확인하세요.
3. 앱 설정에서 리디렉션 URI를 정확히 설정했는지 확인하세요.
   - 현재 페이지의 리디렉션 URI: ${window.location.origin + window.location.pathname}
4. 모든 저장된 인증 정보를 초기화하고 다시 시도해 보세요.
5. 브라우저 캐시와 쿠키를 지우고 다시 시도해 보세요.
`;

        logDebugInfo('문제 해결 가이드', guide);
        alert(guide);
    }
};

// 전역 객체로 등록
window.SpotifyFix = SpotifyFix;

// 인터페이스 생성
function createFixInterface() {
    // 이미 있으면 제거
    const existingPanel = document.getElementById('spotify-fix-panel');
    if (existingPanel) {
        existingPanel.remove();
    }

    // 새 패널 생성
    const panel = document.createElement('div');
    panel.id = 'spotify-fix-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #282828;
        border: 1px solid #1DB954;
        border-radius: 4px;
        padding: 15px;
        z-index: 9999;
        color: white;
        font-family: Arial, sans-serif;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    `;

    panel.innerHTML = `
        <h3 style="margin-top: 0; color: #1DB954;">Spotify 인증 문제 해결</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="btn-show-settings">현재 설정 확인</button>
            <button id="btn-clear-data">인증 정보 초기화</button>
            <button id="btn-set-api-key">새 API 키 설정</button>
            <button id="btn-show-redirect">리디렉션 URI 확인</button>
            <button id="btn-show-guide">문제 해결 가이드</button>
        </div>
    `;

    document.body.appendChild(panel);

    // 이벤트 리스너 등록
    document.getElementById('btn-show-settings').addEventListener('click', SpotifyFix.showCurrentSettings);
    document.getElementById('btn-clear-data').addEventListener('click', SpotifyFix.clearAllStoredData);
    document.getElementById('btn-set-api-key').addEventListener('click', SpotifyFix.setNewApiKey);
    document.getElementById('btn-show-redirect').addEventListener('click', SpotifyFix.showRedirectUri);
    document.getElementById('btn-show-guide').addEventListener('click', SpotifyFix.showTroubleshootingGuide);
}

// 페이지 로드 시 인터페이스 생성
window.addEventListener('DOMContentLoaded', createFixInterface);

// 콘솔에서 사용 가능하도록 안내 메시지
console.log('[Spotify 문제 해결] Spotify 인증 문제 해결 도구가 로드되었습니다. window.SpotifyFix 객체를 통해 사용할 수 있습니다.');
console.log('[Spotify 문제 해결] 화면 우측 하단에 있는 패널을 사용하거나 다음 명령을 실행하세요:');
console.log('SpotifyFix.showCurrentSettings() - 현재 설정 확인');
console.log('SpotifyFix.clearAllStoredData() - 인증 정보 초기화');
console.log('SpotifyFix.setNewApiKey() - 새 API 키 설정');
console.log('SpotifyFix.showRedirectUri() - 리디렉션 URI 확인');
console.log('SpotifyFix.showTroubleshootingGuide() - 문제 해결 가이드');