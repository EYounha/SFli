// 사용자 프로필 정보 관리 클래스
import SpotifyClient from '../api/spotify-client.js';
import Logger from '../utils/logger.js';

export default class ProfileManager {
    constructor() {
        this.client = SpotifyClient;
        this.isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
        this.logger = new Logger(this.isDebugMode);
        
        this.mockData = {
            topTracks: [
                { name: '노래 제목 1', artists: [{ name: '아티스트 1' }], album: { images: [{ url: '' }] } },
                { name: '노래 제목 2', artists: [{ name: '아티스트 2' }], album: { images: [{ url: '' }] } },
                { name: '노래 제목 3', artists: [{ name: '아티스트 3' }], album: { images: [{ url: '' }] } }
            ],
            topArtists: [
                { name: '아티스트 1', images: [{ url: '' }] },
                { name: '아티스트 2', images: [{ url: '' }] },
                { name: '아티스트 3', images: [{ url: '' }] }
            ]
        };
    }

    // 사용자 프로필 로드
    async loadUserProfile() {
        this.logger.debug('사용자 프로필 로드 시작');
        
        try {
            // 사용자 프로필 정보 요청
            this.logger.debug('스포티파이 API에 사용자 프로필 요청 중...');
            const profile = await this.client.getCurrentUserProfile();
            
            if (!profile || !profile.id) {
                this.logger.error('유효하지 않은 프로필 응답:', profile);
                throw new Error('프로필 정보를 가져올 수 없습니다');
            }
            
            this.logger.debug('프로필 정보 수신 성공:', {
                id: profile.id,
                name: profile.display_name,
                email: profile.email
            });
            
            // 프로필 렌더링
            this.renderProfile(profile);
            
            // 추가 데이터 로드 (비동기로 진행)
            this.logger.debug('추가 데이터 로드 시작');
            this.loadAdditionalData();
            
            return profile;
        } catch (error) {
            this.logger.error('프로필 로드 실패:', error);
            throw error;
        }
    }

    // 프로필 정보 렌더링
    renderProfile(profile) {
        try {
            const container = document.getElementById('user-profile');
            if (!container) {
                this.logger.warn('프로필 컨테이너를 찾을 수 없음');
                return;
            }
            
            const imageUrl = profile.images && profile.images[0] ? profile.images[0].url : '';
            
            let html = `
                <div class="profile-header">
                    <div class="profile-image" style="background-image: url('${imageUrl}')"></div>
                    <div class="profile-info">
                        <h2 class="profile-name">${profile.display_name || '사용자'}</h2>
                        <p class="profile-email">${profile.email || ''}</p>
                        <p class="profile-detail">팔로워: ${profile.followers?.total || 0}</p>
                    </div>
                </div>
            `;
            
            container.innerHTML = html;
            this.logger.debug('프로필 렌더링 완료');
        } catch (error) {
            this.logger.error('프로필 렌더링 중 오류:', error);
        }
    }

    // 추가 데이터 로드 (탑 트랙, 아티스트 등)
    async loadAdditionalData() {
        try {
            // 탑 트랙 요청
            this.logger.debug('인기 트랙 데이터 요청 중...');
            const topTracks = await this.client.getTopTracks('medium_term', 5)
                .catch(err => {
                    this.logger.warn('인기 트랙 로드 실패, 대체 데이터 사용:', err);
                    return {items: this.mockData.topTracks};
                });
            
            // 탑 아티스트 요청
            this.logger.debug('인기 아티스트 데이터 요청 중...');
            const topArtists = await this.client.getTopArtists('medium_term', 5)
                .catch(err => {
                    this.logger.warn('인기 아티스트 로드 실패, 대체 데이터 사용:', err);
                    return {items: this.mockData.topArtists};
                });
            
            // 데이터 렌더링
            this.logger.debug('인기 트랙 및 아티스트 데이터 렌더링 시작');
            this.renderTopTracks(topTracks?.items || this.mockData.topTracks);
            this.renderTopArtists(topArtists?.items || this.mockData.topArtists);
            this.logger.debug('추가 데이터 렌더링 완료');
            
            return { topTracks, topArtists };
        } catch (error) {
            this.logger.error('추가 데이터 로드 중 오류:', error);
            // 실패해도 예시 데이터를 렌더링
            this.renderTopTracks(this.mockData.topTracks);
            this.renderTopArtists(this.mockData.topArtists);
        }
    }

    // 탑 트랙 렌더링
    renderTopTracks(tracks) {
        try {
            const container = document.getElementById('top-tracks');
            if (!container) {
                this.logger.warn('인기 트랙 컨테이너를 찾을 수 없음');
                return;
            }

            let html = '<h3>최근 인기 트랙</h3><ul class="track-list">';
            
            if (!tracks || tracks.length === 0) {
                html += '<li class="empty-item">인기 트랙 정보가 없습니다</li>';
            } else {
                tracks.forEach(track => {
                    const imageUrl = track.album?.images?.[0]?.url || '';
                    html += `
                        <li class="track-item">
                            <div class="track-image" style="background-image: url('${imageUrl}')"></div>
                            <div class="track-info">
                                <span class="track-name">${track.name}</span>
                                <span class="track-artist">${track.artists?.[0]?.name || '알 수 없는 아티스트'}</span>
                            </div>
                        </li>
                    `;
                });
            }
            
            html += '</ul>';
            container.innerHTML = html;
            this.logger.debug('인기 트랙 렌더링 완료');
        } catch (error) {
            this.logger.error('트랙 렌더링 중 오류:', error);
        }
    }

    // 탑 아티스트 렌더링
    renderTopArtists(artists) {
        try {
            const container = document.getElementById('top-artists');
            if (!container) {
                this.logger.warn('인기 아티스트 컨테이너를 찾을 수 없음');
                return;
            }

            let html = '<h3>최근 인기 아티스트</h3><ul class="artist-list">';
            
            if (!artists || artists.length === 0) {
                html += '<li class="empty-item">인기 아티스트 정보가 없습니다</li>';
            } else {
                artists.forEach(artist => {
                    const imageUrl = artist.images?.[0]?.url || '';
                    html += `
                        <li class="artist-item">
                            <div class="artist-image" style="background-image: url('${imageUrl}')"></div>
                            <span class="artist-name">${artist.name}</span>
                        </li>
                    `;
                });
            }
            
            html += '</ul>';
            container.innerHTML = html;
            this.logger.debug('인기 아티스트 렌더링 완료');
        } catch (error) {
            this.logger.error('아티스트 렌더링 중 오류:', error);
        }
    }
}