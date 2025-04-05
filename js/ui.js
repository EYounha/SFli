/**
 * ui.js
 * 사용자 인터페이스 관련 기능을 처리하는 모듈
 */

/**
 * DOM 요소 캐시
 * 페이지가 완전히 로드된 후 DOM 요소에 접근하도록 수정
 */
let elements = {
    toastContainer: null // 토스트 컨테이너는 동적으로 생성
};

/**
 * DOM 요소들을 초기화하는 함수
 * 페이지 로드 후 호출하여 모든 DOM 요소에 대한 참조를 안전하게 가져옴
 */
function initializeElements() {
    elements = {
        loginBtn: document.getElementById('login-btn'),
        loginWelcomeBtn: document.getElementById('login-welcome-btn'),
        userProfile: document.getElementById('user-profile'),
        userImg: document.getElementById('user-img'),
        userName: document.getElementById('user-name'),
        welcomeSection: document.getElementById('welcome-section'),
        playlistSection: document.getElementById('playlist-section'),
        playlistContainer: document.getElementById('playlist-container'),
        loading: document.getElementById('loading'),
        errorMessage: document.getElementById('error-message'),
        searchInput: document.getElementById('search-input'),
        createPlaylistBtn: document.getElementById('create-playlist-btn'),
        toastContainer: elements.toastContainer
    };

    // 요소 존재 여부 확인 및 디버깅 로그
    console.log('UI 요소 초기화 완료:', {
        'loginBtn 존재': !!elements.loginBtn,
        'loginWelcomeBtn 존재': !!elements.loginWelcomeBtn
    });
}

/**
 * 로딩 상태 표시를 제어하는 함수
 * @param {boolean} isVisible - 로딩 표시 여부
 */
function showLoading(isVisible) {
    if (elements.loading) {
        elements.loading.style.display = isVisible ? 'block' : 'none';
    }
}

/**
 * 오류 메시지를 표시하는 함수
 * @param {string} message - 표시할 오류 메시지
 * @param {number} duration - 메시지 표시 시간(ms)
 */
function showError(message, duration = 5000) {
    if (!elements.errorMessage) return;

    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';

    // 일정 시간 후 메시지 숨기기
    setTimeout(() => {
        elements.errorMessage.style.display = 'none';
    }, duration);
}

/**
 * 토스트 메시지를 표시하는 함수
 * @param {string} message - 표시할 메시지
 * @param {string} type - 메시지 유형 ('info', 'error', 'warning', 'success')
 * @param {number} duration - 메시지 표시 시간(ms)
 */
function showToast(message, type = 'info', duration = 3000) {
    // 토스트 컨테이너가 없으면 생성
    if (!elements.toastContainer) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(container);
        elements.toastContainer = container;
    }

    // 토스트 요소 생성
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // 토스트 스타일 설정
    toast.style.cssText = `
        margin-top: 10px;
        padding: 12px 20px;
        min-width: 250px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s ease, fadeOut 0.3s ${duration / 1000 - 0.3}s ease forwards;
        opacity: 0;
    `;

    // 토스트 유형에 따른 배경색 설정
    switch (type) {
        case 'error':
            toast.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            toast.style.backgroundColor = '#f39c12';
            break;
        case 'success':
            toast.style.backgroundColor = '#2ecc71';
            break;
        default: // info
            toast.style.backgroundColor = '#3498db';
    }

    // CSS 애니메이션 스타일 추가
    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }

    // 토스트를 컨테이너에 추가
    elements.toastContainer.appendChild(toast);

    // 토스트를 일정 시간 후 제거
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, duration);
}

/**
 * 사용자 프로필 정보를 UI에 표시하는 함수
 * @param {Object} profileData - 사용자 프로필 데이터
 */
function updateUserProfile(profileData) {
    if (!elements.userName || !elements.userImg) return;

    elements.userName.textContent = profileData.display_name;

    // 프로필 이미지 설정
    if (profileData.images && profileData.images.length > 0) {
        elements.userImg.src = profileData.images[0].url;
    } else {
        elements.userImg.src = 'https://via.placeholder.com/40';
    }

    // UI 상태 업데이트
    elements.loginBtn.style.display = 'none';
    elements.userProfile.style.display = 'flex';
    elements.welcomeSection.classList.add('hidden');
    elements.playlistSection.classList.remove('hidden');
}

/**
 * 플레이리스트 요소를 생성하는 함수
 * @param {Object} playlist - 플레이리스트 데이터
 * @param {Function} onClickHandler - 클릭 이벤트 핸들러
 * @returns {HTMLElement} 생성된 플레이리스트 요소
 */
function createPlaylistElement(playlist, onClickHandler) {
    const playlistCard = document.createElement('div');
    playlistCard.className = 'playlist-card';
    playlistCard.dataset.playlistId = playlist.id;

    // 이미지 URL 설정
    const imgUrl = playlist.images.length > 0 ?
        playlist.images[0].url : 'https://via.placeholder.com/300';

    // 내부 HTML 설정
    playlistCard.innerHTML = `
        <img src="${imgUrl}" alt="${playlist.name}" class="playlist-img">
        <div class="playlist-title">${playlist.name}</div>
        <div class="playlist-info">${playlist.tracks.total}곡</div>
    `;

    // 클릭 이벤트 핸들러 등록
    if (onClickHandler) {
        playlistCard.addEventListener('click', () => {
            onClickHandler(playlist.id);
        });
    }

    return playlistCard;
}

/**
 * 플레이리스트 목록을 UI에 표시하는 함수
 * @param {Array} playlists - 플레이리스트 배열
 * @param {Function} onPlaylistClick - 플레이리스트 클릭 이벤트 핸들러
 */
function renderPlaylists(playlists, onPlaylistClick) {
    if (!elements.playlistContainer) return;

    elements.playlistContainer.innerHTML = '';

    if (playlists.length === 0) {
        elements.playlistContainer.innerHTML =
            '<p>플레이리스트가 없습니다. 새 플레이리스트를 만들어보세요!</p>';
        return;
    }

    playlists.forEach(playlist => {
        const playlistElement = createPlaylistElement(playlist, onPlaylistClick);
        elements.playlistContainer.appendChild(playlistElement);
    });
}

/**
 * 플레이리스트 검색 필터링 함수
 * @param {string} searchTerm - 검색어
 */
function filterPlaylists(searchTerm) {
    if (!elements.playlistContainer) return;

    const playlistCards = elements.playlistContainer.querySelectorAll('.playlist-card');
    const searchLower = searchTerm.toLowerCase();

    playlistCards.forEach(card => {
        const title = card.querySelector('.playlist-title').textContent.toLowerCase();
        card.style.display = title.includes(searchLower) ? 'block' : 'none';
    });
}

// 모듈 내보내기
export {
    elements,
    initializeElements,
    showLoading,
    showError,
    showToast,
    updateUserProfile,
    renderPlaylists,
    filterPlaylists
};