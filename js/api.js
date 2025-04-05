/**
 * api.js
 * 스포티파이 API 호출 관련 기능을 처리하는 모듈
 */

import { getToken, removeToken } from './auth.js';

// 스포티파이 API 기본 URL
const API_BASE_URL = 'https://api.spotify.com/v1';

/**
 * API 요청에 사용할 기본 헤더를 생성하는 함수
 * @returns {Object} 인증 토큰이 포함된 헤더 객체
 */
function getHeaders() {
    const token = getToken();
    return {
        'Authorization': `Bearer ${token}`
    };
}

/**
 * 스포티파이 API에 요청을 보내는 기본 함수
 * @param {string} endpoint - API 엔드포인트 경로
 * @param {Object} options - fetch 옵션 (method, body 등)
 * @returns {Promise<Object>} API 응답 데이터
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { ...getHeaders(), ...options.headers };

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // 인증 오류 처리
        if (response.status === 401) {
            removeToken();
            throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }

        // 기타 오류 처리
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API 요청 오류:', error);
        throw error;
    }
}

/**
 * 현재 사용자 프로필 정보를 가져오는 함수
 * @returns {Promise<Object>} 사용자 프로필 데이터
 */
function getCurrentUserProfile() {
    return apiRequest('/me');
}

/**
 * 사용자의 플레이리스트 목록을 가져오는 함수
 * @param {number} limit - 한 번에 가져올 플레이리스트 수
 * @param {number} offset - 시작 오프셋
 * @returns {Promise<Object>} 플레이리스트 목록 데이터
 */
function getUserPlaylists(limit = 20, offset = 0) {
    return apiRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
}

/**
 * 특정 플레이리스트의 상세 정보를 가져오는 함수
 * @param {string} playlistId - 플레이리스트 ID
 * @returns {Promise<Object>} 플레이리스트 상세 데이터
 */
function getPlaylistDetails(playlistId) {
    return apiRequest(`/playlists/${playlistId}`);
}

/**
 * 새 플레이리스트를 생성하는 함수
 * @param {string} userId - 사용자 ID
 * @param {string} name - 플레이리스트 이름
 * @param {string} description - 플레이리스트 설명
 * @param {boolean} isPublic - 공개 여부
 * @returns {Promise<Object>} 생성된 플레이리스트 데이터
 */
function createPlaylist(userId, name, description = '', isPublic = true) {
    return apiRequest(`/users/${userId}/playlists`, {
        method: 'POST',
        body: JSON.stringify({
            name,
            description,
            public: isPublic
        })
    });
}

// 모듈 내보내기
export {
    getCurrentUserProfile,
    getUserPlaylists,
    getPlaylistDetails,
    createPlaylist
};