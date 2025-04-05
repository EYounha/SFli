/**
 * main.js
 * 애플리케이션의 진입점 역할을 하는 모듈
 * 사용자 인터페이스 처리 및 이벤트 핸들링 담당
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

/**
 * 이벤트 리스너 등록
 */
function registerEventListeners() {
    log('이벤트 리스너 등록');

    // 로그인 버튼
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        log('로그인 버튼 발견');
        loginBtn.addEventListener('click', function () {
            log('로그인 버튼 클릭됨');
            window.authHandler.authorize();
        });
    }

    // 환영 페이지 로그인 버튼
    const loginWelcomeBtn = document.getElementById('login-welcome-btn');
    if (loginWelcomeBtn) {
        log('환영 페이지 로그인 버튼 발견');
        loginWelcomeBtn.addEventListener('click', function () {
            log('환영 페이지 로그인 버튼 클릭됨');
            window.authHandler.authorize();
        });
    }
}

/**
 * 앱 초기화 함수
 */
function initApp() {
    log('앱 초기화 시작');
    
    // 전역 모듈 객체 생성
    window.appModule = {
        authorize: window.authHandler?.authorize || function() {
            log('인증 핸들러가 아직 로드되지 않았습니다');
        }
    };

    // 이벤트 리스너 등록
    registerEventListeners();

    // 인증 상태 확인
    if (window.authHandler) {
        window.authHandler.handleAuthentication(updateUIAfterLogin);
    } else {
        log('인증 핸들러가 로드되지 않았습니다');
    }
    
    log('앱 초기화 완료');
}

// DOM이 로드된 후 앱 초기화
document.addEventListener('DOMContentLoaded', initApp);

// 디버그 모드일 경우 시작 로그 출력
log('main.js 로드됨');