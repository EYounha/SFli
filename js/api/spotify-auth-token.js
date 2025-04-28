// spotify-auth-token.js - 스포티파이 토큰 관련 기능

import { SPOTIFY_CONFIG, STORAGE_KEYS, logger } from './spotify-auth-config.js';
import { setCookie, getCookie } from './spotify-auth-utils.js';

// 인증 코드로 액세스 토큰 요청
export async function getAccessToken(code) {
    logger.debug('인증 코드로 액세스 토큰 요청 중...');
    logger.debug('사용 중인 리디렉션 URI:', SPOTIFY_CONFIG.REDIRECT_URI);
    
    // 이전의 Authentication 관련 오류 초기화
    localStorage.removeItem('auth_error');
    
    const redirectUri = SPOTIFY_CONFIG.REDIRECT_URI;
    
    // 리디렉션 URI 로깅 - 문제 파악을 위해 더 자세한 정보 출력
    logger.info('▶️ 토큰 요청에 사용되는 리디렉션 URI:', redirectUri);
    logger.info('✅ 이 URI가 스포티파이 개발자 대시보드에 정확히 등록되어 있어야 합니다.');
    
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
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
            logger.error('토큰 요청 실패:', response.status, errorData);
            
            // 오류가 'Invalid redirect URI'인지 확인
            if (errorData.includes('redirect_uri') || errorData.includes('invalid_redirect')) {
                logger.error('❌ Invalid redirect URI 오류 감지됨!');
                logger.error('▶️ 스포티파이 개발자 대시보드에 다음 URI가 등록되어 있는지 확인하세요:');
                logger.error(redirectUri);
                
                // GitHub Pages 환경인지 확인하여 추가 정보 제공
                if (window.location.hostname.includes('github.io')) {
                    logger.error('💡 GitHub Pages를 사용 중인 경우, 저장소 이름을 포함한 전체 경로가 등록되어 있어야 합니다.');
                    logger.error('예: https://username.github.io/repository-name/callback.html');
                }
            }
            
            // 오류 정보 저장 (디버깅용)
            localStorage.setItem('auth_error', JSON.stringify({
                status: response.status,
                error: errorData,
                redirectUri: redirectUri,
                timestamp: Date.now()
            }));
            
            throw new Error(`토큰 요청 실패 (${response.status}): ${errorData}`);
        }
        
        const data = await response.json();
        logger.debug('토큰 응답 받음:', {
            accessToken: data.access_token ? '설정됨' : '없음',
            refreshToken: data.refresh_token ? '설정됨' : '없음',
            expiresIn: data.expires_in
        });
        
        // 토큰 저장
        saveTokenData(data);
        
        return data;
    } catch (error) {
        logger.error('토큰 요청 오류:', error);
        throw error;
    }
}

// 토큰 데이터 저장
export function saveTokenData(data) {
    if (!data.access_token) {
        logger.error('액세스 토큰이 없어 저장할 수 없습니다');
        return false;
    }
    
    const tokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000)
    };
    
    try {
        // 토큰 데이터 저장
        localStorage.setItem(STORAGE_KEYS.TOKEN_DATA, JSON.stringify(tokenData));
        localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
        
        // 쿠키에도 인증 상태 저장 (크로스 탭 동기화 지원)
        setCookie(STORAGE_KEYS.IS_AUTHENTICATED, 'true', 7); // 7일간 유효
        
        logger.debug('토큰 데이터 저장 성공');
        return true;
    } catch (e) {
        logger.error('토큰 데이터 저장 중 오류:', e);
        return false;
    }
}

// 저장된 토큰 데이터 가져오기
export function getTokenData() {
    try {
        const tokenString = localStorage.getItem(STORAGE_KEYS.TOKEN_DATA);
        if (!tokenString) {
            logger.debug('저장된 토큰 데이터 없음');
            return null;
        }
        
        const data = JSON.parse(tokenString);
        
        // 유효한 토큰 데이터인지 검증
        if (!data || !data.access_token) {
            logger.warn('저장된 토큰 데이터가 유효하지 않음, 삭제 처리');
            localStorage.removeItem(STORAGE_KEYS.TOKEN_DATA);
            return null;
        }
        
        logger.debug('토큰 데이터 로드됨:', {
            accessToken: '설정됨',
            refreshToken: data.refresh_token ? '설정됨' : '없음',
            expiresAt: new Date(data.expires_at).toLocaleString()
        });
        
        return data;
    } catch (e) {
        logger.error('토큰 데이터 파싱 오류:', e);
        localStorage.removeItem(STORAGE_KEYS.TOKEN_DATA); // 손상된 데이터 제거
        return null;
    }
}