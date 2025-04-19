// 스포티파이 API 클라이언트
import SpotifyAuth from './spotify-auth.js';

// API 베이스 URL
const API_BASE_URL = 'https://api.spotify.com/v1';

// API 요청 헤더 생성
async function getAuthHeaders() {
    const token = await SpotifyAuth.getValidAccessToken();
    if (!token) {
        throw new Error('유효한 액세스 토큰이 없습니다');
    }
    
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// API 요청 실행
async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const headers = await getAuthHeaders();
        const options = {
            method,
            headers
        };
        
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // 응답 상태 확인
        if (response.status === 401) {
            // 401 Unauthorized - 토큰 갱신 시도
            if (SpotifyAuth.isDebugMode()) {
                SpotifyAuth.debugLog('인증 오류, 토큰 갱신 시도...');
            }
            await SpotifyAuth.refreshAccessToken();
            return apiRequest(endpoint, method, body); // 재시도
        }
        
        if (!response.ok) {
            throw new Error(`API 오류 ${response.status}: ${await response.text()}`);
        }
        
        // 응답이 비어있는지 확인
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0') {
            return null;
        }
        
        // 응답에 따라 JSON 또는 텍스트로 처리
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    } catch (error) {
        if (SpotifyAuth.isDebugMode()) {
            SpotifyAuth.debugLog('API 요청 오류:', error);
        }
        throw error;
    }
}

// 현재 사용자 프로필 정보 가져오기
async function getCurrentUserProfile() {
    return await apiRequest('/me');
}

// 사용자의 최근 플레이한 트랙 가져오기
async function getRecentlyPlayed(limit = 20) {
    return await apiRequest(`/me/player/recently-played?limit=${limit}`);
}

// 사용자의 탑 아티스트 가져오기
async function getTopArtists(timeRange = 'medium_term', limit = 10) {
    return await apiRequest(`/me/top/artists?time_range=${timeRange}&limit=${limit}`);
}

// 사용자의 탑 트랙 가져오기
async function getTopTracks(timeRange = 'medium_term', limit = 10) {
    return await apiRequest(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
}

// 사용자의 플레이리스트 가져오기
async function getUserPlaylists(limit = 20, offset = 0) {
    return await apiRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
}

// 플레이리스트의 트랙 가져오기
async function getPlaylistTracks(playlistId, limit = 100, offset = 0) {
    return await apiRequest(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
}

// 모듈 내보내기
export default {
    getCurrentUserProfile,
    getRecentlyPlayed,
    getTopArtists,
    getTopTracks,
    getUserPlaylists,
    getPlaylistTracks,
    apiRequest
};