/**
 * environment-config.js
 * 환경 변수 설정을 담당하는 스크립트
 * 스포티파이 API 키와 같은 환경 설정을 관리
 */

// 전역 환경 변수 객체 생성
window.__env__ = window.__env__ || {};

// 디버그 모드 설정 (URL 파라미터에서 확인)
window.__env__.DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === 'true';

// 현재 환경이 GitHub Pages인지 확인
window.__env__.IS_GITHUB_PAGES = window.location.hostname === 'eyounha.github.io';

// 디버그 로그 함수
window.__env__.log = function (source, message) {
    if (window.__env__.DEBUG_MODE) {
        console.log(`[DEBUG][${source}] ${message}`);
    }
};

// 먼저 디버그 키 스크립트 로드 (비동기적으로 로드)
function loadDebugKey() {
    if (window.__env__.DEBUG_MODE && !window.__env__.IS_GITHUB_PAGES) {
        const script = document.createElement('script');
        script.src = 'js/debug_key.js';
        script.onload = function () {
            if (typeof DEBUG_SPOTIFY_API_KEY !== 'undefined' && DEBUG_SPOTIFY_API_KEY && DEBUG_SPOTIFY_API_KEY !== 'YOUR_SPOTIFY_CLIENT_ID_HERE') {
                window.__env__.SPOTIFY_API_KEY = DEBUG_SPOTIFY_API_KEY;
                window.__env__.API_KEY_SOURCE = 'debug_key.js';
                window.__env__.log('EnvConfig', `API 키 소스: ${window.__env__.API_KEY_SOURCE}`);
            } else {
                setupApiKeyFromOtherSources();
            }
        };
        script.onerror = function () {
            window.__env__.log('EnvConfig', 'debug_key.js 로드 실패');
            setupApiKeyFromOtherSources();
        };
        document.head.appendChild(script);
    } else {
        setupApiKeyFromOtherSources();
    }
}

// 다른 소스에서 API 키 설정
function setupApiKeyFromOtherSources() {
    // GitHub Actions 배포 시 %SPOTIFY_API_KEY% 부분이 실제 키로 대체됨
    window.__env__.SPOTIFY_API_KEY = '%SPOTIFY_API_KEY%';
    window.__env__.API_KEY_SOURCE = 'environment variable';

    // API 키 상태 로깅
    if (window.__env__.DEBUG_MODE) {
        if (window.__env__.SPOTIFY_API_KEY === '%SPOTIFY_API_KEY%') {
            window.__env__.log('EnvConfig', '환경 변수의 API 키가 플레이스홀더 상태입니다');

            // 로컬 스토리지에서 API 키 확인
            const storedApiKey = localStorage.getItem('spotify_api_key');
            if (storedApiKey) {
                window.__env__.SPOTIFY_API_KEY = storedApiKey;
                window.__env__.API_KEY_SOURCE = 'localStorage';
                window.__env__.log('EnvConfig', '로컬 스토리지에서 API 키를 가져왔습니다');
            } else {
                window.__env__.log('EnvConfig', '로컬 스토리지에도 API 키가 없습니다');
            }
        } else {
            window.__env__.log('EnvConfig', `API 키 소스: ${window.__env__.API_KEY_SOURCE}`);
        }
    }

    // 환경이 준비되었음을 로그에 기록
    window.__env__.log('EnvConfig', '환경 설정 로드 완료');
}

// 초기화 실행
loadDebugKey();