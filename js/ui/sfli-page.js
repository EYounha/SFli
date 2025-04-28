// SFli 메인 페이지 스크립트 - 리팩토링 버전 (파일 분리됨)
import SfliPage from './sfli-page-core.js';

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    const sfliPage = new SfliPage();
    sfliPage.init();
});

export default SfliPage;