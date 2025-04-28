// UI 상태 관리를 담당하는 클래스
export default class AppUI {
    constructor() {
        this.initElements();
        this.isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
        
        // 디버그 모드면 디버그 패널 초기화
        if (this.isDebugMode) {
            this.initDebugPanel();
        }
    }

    // DOM 엘리먼트 참조 초기화
    initElements() {
        this.loginSection = document.getElementById('login-section');
        this.loadingSection = document.getElementById('loading-section');
        this.loggedInSection = document.getElementById('logged-in-section');
        this.userProfileSection = document.getElementById('user-profile');
        this.errorMessage = document.getElementById('error-message');
        this.debugPanel = document.getElementById('debug-panel');
    }
    
    // 디버그 패널 초기화
    initDebugPanel() {
        if (!this.debugPanel) return;
        
        // 디버그 패널 스타일 조정
        this.debugPanel.style.display = 'block';
        this.debugPanel.style.position = 'fixed';
        this.debugPanel.style.bottom = '0';
        this.debugPanel.style.right = '0';
        this.debugPanel.style.zIndex = '9999';
        
        // 디버그 패널 토글 버튼 추가
        const toggleButton = document.createElement('button');
        toggleButton.textContent = '접기/펼치기';
        toggleButton.className = 'debug-toggle-btn';
        toggleButton.onclick = () => this.toggleDebugPanel();
        
        // 디버그 패널에 토글 버튼 추가
        this.debugPanel.prepend(toggleButton);
        
        // 디버그 로그의 높이 설정
        const debugLog = document.getElementById('debug-log');
        if (debugLog) {
            debugLog.style.maxHeight = '300px';
            debugLog.style.overflowY = 'auto';
        }
    }
    
    // 디버그 패널 토글
    toggleDebugPanel() {
        const debugLog = document.getElementById('debug-log');
        if (debugLog) {
            debugLog.style.display = debugLog.style.display === 'none' ? 'block' : 'none';
        }
    }

    // 로그인 화면 표시
    showLogin() {
        this.hideLoading();
        this.loginSection.style.display = 'flex';
        this.loggedInSection.style.display = 'none';
        
        // 디버그 패널은 그대로 유지
    }

    // 로딩 화면 표시
    showLoading() {
        this.loginSection.style.display = 'none';
        this.loggedInSection.style.display = 'none';
        this.loadingSection.style.display = 'flex';
        
        // 디버그 패널은 그대로 유지
    }

    // 로딩 화면 숨기기
    hideLoading() {
        this.loadingSection.style.display = 'none';
        
        // 디버그 패널은 그대로 유지
    }

    // 에러 메시지 표시
    showError(message) {
        this.hideLoading();
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        
        // 5초 후 에러 메시지 숨기기
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 5000);
        
        // 디버그 패널은 그대로 유지
    }

    // 로그인 후 화면 표시
    showLoggedIn(profile) {
        this.hideLoading();
        this.loginSection.style.display = 'none';
        this.loggedInSection.style.display = 'block';
        
        // 사용자 프로필 정보 표시
        this.renderUserProfile(profile);
        
        // 디버그 패널은 그대로 유지
    }

    // 사용자 프로필 정보 렌더링
    renderUserProfile(profile) {
        // 프로필 이미지
        const avatar = profile.images && profile.images.length > 0 
            ? profile.images[0].url 
            : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMGM1LjUyMyAwIDEwIDQuNDc3IDEwIDEwcy00LjQ3NyAxMC0xMCAxMFMwIDE1LjUyMyAwIDEwIDQuNDc3IDAgMTAgMHptMCAxOGM0LjQxMiAwIDgtMy41ODggOC04cy0zLjU4OC04LTgtOC04IDMuNTg4LTggOCAzLjU4OCA4IDggOHptMC04Yy0xLjEwNSAwLTIgLjg5NS0yIDJzLjg5NSAyIDIgMiAyLS44OTUgMi0yLS44OTUtMi0yLTJ6bTAtNWMxLjY1NyAwIDMgMS4zNDMgMyAzcy0xLjM0MyAzLTMgMy0zLTEuMzQzLTMtMyAxLjM0My0zIDMtM3oiIGZpbGw9IiNhZmIxYjMiLz48L3N2Zz4=';

        // 프로필 정보 표시
        this.userProfileSection.innerHTML = `
            <img src="${avatar}" alt="프로필 이미지" class="user-avatar">
            <div class="user-info">
                <h2>${profile.display_name || '사용자'}</h2>
                <p>${profile.email || ''}</p>
                <p>${profile.followers ? profile.followers.total + '명의 팔로워' : ''}</p>
            </div>
        `;
    }
}