/**
 * spotify-api.js
 * 스포티파이 API 호출을 담당하는 모듈
 */

/**
 * 스포티파이 API 클래스
 * 플레이리스트, 곡 정보 등 API 호출 관련 기능 제공
 */
class SpotifyAPI {
    constructor() {
        this.baseUrl = 'https://api.spotify.com/v1';
        // 인증 상태 변경 이벤트 리스너 등록
        document.addEventListener('spotifyAuthStateChange', this.handleAuthStateChange.bind(this));
    }

    /**
     * 인증 상태 변경 처리
     */
    handleAuthStateChange(event) {
        this.isAuthenticated = event.detail.isAuthenticated;
    }

    /**
     * API 요청 헤더 생성
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
     */
    async fetchAPI(endpoint, options = {}) {
        if (!spotifyAuth.getAuthStatus()) {
            throw new Error('인증이 필요합니다');
        }

        try {
            const url = this.baseUrl + endpoint;
            const headers = this.getHeaders();
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...(options.headers || {})
                }
            });

            // 응답 코드 확인
            if (response.status === 401) {
                // 액세스 토큰 만료 시 갱신 시도
                await spotifyAuth.refreshAccessToken();
                // 재시도
                return this.fetchAPI(endpoint, options);
            }

            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`API 요청 중 오류 발생: ${error.message}`);
            throw error;
        }
    }

    /**
     * 현재 사용자 정보 가져오기
     */
    async getCurrentUser() {
        return await this.fetchAPI('/me');
    }

    /**
     * 사용자의 플레이리스트 목록 가져오기
     */
    async getUserPlaylists(limit = 50, offset = 0) {
        return await this.fetchAPI(`/me/playlists?limit=${limit}&offset=${offset}`);
    }

    /**
     * 특정 플레이리스트 정보 가져오기
     */
    async getPlaylist(playlistId) {
        return await this.fetchAPI(`/playlists/${playlistId}`);
    }

    /**
     * 특정 플레이리스트의 트랙 목록 가져오기
     */
    async getPlaylistTracks(playlistId, limit = 100, offset = 0) {
        return await this.fetchAPI(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
    }

    /**
     * 새 플레이리스트 생성
     */
    async createPlaylist(name, description = '', isPublic = false) {
        const userId = (await this.getCurrentUser()).id;
        return await this.fetchAPI(`/users/${userId}/playlists`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                description,
                public: isPublic
            })
        });
    }

    /**
     * 플레이리스트에 트랙 추가
     */
    async addTracksToPlaylist(playlistId, trackUris) {
        return await this.fetchAPI(`/playlists/${playlistId}/tracks`, {
            method: 'POST',
            body: JSON.stringify({
                uris: Array.isArray(trackUris) ? trackUris : [trackUris]
            })
        });
    }

    /**
     * 플레이리스트에서 트랙 제거
     */
    async removeTracksFromPlaylist(playlistId, trackUris) {
        return await this.fetchAPI(`/playlists/${playlistId}/tracks`, {
            method: 'DELETE',
            body: JSON.stringify({
                tracks: Array.isArray(trackUris)
                    ? trackUris.map(uri => ({ uri }))
                    : [{ uri: trackUris }]
            })
        });
    }

    /**
     * 곡 검색
     */
    async searchTracks(query, limit = 20, offset = 0) {
        const encodedQuery = encodeURIComponent(query);
        return await this.fetchAPI(
            `/search?q=${encodedQuery}&type=track&limit=${limit}&offset=${offset}`
        );
    }

    /**
     * 플레이리스트 정보 업데이트
     */
    async updatePlaylist(playlistId, data) {
        return await this.fetchAPI(`/playlists/${playlistId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * 플레이리스트 순서 변경
     */
    async reorderPlaylistTracks(playlistId, rangeStart, insertBefore) {
        return await this.fetchAPI(`/playlists/${playlistId}/tracks`, {
            method: 'PUT',
            body: JSON.stringify({
                range_start: rangeStart,
                insert_before: insertBefore
            })
        });
    }
}

// 인스턴스 생성 및 내보내기
const spotifyApi = new SpotifyAPI();