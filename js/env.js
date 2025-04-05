/**
 * env.js
 * 이 파일은 더 이상 사용되지 않습니다.
 * environment-config.js 파일로 통합되었습니다.
 * 하위 호환성을 위해 남겨두었습니다.
 */

// environment-config.js 파일을 로드 (이미 로드되었는지 확인)
if (!window.__env__) {
    const script = document.createElement('script');
    script.src = 'js/environment-config.js';
    document.head.appendChild(script);
    console.warn('[DEPRECATED] env.js 대신 environment-config.js를 직접 사용하세요.');
}