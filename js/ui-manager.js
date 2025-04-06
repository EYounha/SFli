/**
 * ui-manager.js
 * 사용자 인터페이스 관련 기능을 처리하는 모듈
 */

class UiManager {
    /**
     * UI 요소 초기화
     */
    constructor() {
        // 버튼 요소
        this.loginBtn = document.getElementById('login-btn');
        this.loginWelcomeBtn = document.getElementById('login-welcome-btn');
        this.createPlaylistBtn = document.getElementById('create-playlist-btn');

        // 섹션 요소
        this.welcomeSection = document.getElementById('welcome-section');
        this.playlistSection = document.getElementById('playlist-section');

        // 프로필 요소
        this.userProfile = document.getElementById('user-profile');
        this.userImg = document.getElementById('user-img');
        this.userName = document.getElementById('user-name');

        // 플레이리스트 컨테이너
        this.playlistContainer = document.getElementById('playlist-container');

        // 로딩 및 에러 요소
        this.loadingElement = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');

        // 검색 요소
        this.searchInput = document.getElementById('search-input');
    }

    /**
     * 로그인 상태 UI 업데이트
     * @param {boolean} isLoggedIn - 로그인 상태
     */
    updateAuthUI(isLoggedIn) {
        if (isLoggedIn) {
            this.loginBtn.classList.add('hidden');
            this.userProfile.style.display = 'flex';
            this.welcomeSection.classList.add('hidden');
            this.playlistSection.classList.remove('hidden');
        } else {
            this.loginBtn.classList.remove('hidden');
            this.userProfile.style.display = 'none';
            this.welcomeSection.classList.remove('hidden');
            this.playlistSection.classList.add('hidden');
        }
    }

    /**
     * 사용자 프로필 정보 표시
     * @param {Object} user - 사용자 정보 객체
     */
    displayUserProfile(user) {
        this.userName.textContent = user.display_name;
        if (user.images && user.images.length > 0) {
            this.userImg.src = user.images[0].url;
        } else {
            this.userImg.src = 'https://via.placeholder.com/40';
        }
    }

    /**
     * 로딩 상태 표시
     * @param {boolean} isLoading - 로딩 중 여부
     */
    showLoading(isLoading) {
        this.loadingElement.style.display = isLoading ? 'block' : 'none';
    }

    /**
     * 에러 메시지 표시
     * @param {string} message - 표시할 에러 메시지
     */
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = message ? 'block' : 'none';
    }

    /**
     * 플레이리스트 목록 렌더링
     * @param {Array} playlists - 플레이리스트 배열
     */
    renderPlaylists(playlists) {
        this.playlistContainer.innerHTML = '';

        playlists.forEach(playlist => {
            const card = this.createPlaylistCard(playlist);
            this.playlistContainer.appendChild(card);
        });
    }

    /**
     * 플레이리스트 카드 요소 생성
     * @param {Object} playlist - 플레이리스트 정보
     * @returns {HTMLElement} 플레이리스트 카드 DOM 요소
     */
    createPlaylistCard(playlist) {
        const card = document.createElement('div');
        card.className = 'playlist-card';

        const imgSrc = playlist.images && playlist.images.length > 0
            ? playlist.images[0].url
            : 'https://via.placeholder.com/150';

        card.innerHTML = `
            <img class="playlist-img" src="${imgSrc}" alt="${playlist.name}">
            <h3 class="playlist-title">${playlist.name}</h3>
            <p class="playlist-info">${playlist.tracks.total}곡</p>
        `;

        card.addEventListener('click', () => {
            window.open(playlist.external_urls.spotify, '_blank');
        });

        return card;
    }
}

// 전역 객체로 내보내기
window.UiManager = UiManager;
