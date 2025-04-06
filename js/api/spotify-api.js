/**
 * spotify-api.js
 * 스포티파이 API 호출을 담당하는 모듈
 * 플레이리스트 관리 및 곡 검색 기능 구현
 */

/**
 * 스포티파이 API 클래스
 * 플레이리스트, 곡 정보 등 API 호출 관련 기능 제공
 */
class SpotifyAPI {
    /**
     * 생성자 - API 기본 설정 및 인증 이벤트 리스너 등록
     */
    constructor() {
        // API 기본 URL
        this.baseUrl = 'https://api.spotify.com/v1';
        this.isAuthenticated = false;

        // 인증 상태 변경 이벤트 리스너 등록
        document.addEventListener('spotifyAuthStateChange', this.handleAuthStateChange.bind(this));
    }

    /**
     * 인증 상태 변경 처리
     * @param {CustomEvent} event - 인증 상태 변경 이벤트
     */
    handleAuthStateChange(event) {
        this.isAuthenticated = event.detail.isAuthenticated;
    }

    /**
     * API 요청 헤더 생성
     * @returns {Object} 인증 헤더를 포함한 요청 헤더
     */
    getHeaders() {
        const token = spotifyAuth.getAccessToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * API 요청 실행
     * @param {string} endpoint - API 엔드포인트 경로
     * @param {Object} options - fetch 요청 옵션
     * @returns {Promise<Object>} API 응답 데이터
     */
    async fetchAPI(endpoint, options = {}) {
        // 인증 상태 확인
        if (!spotifyAuth.getAuthStatus()) {
            throw new Error('인증이 필요합니다. 먼저 로그인해주세요.');
        }

        try {
            // 요청 URL과 헤더 설정
            const url = this.baseUrl + endpoint;
            const headers = this.getHeaders();

            // API 요청 실행
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...(options.headers || {})
                }
            });

            // 인증 만료 처리 (401 오류)
            if (response.status === 401) {
                // 액세스 토큰 만료 시 갱신 시도
                await spotifyAuth.refreshAccessToken();
                // 토큰 갱신 후 재시도
                return this.fetchAPI(endpoint, options);
            }

            // 기타 오류 처리
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API 오류 상세:', errorData);
                throw new Error(`API 요청 실패: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
            }

            // 응답 데이터 반환
            return await response.json();

        } catch (error) {
            console.error(`API 요청 중 오류 발생: ${error.message}`);
            throw error;
        }
    }

    /**
     * 현재 사용자 정보 가져오기
     * @returns {Promise<Object>} 사용자 프로필 정보
     */
    async getCurrentUser() {
        return await this.fetchAPI('/me');
    }

    /**
     * 사용자의 플레이리스트 목록 가져오기
     * @param {number} limit - 한 번에 가져올 플레이리스트 수
     * @param {number} offset - 시작 오프셋 (페이징용)
     * @returns {Promise<Object>} 플레이리스트 목록 및 페이징 정보
     */
    async getUserPlaylists(limit = 50, offset = 0) {
        return await this.fetchAPI(`/me/playlists?limit=${limit}&offset=${offset}`);
    }

    /**
     * 특정 플레이리스트 정보 가져오기
     * @param {string} playlistId - 플레이리스트 ID
     * @returns {Promise<Object>} 플레이리스트 상세 정보
     */
    async getPlaylist(playlistId) {
        return await this.fetchAPI(`/playlists/${playlistId}`);
    }

    /**
     * 특정 플레이리스트의 트랙 목록 가져오기
     * @param {string} playlistId - 플레이리스트 ID
     * @param {number} limit - 한 번에 가져올 트랙 수
     * @param {number} offset - 시작 오프셋 (페이징용)
     * @returns {Promise<Object>} 트랙 목록 및 페이징 정보
     */
    async getPlaylistTracks(playlistId, limit = 100, offset = 0) {
        return await this.fetchAPI(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
    }
}

// 인스턴스 생성 및 전역으로 내보내기
window.spotifyApi = new SpotifyAPI();