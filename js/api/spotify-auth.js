// spotify-auth.js - 스포티파이 인증 처리 메인 모듈 (파일 분리 버전)

// 분리된 모듈 가져오기
import { 
    SPOTIFY_CONFIG, 
    STORAGE_KEYS, 
    logger, 
    isDebugMode, 
    debugLog, 
    setLogger 
} from './spotify-auth-config.js';

import {
    getRedirectUri,
    generateRandomString,
    getStoredAuthState,
    setCookie,
    getCookie
} from './spotify-auth-utils.js';

import {
    getAccessToken,
    saveTokenData,
    getTokenData
} from './spotify-auth-token.js';

import {
    isTokenExpired,
    refreshAccessToken,
    getValidAccessToken,
    isLoggedIn,
    logout
} from './spotify-auth-token2.js';

// 디버그 키 로드 (로컬 개발 환경인 경우)
async function loadCredentials() {
    try {
        logger.debug('자격 증명 로드 시작');
        
        // 동적 리디렉션 URI 설정
        SPOTIFY_CONFIG.REDIRECT_URI = getRedirectUri();
        logger.debug('리디렉션 URI 설정:', SPOTIFY_CONFIG.REDIRECT_URI);
        
        // 현재 호스트 확인
        const currentHost = window.location.hostname;
        
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            try {
                logger.debug('로컬 환경 감지됨, 디버그 키 로드 시도...');
                
                const debugCredentials = await import('../../debug_key.js')
                    .catch(e => {
                        logger.error('debug_key.js 로드 실패:', e);
                        throw new Error('디버그 키 파일을 로드할 수 없습니다. 파일이 루트 디렉토리에 있는지 확인하세요.');
                    });
                
                if (debugCredentials.default) {
                    logger.debug('디버그 키 로드됨');
                    
                    SPOTIFY_CONFIG.CLIENT_ID = debugCredentials.default.CLIENT_ID || SPOTIFY_CONFIG.CLIENT_ID;
                    SPOTIFY_CONFIG.CLIENT_SECRET = debugCredentials.default.CLIENT_SECRET || SPOTIFY_CONFIG.CLIENT_SECRET;
                    
                    // 로컬 환경에서 디버그 키의 REDIRECT_URI 사용
                    if (debugCredentials.default.REDIRECT_URI) {
                        SPOTIFY_CONFIG.REDIRECT_URI = debugCredentials.default.REDIRECT_URI;
                        logger.debug('커스텀 리디렉션 URI 사용:', SPOTIFY_CONFIG.REDIRECT_URI);
                    }
                }
            } catch (error) {
                logger.error('디버그 키 로드 중 오류:', error);
                // 오류가 발생해도 계속 진행 (프로덕션 값 사용)
            }
        } else {
            // GitHub Pages 등에서는 환경 변수 사용
            logger.debug('프로덕션 환경 감지됨');
        }
        
        // 설정 검증
        if (!SPOTIFY_CONFIG.CLIENT_ID || SPOTIFY_CONFIG.CLIENT_ID === '%SPOTIFY_CLIENT_ID%') {
            logger.error('유효한 CLIENT_ID가 설정되지 않았습니다');
            throw new Error('스포티파이 CLIENT_ID가 설정되지 않았습니다');
        }
        
        logger.debug('스포티파이 설정 완료:', {
            clientId: SPOTIFY_CONFIG.CLIENT_ID ? '설정됨' : '없음',
            clientSecret: SPOTIFY_CONFIG.CLIENT_SECRET ? '설정됨' : '없음',
            redirectUri: SPOTIFY_CONFIG.REDIRECT_URI
        });
        
        // 콜백 핸들러가 저장한 인증 코드가 있는지 확인
        const authCode = localStorage.getItem(STORAGE_KEYS.AUTH_CODE);
        if (authCode) {
            logger.debug('저장된 인증 코드 발견, 처리 중...');
            await checkForAuthCode();
        } else {
            logger.debug('저장된 인증 코드 없음');
        }
        
        return true;
    } catch (error) {
        logger.error('자격 증명 로드 오류:', error);
        return false;
    }
}

// 콜백 핸들러가 저장한 인증 코드 확인
async function checkForAuthCode() {
    const authCode = localStorage.getItem(STORAGE_KEYS.AUTH_CODE);
    
    if (authCode) {
        logger.debug('저장된 인증 코드 발견, 처리 중...');
        
        try {
            // 인증 코드로 토큰 요청
            await getAccessToken(authCode);
            
            // 인증 코드 삭제 (토큰 획득 후)
            localStorage.removeItem(STORAGE_KEYS.AUTH_CODE);
            logger.debug('인증 코드 처리 완료, 코드 삭제됨');
            
            return true;
        } catch (error) {
            logger.error('저장된 인증 코드 처리 중 오류:', error);
            // 인증 코드 재사용 방지
            localStorage.removeItem(STORAGE_KEYS.AUTH_CODE);
            return false;
        }
    } else {
        logger.debug('저장된 인증 코드 없음');
        return false;
    }
}

// 인증 URL 생성
function getAuthUrl() {
    const state = generateRandomString(16);
    
    // 안전성을 위해 여러 저장소에 일관된 상태 저장
    try {
        localStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);
        sessionStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);
        setCookie(STORAGE_KEYS.AUTH_STATE, state, 1); // 1일 유효
        
        logger.debug('인증 상태 저장됨:', state);
    } catch (e) {
        // 개인정보 보호 모드에서는 에러 발생 가능
        logger.warn('인증 상태 저장 중 오류:', e);
    }
    
    const params = new URLSearchParams({
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        response_type: 'code',
        redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
        state: state,
        scope: SPOTIFY_CONFIG.SCOPES.join(' '),
        show_dialog: true // 항상 로그인 화면 표시
    });
    
    const authUrl = `${SPOTIFY_CONFIG.AUTH_ENDPOINT}?${params.toString()}`;
    logger.debug('인증 URL 생성됨:', authUrl);
    
    return authUrl;
}

// 모듈 내보내기
export default {
    loadCredentials,
    getAuthUrl,
    getAccessToken,
    getValidAccessToken,
    isLoggedIn,
    logout,
    isDebugMode,
    debugLog,
    setLogger,
    getStoredAuthState,
    checkForAuthCode
};