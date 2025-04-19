// 사용자 프로필 정보 관리 클래스
import SpotifyClient from '../api/spotify-client.js';

export default class ProfileManager {
    constructor() {
        this.client = SpotifyClient;
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
        try {
            // 사용자 프로필 정보 요청
            const profile = await this.client.getCurrentUserProfile();
            
            // 추가 데이터 로드 (비동기로 진행)
            this.loadAdditionalData();
            
            return profile;
        } catch (error) {
            console.error('프로필 로드 실패:', error);
            throw error;
        }
    }

    // 추가 데이터 로드 (탑 트랙, 아티스트 등)
    async loadAdditionalData() {
        try {
            // 탑 트랙과 아티스트 비동기 요청
            const [topTracks, topArtists] = await Promise.all([
                this.client.getTopTracks('medium_term', 5).catch(() => this.mockData.topTracks),
                this.client.getTopArtists('medium_term', 5).catch(() => this.mockData.topArtists)
            ]);
            
            // 데이터 렌더링
            this.renderTopTracks(topTracks?.items || this.mockData.topTracks);
            this.renderTopArtists(topArtists?.items || this.mockData.topArtists);
            
            return { topTracks, topArtists };
        } catch (error) {
            console.error('추가 데이터 로드 실패:', error);
            // 실패해도 예시 데이터를 렌더링
            this.renderTopTracks(this.mockData.topTracks);
            this.renderTopArtists(this.mockData.topArtists);
        }
    }

    // 탑 트랙 렌더링
    renderTopTracks(tracks) {
        const container = document.getElementById('top-tracks');
        if (!container) return;

        let html = '<h3>최근 인기 트랙</h3><ul class="track-list">';
        
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
        
        html += '</ul>';
        container.innerHTML = html;
    }

    // 탑 아티스트 렌더링
    renderTopArtists(artists) {
        const container = document.getElementById('top-artists');
        if (!container) return;

        let html = '<h3>최근 인기 아티스트</h3><ul class="artist-list">';
        
        artists.forEach(artist => {
            const imageUrl = artist.images?.[0]?.url || '';
            html += `
                <li class="artist-item">
                    <div class="artist-image" style="background-image: url('${imageUrl}')"></div>
                    <span class="artist-name">${artist.name}</span>
                </li>
            `;
        });
        
        html += '</ul>';
        container.innerHTML = html;
    }
}