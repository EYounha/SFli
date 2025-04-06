/**
 * app.js
 * 애플리케이션의 메인 로직과 UI 상호작용을 관리하는 파일
 */

/**
 * 애플리케이션 클래스
 * UI 이벤트, 스포티파이 인증 상태, 플레이리스트 관리 등을 처리
 */
class App {
    constructor() {
        // DOM 요소 참조
        this.loginButton = document.getElementById('login-button');
        this.loginSection = document.getElementById('login-section');
        this.playlistSection = document.getElementById('playlist-section');

        // 이벤트 리스너 등록
        this.registerEventListeners();

        // 인증 상태에 따른 초기 UI 설정
        this.updateUIBasedOnAuthState(spotifyAuth.getAuthStatus());
    }

    /**
     * 이벤트 리스너 등록
     */
    registerEventListeners() {
        // 로그인 버튼 클릭 이벤트
        this.loginButton.addEventListener('click', () => {
            spotifyAuth.initiateLogin();
        });

        // 인증 상태 변경 이벤트
        document.addEventListener('spotifyAuthStateChange', (event) => {
            this.handleAuthStateChange(event.detail);
        });
    }

    /**
     * 인증 상태 변경 처리
     */
    async handleAuthStateChange(authState) {
        const { isAuthenticated, error } = authState;

        // UI 업데이트
        this.updateUIBasedOnAuthState(isAuthenticated);

        // 오류 처리
        if (error) {
            this.showError(error);
            return;
        }

        // 인증 성공 시 사용자 데이터 로드
        if (isAuthenticated) {
            try {
                await this.loadUserData();
            } catch (error) {
                console.error('사용자 데이터 로드 중 오류 발생:', error);
                this.showError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
            }
        }
    }

    /**
     * 인증 상태에 따른 UI 업데이트
     */
    updateUIBasedOnAuthState(isAuthenticated) {
        if (isAuthenticated) {
            // 인증된 경우 플레이리스트 섹션 표시, 로그인 섹션 숨김
            this.loginSection.classList.add('hidden');
            this.playlistSection.classList.remove('hidden');
        } else {
            // 인증되지 않은 경우 로그인 섹션 표시, 플레이리스트 섹션 숨김
            this.loginSection.classList.remove('hidden');
            this.playlistSection.classList.add('hidden');

            // 플레이리스트 섹션 내용 초기화
            this.playlistSection.innerHTML = '';
        }
    }

    /**
     * 사용자 데이터 로드
     */
    async loadUserData() {
        try {
            // 사용자 정보 가져오기
            const userData = await spotifyApi.getCurrentUser();

            // 유저 프로필 렌더링
            this.renderUserProfile(userData);

            // 플레이리스트 데이터 로드
            await this.loadPlaylists();

        } catch (error) {
            console.error('사용자 데이터 로드 실패:', error);
            throw error;
        }
    }

    /**
     * 유저 프로필 렌더링
     */
    renderUserProfile(user) {
        // 플레이리스트 섹션에 유저 프로필 정보 추가
        const profileHTML = `
            <div class="user-profile">
                ${user.images && user.images.length > 0
                ? `<img src="${user.images[0].url}" alt="프로필 이미지" class="profile-image">`
                : '<div class="profile-image-placeholder"></div>'}
                <div class="user-info">
                    <h3>${user.display_name || '사용자'}</h3>
                    <p>${user.email || ''}</p>
                </div>
                <button id="logout-button" class="logout-btn">로그아웃</button>
            </div>
            <div id="playlists-container" class="playlists-container">
                <h2>내 플레이리스트</h2>
                <div id="playlist-list" class="playlist-list"></div>
            </div>
        `;

        this.playlistSection.innerHTML = profileHTML;

        // 로그아웃 버튼 이벤트 리스너 등록
        document.getElementById('logout-button').addEventListener('click', () => {
            spotifyAuth.logout();
        });
    }

    /**
     * 플레이리스트 데이터 로드
     */
    async loadPlaylists() {
        try {
            const playlistsData = await spotifyApi.getUserPlaylists();
            this.renderPlaylists(playlistsData.items);
        } catch (error) {
            console.error('플레이리스트 로드 실패:', error);
            this.showError('플레이리스트를 불러오는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 플레이리스트 목록 렌더링
     */
    renderPlaylists(playlists) {
        const playlistList = document.getElementById('playlist-list');

        if (!playlists || playlists.length === 0) {
            playlistList.innerHTML = '<p class="no-playlists">플레이리스트가 없습니다.</p>';
            return;
        }

        const playlistsHTML = playlists.map(playlist => `
            <div class="playlist-item" data-id="${playlist.id}">
                <div class="playlist-image">
                    ${playlist.images && playlist.images.length > 0
                ? `<img src="${playlist.images[0].url}" alt="${playlist.name}">`
                : '<div class="playlist-image-placeholder"></div>'}
                </div>
                <div class="playlist-info">
                    <h3>${playlist.name}</h3>
                    <p>${playlist.tracks.total}곡</p>
                </div>
            </div>
        `).join('');

        playlistList.innerHTML = playlistsHTML;

        // 플레이리스트 클릭 이벤트 리스너 등록
        const playlistItems = document.querySelectorAll('.playlist-item');
        playlistItems.forEach(item => {
            item.addEventListener('click', () => {
                const playlistId = item.getAttribute('data-id');
                this.loadPlaylistDetails(playlistId);
            });
        });

        // 플레이리스트 생성 버튼 추가
        const createPlaylistBtn = document.createElement('div');
        createPlaylistBtn.className = 'create-playlist-btn';
        createPlaylistBtn.innerHTML = `
            <div class="create-playlist-icon">+</div>
            <p>새 플레이리스트 만들기</p>
        `;
        createPlaylistBtn.addEventListener('click', () => {
            this.showCreatePlaylistModal();
        });

        playlistList.appendChild(createPlaylistBtn);
    }

    /**
     * 선택한 플레이리스트 상세 정보 로드
     */
    async loadPlaylistDetails(playlistId) {
        try {
            // 로딩 상태 표시
            this.showLoading();

            // 플레이리스트 정보 및 트랙 로드
            const playlistData = await spotifyApi.getPlaylist(playlistId);
            const tracksData = await spotifyApi.getPlaylistTracks(playlistId);

            // 상세 정보 표시
            this.renderPlaylistDetails(playlistData, tracksData.items);

            // 로딩 상태 숨김
            this.hideLoading();
        } catch (error) {
            console.error('플레이리스트 상세 정보 로드 실패:', error);
            this.showError('플레이리스트 정보를 불러오는 중 오류가 발생했습니다.');
            this.hideLoading();
        }
    }

    /**
     * 오류 메시지 표시
     */
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;

        document.body.appendChild(errorElement);

        // 3초 후 자동으로 사라짐
        setTimeout(() => {
            errorElement.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(errorElement);
            }, 300);
        }, 3000);
    }

    /**
     * 로딩 상태 표시
     */
    showLoading() {
        // 이미 로딩 요소가 있는지 확인
        if (document.querySelector('.loading-overlay')) {
            return;
        }

        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';

        document.body.appendChild(loadingOverlay);
    }

    /**
     * 로딩 상태 숨김
     */
    hideLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(loadingOverlay);
            }, 300);
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});