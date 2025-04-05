/**
 * environment-config.js
 * 환경 변수 설정을 담당하는 스크립트
 * 스포티파이 API 키와 같은 환경 설정을 관리
 */

// 전역 환경 변수 객체 생성
window.__env__ = window.__env__ || {};

// 스포티파이 API 키 설정
// GitHub Actions 배포 시 %SPOTIFY_API_KEY% 부분이 실제 키로 대체됨
window.__env__.SPOTIFY_API_KEY = '%SPOTIFY_API_KEY%';

// 디버그 모드 설정 (URL 파라미터에서 확인)
window.__env__.DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === 'true';

// 디버그 로그 함수
window.__env__.log = function(message) {
    if (window.__env__.DEBUG_MODE) {
        console.log(`[DEBUG] ${message}`);
    }
}

// 환경이 준비되었음을 로그에 기록
window.__env__.log('환경 설정 로드 완료');