/**
 * api-service.js
 * 스포티파이 API 통신을 처리하는 서비스 모듈
 */

class SpotifyApiService {
    /**
     * 생성자: 액세스 토큰 초기화
     * @param {string} accessToken - 스포티파이 액세스 토큰
     */
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.baseUrl = 'https://api.spotify.com/v1';
    }

    /**
     * API 요청을 보내는 기본 메서드
     * @param {string} endpoint - API 엔드포인트
     * @param {Object} options - fetch 요청 옵션
     * @returns {Promise<Object>} API 응답 데이터
     */
    async fetchFromApi(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        const fetchOptions = { ...defaultOptions, ...options };
        const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error.message || '스포티파이 API 요청 오류');
        }

        return await response.json();
    }

    /**
     * 현재 사용자 정보 조회
     * @returns {Promise<Object>} 사용자 정보
     */
    async getCurrentUser() {
        return await this.fetchFromApi('/me');
    }

    /**
     * 사용자의 플레이리스트 목록 조회
     * @param {number} limit - 조회할 항목 수
     * @param {number} offset - 시작 오프셋
     * @returns {Promise<Object>} 플레이리스트 목록
     */
    async getUserPlaylists(limit = 20, offset = 0) {
        return await this.fetchFromApi(`/me/playlists?limit=${limit}&offset=${offset}`);
    }

    /**
     * 새 플레이리스트 생성
     * @param {string} userId - 사용자 ID
     * @param {string} name - 플레이리스트 이름
     * @param {string} description - 플레이리스트 설명
     * @returns {Promise<Object>} 생성된 플레이리스트 정보
     */
    async createPlaylist(userId, name, description = '') {
        return await this.fetchFromApi(`/users/${userId}/playlists`, {
            method: 'POST',
            body: JSON.stringify({ name, description, public: false })
        });
    }
}

// 전역 객체로 내보내기
window.SpotifyApiService = SpotifyApiService;
