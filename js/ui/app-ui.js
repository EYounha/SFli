// UI 상태 관리를 담당하는 클래스
export default class AppUI {
    constructor() {
        this.initElements();
    }

    // DOM 엘리먼트 참조 초기화
    initElements() {
        this.loginSection = document.getElementById('login-section');
        this.loadingSection = document.getElementById('loading-section');
        this.loggedInSection = document.getElementById('logged-in-section');
        this.userProfileSection = document.getElementById('user-profile');
        this.errorMessage = document.getElementById('error-message');
    }

    // 로그인 화면 표시
    showLogin() {
        this.hideLoading();
        this.loginSection.style.display = 'flex';
        this.loggedInSection.style.display = 'none';
    }

    // 로딩 화면 표시
    showLoading() {
        this.loginSection.style.display = 'none';
        this.loggedInSection.style.display = 'none';
        this.loadingSection.style.display = 'flex';
    }

    // 로딩 화면 숨기기
    hideLoading() {
        this.loadingSection.style.display = 'none';
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
    }

    // 로그인 후 화면 표시
    showLoggedIn(profile) {
        this.hideLoading();
        this.loginSection.style.display = 'none';
        this.loggedInSection.style.display = 'block';
        
        // 사용자 프로필 정보 표시
        this.renderUserProfile(profile);
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