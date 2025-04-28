// spotify-auth-token2.js - 스포티파이 토큰 검증 및 갱신 기능

import { SPOTIFY_CONFIG, STORAGE_KEYS, logger } from './spotify-auth-config.js';
import { setCookie, getCookie } from './spotify-auth-utils.js';
import { getTokenData, saveTokenData } from './spotify-auth-token.js';

// 토큰이 만료됐는지 확인
export function isTokenExpired() {
    const tokenData = getTokenData();
    if (!tokenData) return true;
    
    // 토큰 만료 5분 전에 미리 갱신하도록 설정
    const isExpired = Date.now() > (tokenData.expires_at - 5 * 60 * 1000);
    logger.debug('토큰 만료 여부:', isExpired);
    return isExpired;
}

// 리프레시 토큰으로 액세스 토큰 갱신
export async function refreshAccessToken() {
    const tokenData = getTokenData();
    if (!tokenData || !tokenData.refresh_token) {
        logger.error('리프레시 토큰이 없습니다.');
        return null;
    }
    
    logger.debug('액세스 토큰 갱신 중...');
    
    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        client_secret: SPOTIFY_CONFIG.CLIENT_SECRET
    });
    
    try {
        const response = await fetch(SPOTIFY_CONFIG.TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            logger.error('토큰 갱신 실패:', response.status, errorData);
            
            // 401, 400, 403 오류는 리프레시 토큰 만료로 판단
            if ([400, 401, 403].includes(response.status)) {
                logger.warn('리프레시 토큰이 만료되었거나 유효하지 않습니다. 재로그인이 필요합니다.');
                logout(); // 토큰 삭제 후 로그아웃 처리
                return null;
            }
            
            throw new Error(`토큰 갱신 실패 (${response.status}): ${errorData}`);
        }
        
        const data = await response.json();
        logger.debug('토큰 갱신됨');
        
        // 새 액세스 토큰 저장 (리프레시 토큰은 같이 안 올 수도 있음)
        const newTokenData = {
            access_token: data.access_token,
            refresh_token: data.refresh_token || tokenData.refresh_token,
            expires_at: Date.now() + (data.expires_in * 1000)
        };
        
        localStorage.setItem(STORAGE_KEYS.TOKEN_DATA, JSON.stringify(newTokenData));
        
        return data;
    } catch (error) {
        logger.error('토큰 갱신 오류:', error);
        
        // 심각한 오류인 경우 로그아웃 처리
        if (error.message && (
            error.message.includes('invalid_grant') ||
            error.message.includes('invalid_token')
        )) {
            logout();
        }
        
        throw error;
    }
}

// 유효한 액세스 토큰 가져오기 (필요시 갱신)
export async function getValidAccessToken() {
    // 토큰이 만료되었는지 확인
    if (isTokenExpired()) {
        logger.debug('토큰이 만료되었거나 만료 예정입니다. 갱신 시도...');
        try {
            const refreshResult = await refreshAccessToken();
            if (!refreshResult) {
                logger.warn('토큰 갱신 실패, 인증이 필요합니다.');
                return null;
            }
        } catch (error) {
            logger.error('토큰 갱신 실패, 인증이 필요합니다:', error);
            return null;
        }
    }
    
    // 갱신 후 다시 토큰 데이터 가져오기
    const tokenData = getTokenData();
    
    // 토큰 없으면 null 반환
    if (!tokenData || !tokenData.access_token) {
        logger.warn('유효한 액세스 토큰이 없습니다');
        return null;
    }
    
    logger.debug('유효한 액세스 토큰 반환');
    return tokenData.access_token;
}

// 로그인 상태 확인
export function isLoggedIn() {
    try {
        // 1. 토큰 데이터 유효성 확인
        const tokenData = getTokenData();
        if (!tokenData || !tokenData.access_token) {
            logger.debug('토큰 데이터 없거나 유효하지 않음, 로그아웃 상태');
            return false;
        }
        
        // 2. 인증 상태 확인
        const isAuthenticatedStorage = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
        const isAuthenticatedCookie = getCookie(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
        const isAuthenticated = isAuthenticatedStorage || isAuthenticatedCookie;
        
        if (!isAuthenticated) {
            logger.debug('인증 상태 없음, 로그아웃 상태');
            return false;
        }
        
        // 3. 토큰이 완전히 만료되었고 리프레시 토큰도 없으면 로그아웃 상태
        const now = Date.now();
        if (tokenData.expires_at < now && !tokenData.refresh_token) {
            logger.debug('토큰 만료 & 리프레시 토큰 없음, 로그아웃 상태');
            return false;
        }
        
        logger.debug('로그인 상태 확인: 로그인됨');
        return true;
    } catch (e) {
        logger.error('로그인 상태 확인 오류:', e);
        return false;
    }
}

// 로그아웃 (토큰 삭제)
export function logout() {
    // 모든 인증 관련 데이터 삭제
    localStorage.removeItem(STORAGE_KEYS.TOKEN_DATA);
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    localStorage.removeItem(STORAGE_KEYS.AUTH_CODE);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem('auth_error'); // 디버깅용 오류 정보도 삭제
    
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    setCookie(STORAGE_KEYS.AUTH_STATE, '', -1); // 쿠키 삭제
    setCookie(STORAGE_KEYS.IS_AUTHENTICATED, '', -1); // 인증 쿠키 삭제
    
    logger.debug('로그아웃됨');
}