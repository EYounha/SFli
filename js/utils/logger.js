// 디버그 로깅을 처리하는 유틸리티 클래스
export default class Logger {
    constructor(isDebugMode) {
        this.isDebugMode = isDebugMode;
        this.namespace = 'SFli';
        this.setupConsole();
    }

    // 콘솔 로그 설정
    setupConsole() {
        // 원본 콘솔 로그 메서드 저장
        this.originalConsoleLog = console.log;
        
        // 콘솔 로그 메서드 오버라이드
        console.log = (...args) => {
            // 원본 콘솔 로그 호출
            this.originalConsoleLog.apply(console, args);
            
            // 디버그 모드가 아니면 [SFli Debug] 로그는 출력하지 않음
            if (!this.isDebugMode && Array.isArray(args) && args[0] === `[${this.namespace} Debug]`) {
                return;
            }
        };
    }

    // 디버그 로그 출력
    debug(...args) {
        if (this.isDebugMode) {
            console.log(`[${this.namespace} Debug]`, ...args);
        }
    }

    // 정보 로그 출력
    info(...args) {
        console.info(`[${this.namespace}]`, ...args);
    }

    // 경고 로그 출력
    warn(...args) {
        console.warn(`[${this.namespace} Warning]`, ...args);
    }

    // 오류 로그 출력
    error(...args) {
        console.error(`[${this.namespace} Error]`, ...args);
    }
}