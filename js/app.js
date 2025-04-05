/**
 * app.js
 * 애플리케이션의 메인 로직을 관리하는 모듈
 */

import {
    authorize,
    getTokenFromUrl,
    saveToken,
    isAuthenticated
} from './auth.js';

import {
    getCurrentUserProfile,
    getUserPlaylists,
    getPlaylistDetails
} from './api.js';

import {
    elements,
    initializeElements,
    showLoading,
    showError,
    showToast,
    updateUserProfile,
    renderPlaylists,
    filterPlaylists
} from './ui.js';

/**
 * 애플리케이션 초기화 함수
 * 앱 시작 시 필요한 이벤트 리스너 등록 및 인증 상태 확인
 */
function initApp() {
    console.log('앱 초기화 시작');

    // DOM 요소 초기화
    initializeElements();

    // 이벤트 리스너 등록
    registerEventListeners();

    // 페이지 로드 시 인증 상태 확인
    checkAuthentication();

    console.log('앱 초기화 완료');
}

/**
 * 이벤트 리스너를 등록하는 함수
 */
function registerEventListeners() {
    // 버튼이 DOM에 존재하는지 확인 후 이벤트 리스너 등록
    if (elements.loginBtn) {
        console.log('로그인 버튼에 이벤트 리스너 등록');
        elements.loginBtn.addEventListener('click', () => {
            console.log('로그인 버튼 클릭');
            authorize();
        });
    } else {
        console.error('로그인 버튼을 찾을 수 없습니다');
    }

    if (elements.loginWelcomeBtn) {
        console.log('환영 페이지 로그인 버튼에 이벤트 리스너 등록');
        elements.loginWelcomeBtn.addEventListener('click', () => {
            console.log('환영 페이지 로그인 버튼 클릭');
            authorize();
        });
    }

    // 검색 입력 이벤트 리스너
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            filterPlaylists(e.target.value);
        });
    }

    // 플레이리스트 생성 버튼 이벤트 리스너
    if (elements.createPlaylistBtn) {
        elements.createPlaylistBtn.addEventListener('click', showCreatePlaylistModal);
    }
}

/**
 * 인증 상태를 확인하는 함수
 * URL 파라미터에서 토큰을 추출하거나 저장된 토큰을 확인
 */
function checkAuthentication() {
    // URL에서 액세스 토큰 확인
    const token = getTokenFromUrl();

    if (token) {
        // URL에 토큰이 있는 경우 저장하고 해시 제거
        saveToken(token);
        window.history.replaceState({}, document.title, window.location.pathname);

        // 사용자 정보 및 플레이리스트 로드
        loadUserData();
    } else if (isAuthenticated()) {
        // 저장된 토큰이 있는 경우
        loadUserData();
    }
    // 인증되지 않은 경우 기본 화면 유지
}

/**
 * 사용자 데이터를 로드하는 함수 (프로필, 플레이리스트)
 */
async function loadUserData() {
    try {
        // 사용자 프로필 로드
        const profileData = await getCurrentUserProfile();
        updateUserProfile(profileData);

        // 플레이리스트 로드
        await loadPlaylists();
    } catch (error) {
        showError(error.message);
    }
}

/**
 * 사용자 플레이리스트를 로드하는 함수
 */
async function loadPlaylists() {
    try {
        showLoading(true);

        const data = await getUserPlaylists();
        renderPlaylists(data.items, showPlaylistDetails);
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * 플레이리스트 상세 정보를 표시하는 함수
 * @param {string} playlistId - 플레이리스트 ID
 */
async function showPlaylistDetails(playlistId) {
    try {
        // 상세 기능 구현 예정
        console.log('플레이리스트 상세 정보:', playlistId);
        // 플레이리스트 상세 페이지로 이동하거나 모달 표시 등의 로직 추가
    } catch (error) {
        showError(error.message);
    }
}

/**
 * 플레이리스트 생성 모달을 표시하는 함수
 */
function showCreatePlaylistModal() {
    // 플레이리스트 생성 모달 표시 로직
    showToast('이 기능은 아직 구현 중입니다.', 'info');
}

// 앱 초기화 (DOM이 완전히 로드된 후)
document.addEventListener('DOMContentLoaded', initApp);

// 모듈 내보내기 (다른 파일에서 필요한 경우)
export {
    loadPlaylists,
    showPlaylistDetails
};