/**
 * env.js
 * 환경 변수를 로드하는 스크립트
 * 빌드 시 GitHub Actions에서 환경 변수 값을 주입
 */

// 전역 환경 변수 객체 생성
window.__env__ = window.__env__ || {};

// GitHub Repository secrets의 APIKEY 값을 사용
// 이 값은 GitHub Actions에서 빌드 시 SPOTIFY_API_KEY로 대체됨
window.__env__.SPOTIFY_API_KEY = '%SPOTIFY_API_KEY%';