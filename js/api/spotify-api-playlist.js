/**
 * spotify-api-playlist.js
 * 스포티파이 플레이리스트 관리 기능을 담당하는 모듈
 * 플레이리스트 생성, 수정, 삭제 및 트랙 관리 기능 구현
 */

/**
 * 플레이리스트 생성
 * @param {string} name - 플레이리스트 이름
 * @param {string} description - 플레이리스트 설명
 * @param {boolean} isPublic - 공개 여부
 * @returns {Promise<Object>} 생성된 플레이리스트 정보
 */
SpotifyAPI.prototype.createPlaylist = async function (name, description = '', isPublic = false) {
    // 현재 사용자 ID 조회
    const userId = (await this.getCurrentUser()).id;

    // 플레이리스트 생성 요청
    return await this.fetchAPI(`/users/${userId}/playlists`, {
        method: 'POST',
        body: JSON.stringify({
            name,
            description,
            public: isPublic
        })
    });
};

/**
 * 플레이리스트에 트랙 추가
 * @param {string} playlistId - 플레이리스트 ID
 * @param {string|string[]} trackUris - 추가할 트랙 URI 또는 URI 배열
 * @returns {Promise<Object>} 추가 결과
 */
SpotifyAPI.prototype.addTracksToPlaylist = async function (playlistId, trackUris) {
    return await this.fetchAPI(`/playlists/${playlistId}/tracks`, {
        method: 'POST',
        body: JSON.stringify({
            uris: Array.isArray(trackUris) ? trackUris : [trackUris]
        })
    });
};

/**
 * 플레이리스트에서 트랙 제거
 * @param {string} playlistId - 플레이리스트 ID
 * @param {string|string[]} trackUris - 제거할 트랙 URI 또는 URI 배열
 * @returns {Promise<Object>} 제거 결과
 */
SpotifyAPI.prototype.removeTracksFromPlaylist = async function (playlistId, trackUris) {
    return await this.fetchAPI(`/playlists/${playlistId}/tracks`, {
        method: 'DELETE',
        body: JSON.stringify({
            tracks: Array.isArray(trackUris)
                ? trackUris.map(uri => ({ uri }))
                : [{ uri: trackUris }]
        })
    });
};

/**
 * 플레이리스트 정보 업데이트
 * @param {string} playlistId - 플레이리스트 ID
 * @param {Object} data - 업데이트할 데이터 (name, description, public)
 * @returns {Promise<Object>} 업데이트 결과
 */
SpotifyAPI.prototype.updatePlaylist = async function (playlistId, data) {
    return await this.fetchAPI(`/playlists/${playlistId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

/**
 * 플레이리스트 내 트랙 순서 변경
 * @param {string} playlistId - 플레이리스트 ID
 * @param {number} rangeStart - 이동할 트랙 시작 인덱스
 * @param {number} insertBefore - 이동할 위치 인덱스
 * @returns {Promise<Object>} 변경 결과
 */
SpotifyAPI.prototype.reorderPlaylistTracks = async function (playlistId, rangeStart, insertBefore) {
    return await this.fetchAPI(`/playlists/${playlistId}/tracks`, {
        method: 'PUT',
        body: JSON.stringify({
            range_start: rangeStart,
            insert_before: insertBefore
        })
    });
};

/**
 * 곡 검색
 * @param {string} query - 검색어
 * @param {number} limit - 검색 결과 수
 * @param {number} offset - 검색 시작 오프셋
 * @returns {Promise<Object>} 검색 결과
 */
SpotifyAPI.prototype.searchTracks = async function (query, limit = 20, offset = 0) {
    // 검색어 URL 인코딩
    const encodedQuery = encodeURIComponent(query);

    // 검색 API 호출
    return await this.fetchAPI(
        `/search?q=${encodedQuery}&type=track&limit=${limit}&offset=${offset}`
    );
};