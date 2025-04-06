/**
 * main.js
 * 애플리케이션의 메인 진입점
 * 초기화 및 이벤트 핸들러 설정
 */

class App {
    /**
     * 애플리케이션 초기화
     */
    constructor() {
        this.ui = new UiManager();
        this.authToken = null;
        this.apiService = null;
        this.currentUser = null;

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 인증 상태 체크
        this.checkAuthStatus();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 로그인 버튼 이벤트
        this.ui.loginBtn.addEventListener('click', () => this.initiateLogin());
        this.ui.loginWelcomeBtn.addEventListener('click', () => this.initiateLogin());

        // 플레이리스트 생성 버튼 이벤트
        this.ui.createPlaylistBtn.addEventListener('click', () => this.showCreatePlaylistDialog());

        // 검색 입력 이벤트
        this.ui.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    /**
     * 인증 상태 확인
     */
    async checkAuthStatus() {
        try {
            // 토큰 체크 (window.authHandler 사용)
            const token = await window.authHandler.getAccessToken();

            if (token) {
                this.authToken = token;
                this.apiService = new SpotifyApiService(token);

                // 사용자 정보 로드
                await this.loadUserInfo();

                // 플레이리스트 로드
                await this.loadPlaylists();

                // UI 업데이트
                this.ui.updateAuthUI(true);
            } else {
                this.ui.updateAuthUI(false);
            }
        } catch (error) {
            console.error('인증 상태 확인 오류:', error);
            this.ui.showError('인증에 실패했습니다. 다시 로그인해주세요.');
            this.ui.updateAuthUI(false);
        }
    }

    /**
     * 로그인 프로세스 시작
     */
    initiateLogin() {
        window.authHandler.authorize();
    }

    /**
     * 사용자 정보 로드
     */
    async loadUserInfo() {
        try {
            this.currentUser = await this.apiService.getCurrentUser();
            this.ui.displayUserProfile(this.currentUser);
        } catch (error) {
            console.error('사용자 정보 로드 오류:', error);
            this.ui.showError('사용자 정보를 가져오는데 실패했습니다.');
        }
    }

    /**
     * 플레이리스트 목록 로드
     */
    async loadPlaylists() {
        try {
            this.ui.showLoading(true);
            this.ui.showError('');

            const response = await this.apiService.getUserPlaylists();
            this.allPlaylists = response.items;

            this.ui.renderPlaylists(this.allPlaylists);
        } catch (error) {
            console.error('플레이리스트 로드 오류:', error);
            this.ui.showError('플레이리스트를 가져오는데 실패했습니다.');
        } finally {
            this.ui.showLoading(false);
        }
    }

    /**
     * 검색 처리
     * @param {string} query - 검색어
     */
    handleSearch(query) {
        if (!this.allPlaylists) return;

        if (!query) {
            this.ui.renderPlaylists(this.allPlaylists);
            return;
        }

        const filteredPlaylists = this.allPlaylists.filter(playlist =>
            playlist.name.toLowerCase().includes(query.toLowerCase())
        );

        this.ui.renderPlaylists(filteredPlaylists);
    }

    /**
     * 플레이리스트 생성 대화상자 표시
     */
    showCreatePlaylistDialog() {
        const playlistName = prompt('새 플레이리스트 이름을 입력하세요:');
        if (playlistName) {
            this.createNewPlaylist(playlistName);
        }
    }

    /**
     * 새 플레이리스트 생성
     * @param {string} name - 플레이리스트 이름
     */
    async createNewPlaylist(name) {
        if (!this.currentUser || !this.apiService) return;

        try {
            this.ui.showLoading(true);

            await this.apiService.createPlaylist(this.currentUser.id, name);

            // 목록 새로고침
            await this.loadPlaylists();

            alert(`'${name}' 플레이리스트가 생성되었습니다.`);
        } catch (error) {
            console.error('플레이리스트 생성 오류:', error);
            this.ui.showError('플레이리스트 생성에 실패했습니다.');
        } finally {
            this.ui.showLoading(false);
        }
    }
}

// DOM이 로드된 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});