// 음악 컬렉션 관리 클래스
import SpotifyClient from '../api/spotify-client.js';
import Logger from '../utils/logger.js';

export default class MusicCollection {
    constructor() {
        this.client = SpotifyClient;
        this.logger = new Logger();
        this.playlists = [];
        this.selectedPlaylists = {
            source: null,
            destination: null
        };
        this.sourceTracks = [];
        this.destinationTracks = [];
    }

    // 사용자의 모든 플레이리스트 가져오기
    async loadUserPlaylists() {
        try {
            const response = await this.client.getUserPlaylists(50);
            this.playlists = response.items || [];
            this.logger.debug(`${this.playlists.length}개의 플레이리스트를 불러왔습니다.`);
            return this.playlists;
        } catch (error) {
            this.logger.error('플레이리스트 로드 중 오류:', error);
            return [];
        }
    }

    // 좋아요 트랙 목록 가져오기
    async loadLikedTracks(limit = 50) {
        try {
            const response = await this.client.getLikedTracks(limit);
            this.logger.debug(`${response.items?.length || 0}개의 좋아요 트랙을 불러왔습니다.`);
            return response.items || [];
        } catch (error) {
            this.logger.error('좋아요 트랙 로드 중 오류:', error);
            return [];
        }
    }

    // 특정 플레이리스트의 트랙 가져오기
    async loadPlaylistTracks(playlistId) {
        try {
            const response = await this.client.getPlaylistTracks(playlistId);
            this.logger.debug(`플레이리스트 ${playlistId}에서 ${response.items?.length || 0}개의 트랙을 불러왔습니다.`);
            return response.items || [];
        } catch (error) {
            this.logger.error(`플레이리스트 ${playlistId}의 트랙 로드 중 오류:`, error);
            return [];
        }
    }

    // 소스 플레이리스트 선택
    setSourcePlaylist(playlistId) {
        this.selectedPlaylists.source = playlistId;
        this.logger.debug(`소스 플레이리스트 설정: ${playlistId}`);
    }

    // 대상 플레이리스트 선택
    setDestinationPlaylist(playlistId) {
        this.selectedPlaylists.destination = playlistId;
        this.logger.debug(`대상 플레이리스트 설정: ${playlistId}`);
    }

    // 선택된 트랙을 소스에서 대상으로 이동
    async moveTracksToDestination(trackUris) {
        try {
            const { source, destination } = this.selectedPlaylists;
            if (!source || !destination) {
                throw new Error('소스와 대상 플레이리스트를 모두 선택해야 합니다.');
            }

            if (!trackUris || trackUris.length === 0) {
                throw new Error('이동할 트랙을 선택해야 합니다.');
            }

            this.logger.debug(`소스(${source})에서 대상(${destination})으로 ${trackUris.length}개 트랙 이동 시작`);

            // 대상 플레이리스트에 트랙 추가
            await this.client.addTracksToPlaylist(destination, trackUris);
            
            // 소스 플레이리스트에서 트랙 제거
            await this.client.removeTracksFromPlaylist(source, trackUris);
            
            this.logger.debug('트랙 이동 완료');
            return true;
        } catch (error) {
            this.logger.error('트랙 이동 중 오류:', error);
            throw error;
        }
    }

    // 모든 플레이리스트 UI 렌더링
    renderPlaylistSelector(containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                this.logger.warn(`${containerId} 컨테이너를 찾을 수 없습니다.`);
                return;
            }

            let html = `
                <div class="playlist-selector">
                    <h3>플레이리스트 간 음악 이동</h3>
                    <div class="playlist-transfer-layout">
                        <div class="playlist-column source-column">
                            <div class="playlist-title">플레이리스트 선택</div>
                            <select id="source-playlist" class="playlist-select">
                                <option value="">플레이리스트 선택...</option>
                                <option value="liked">💜 좋아요 표시한 곡</option>
                                ${this.playlists.map(playlist => 
                                    `<option value="${playlist.id}">${playlist.name}</option>`
                                ).join('')}
                            </select>
                            <div id="source-tracks" class="track-container"></div>
                        </div>
                        
                        <div class="transfer-arrow-container">
                            <div class="transfer-arrow">
                                <div class="arrow-head">▶</div>
                                <div class="arrow-text">이동</div>
                            </div>
                        </div>
                        
                        <div class="playlist-column destination-column">
                            <div class="playlist-title">플레이리스트 선택</div>
                            <select id="destination-playlist" class="playlist-select">
                                <option value="">플레이리스트 선택...</option>
                                ${this.playlists.map(playlist => 
                                    `<option value="${playlist.id}">${playlist.name}</option>`
                                ).join('')}
                            </select>
                            <div id="destination-tracks" class="track-container"></div>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button id="move-tracks" class="btn primary" disabled>선택한 트랙 이동</button>
                    </div>
                </div>
            `;

            container.innerHTML = html;
            this.setupEventListeners();
            this.logger.debug('플레이리스트 선택 UI 렌더링 완료');
        } catch (error) {
            this.logger.error('플레이리스트 선택 UI 렌더링 중 오류:', error);
        }
    }

    // 특정 트랙 목록 UI 렌더링
    renderTracks(tracks, containerId, filterTracks = null) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                this.logger.warn(`${containerId} 컨테이너를 찾을 수 없습니다.`);
                return;
            }

            let html = '<ul class="track-list selectable">';
            
            if (!tracks || tracks.length === 0) {
                html += '<li class="empty-item">트랙 없음</li>';
            } else {
                // 중복 트랙 필터링
                let filteredTracks = tracks;
                if (filterTracks && filterTracks.length > 0) {
                    // 대상 플레이리스트에 이미 있는 트랙 URI 집합 생성
                    const filterTrackUris = new Set(filterTracks.map(item => {
                        const track = item.track || item;
                        return track.uri;
                    }));

                    // 이미 대상에 있는 트랙 필터링
                    filteredTracks = tracks.filter(item => {
                        const track = item.track || item;
                        return !filterTrackUris.has(track.uri);
                    });
                }

                if (filteredTracks.length === 0) {
                    html += '<li class="empty-item">이동 가능한 트랙이 없습니다</li>';
                } else {
                    filteredTracks.forEach((item, index) => {
                        // 트랙 정보는 item.track에 있거나 직접 item일 수 있음
                        const track = item.track || item;
                        const imageUrl = track.album?.images?.[0]?.url || '';
                        const artists = track.artists?.map(a => a.name).join(', ') || '알 수 없는 아티스트';
                        
                        html += `
                            <li class="track-item" data-uri="${track.uri}">
                                <div class="track-checkbox">
                                    <input type="checkbox" id="track-${track.id}" data-uri="${track.uri}">
                                </div>
                                <div class="track-image" style="background-image: url('${imageUrl}')"></div>
                                <div class="track-info">
                                    <span class="track-name">${track.name}</span>
                                    <span class="track-artist">${artists}</span>
                                </div>
                            </li>
                        `;
                    });
                }
            }
            
            html += '</ul>';
            container.innerHTML = html;
            this.logger.debug(`${containerId}에 트랙 렌더링 완료 (${tracks?.length || 0}개 중 ${filteredTracks?.length || 0}개 표시)`);
            return filteredTracks?.length || 0;
        } catch (error) {
            this.logger.error('트랙 렌더링 중 오류:', error);
            return 0;
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        try {
            const sourceSelect = document.getElementById('source-playlist');
            const destSelect = document.getElementById('destination-playlist');
            const moveButton = document.getElementById('move-tracks');
            
            if (sourceSelect) {
                sourceSelect.addEventListener('change', async (e) => {
                    const playlistId = e.target.value;
                    this.setSourcePlaylist(playlistId);
                    
                    let tracks = [];
                    if (playlistId === 'liked') {
                        const likedTracks = await this.loadLikedTracks();
                        tracks = likedTracks;
                        this.sourceTracks = likedTracks;
                    } else if (playlistId) {
                        const playlistTracks = await this.loadPlaylistTracks(playlistId);
                        tracks = playlistTracks;
                        this.sourceTracks = playlistTracks;
                    } else {
                        this.sourceTracks = [];
                    }
                    
                    // 대상 플레이리스트의 트랙을 기준으로 소스 트랙 필터링
                    this.renderTracks(tracks, 'source-tracks', this.destinationTracks);
                    this.updateMoveButtonState();
                    
                    // 소스가 바뀌면 대상 트랙도 다시 렌더링
                    if (this.selectedPlaylists.destination && this.destinationTracks.length > 0) {
                        this.renderTracks(this.destinationTracks, 'destination-tracks');
                    }
                });
            }
            
            if (destSelect) {
                destSelect.addEventListener('change', async (e) => {
                    const playlistId = e.target.value;
                    this.setDestinationPlaylist(playlistId);
                    
                    if (playlistId) {
                        const tracks = await this.loadPlaylistTracks(playlistId);
                        this.destinationTracks = tracks;
                        this.renderTracks(tracks, 'destination-tracks');
                        
                        // 대상 플레이리스트가 바뀌었으면 소스 트랙도 다시 렌더링 (필터링 위해)
                        if (this.selectedPlaylists.source && this.sourceTracks.length > 0) {
                            this.renderTracks(this.sourceTracks, 'source-tracks', this.destinationTracks);
                        }
                    } else {
                        this.destinationTracks = [];
                        this.renderTracks([], 'destination-tracks');
                        
                        // 대상이 선택 해제되면 소스 트랙 필터링 없이 다시 렌더링
                        if (this.selectedPlaylists.source && this.sourceTracks.length > 0) {
                            this.renderTracks(this.sourceTracks, 'source-tracks');
                        }
                    }
                    
                    this.updateMoveButtonState();
                });
            }
            
            if (moveButton) {
                moveButton.addEventListener('click', async () => {
                    const selectedTracks = this.getSelectedTracks();
                    if (selectedTracks.length === 0) {
                        alert('이동할 트랙을 선택해주세요.');
                        return;
                    }
                    
                    try {
                        moveButton.disabled = true;
                        moveButton.textContent = '이동 중...';
                        
                        await this.moveTracksToDestination(selectedTracks);
                        
                        // 이동 완료 후 두 플레이리스트 트랙 목록 새로고침
                        if (this.selectedPlaylists.source === 'liked') {
                            const likedTracks = await this.loadLikedTracks();
                            this.sourceTracks = likedTracks;
                        } else {
                            const sourceTracks = await this.loadPlaylistTracks(this.selectedPlaylists.source);
                            this.sourceTracks = sourceTracks;
                        }
                        
                        const destTracks = await this.loadPlaylistTracks(this.selectedPlaylists.destination);
                        this.destinationTracks = destTracks;
                        
                        // 업데이트된 트랙 목록 렌더링 (필터링 적용)
                        this.renderTracks(this.sourceTracks, 'source-tracks', this.destinationTracks);
                        this.renderTracks(this.destinationTracks, 'destination-tracks');
                        
                        alert('선택한 트랙이 성공적으로 이동되었습니다!');
                    } catch (error) {
                        alert(`트랙 이동 중 오류가 발생했습니다: ${error.message}`);
                    } finally {
                        moveButton.disabled = false;
                        moveButton.textContent = '선택한 트랙 이동';
                    }
                });
            }
            
            // 트랙 선택 상태 변경 시 이동 버튼 상태 업데이트를 위한 이벤트 위임
            document.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox' && e.target.closest('.track-item')) {
                    this.updateMoveButtonState();
                }
            });
            
            this.logger.debug('플레이리스트 관리 이벤트 리스너 설정 완료');
        } catch (error) {
            this.logger.error('이벤트 리스너 설정 중 오류:', error);
        }
    }
    
    // 이동 버튼 활성화/비활성화 상태 업데이트
    updateMoveButtonState() {
        const moveButton = document.getElementById('move-tracks');
        if (!moveButton) return;
        
        const hasSource = !!this.selectedPlaylists.source;
        const hasDestination = !!this.selectedPlaylists.destination;
        const hasSelectedTracks = this.getSelectedTracks().length > 0;
        
        moveButton.disabled = !(hasSource && hasDestination && hasSelectedTracks);
    }
    
    // 선택된 트랙 URI 가져오기
    getSelectedTracks() {
        const trackContainer = document.getElementById('source-tracks');
        if (!trackContainer) return [];
        
        const selectedCheckboxes = trackContainer.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.uri);
    }

    // 초기화 함수
    async init(containerId) {
        try {
            await this.loadUserPlaylists();
            this.renderPlaylistSelector(containerId);
            this.logger.debug('MusicCollection 초기화 완료');
        } catch (error) {
            this.logger.error('MusicCollection 초기화 중 오류:', error);
        }
    }
}