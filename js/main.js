/**
 * main.js
 * 애플리케이션의 진입점 역할을 하는 모듈
 * 인증 및 사용자 상호작용 처리를 담당
 */

// 스포티파이 인증 설정
const config = {
    // API 키 (클라이언트 ID)
    clientId: window.__env__?.SPOTIFY_API_KEY || localStorage.getItem('spotify_api_key'),
    
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
 * 디버그 모드 확인 함수
 * @returns {boolean} 디버그 모드 활성화 여부
 */
function isDebugMode() {
    return new URLSearchParams(window.location.search).get('debug') === 'true';
}

/**
 * 디버그 로그 출력 함수
 * @param {string} message - 출력할 메시지
 */
function log(message) {
    if (isDebugMode()) {
        console.log(`[DEBUG] ${message}`);
    }
}

/**
 * 스포티파이 인증 페이지로 리디렉션
 */
function authorize() {
    log('인증 프로세스 시작');
    
    if (!config.clientId) {
        log('API 키가 설정되지 않음');
        alert('스포티파이 API 키(클라이언트 ID)가 설정되지 않았습니다. 관리자에게 문의하세요.');
        return;
    }
    
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${config.clientId}&response_type=token&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scopes.join(' '))}`;
    
    log(`인증 URL로 리디렉션: ${authUrl}`);
    window.location.href = authUrl;
}

/**
 * 인증 토큰 처리
 */
function handleAuthentication() {
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
            
            // 인증 성공 UI 업데이트
            updateUIAfterLogin();
            
            // 모듈 로드 시도
            try {
                // 모듈이 로드되면 플레이리스트 불러오기
                import('./app.js')
                    .then(module => {
                        log('앱 모듈 로드 성공');
                        window.appModule = module;
                        if (module.loadPlaylists) {
                            module.loadPlaylists();
                        }
                    })
                    .catch(error => {
                        log(`앱 모듈 로드 실패: ${error.message}`);
                    });
            } catch (error) {
                log(`모듈 로드 시도 중 오류: ${error.message}`);
            }
        }
    } else if (localStorage.getItem('spotify_access_token')) {
        log('저장된 토큰 발견');
        updateUIAfterLogin();
    }
}

/**
 * 로그인 후 UI 상태 업데이트
 */
function updateUIAfterLogin() {
    // 로그인 버튼 숨기기
    const loginBtn = document.getElementById('login-btn');
    const welcomeSection = document.getElementById('welcome-section');
    const playlistSection = document.getElementById('playlist-section');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (welcomeSection) welcomeSection.classList.add('hidden');
    if (playlistSection) playlistSection.classList.remove('hidden');
    
    // 여기에 사용자 프로필 정보를 가져오는 코드가 추가될 수 있음
}

/**
 * 이벤트 리스너 등록
 */
function registerEventListeners() {
    log('이벤트 리스너 등록');
    
    // 로그인 버튼
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        log('로그인 버튼 발견');
        loginBtn.addEventListener('click', function() {
            log('로그인 버튼 클릭됨');
            authorize();
        });
    }
    
    // 환영 페이지 로그인 버튼
    const loginWelcomeBtn = document.getElementById('login-welcome-btn');
    if (loginWelcomeBtn) {
        log('환영 페이지 로그인 버튼 발견');
        loginWelcomeBtn.addEventListener('click', function() {
            log('환영 페이지 로그인 버튼 클릭됨');
            authorize();
        });
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', function() {
    log('DOM 로드 완료');
    
    // 전역 모듈 객체 생성
    window.appModule = {
        authorize: authorize
    };
    
    // 이벤트 리스너 등록
    registerEventListeners();
    
    // 인증 상태 확인
    handleAuthentication();
});

// 디버그 모드일 경우 시작 로그 출력
log('main.js 로드됨');