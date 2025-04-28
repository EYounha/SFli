// 디버그 로깅을 처리하는 유틸리티 클래스
export default class Logger {
    constructor(isDebugMode) {
        this.isDebugMode = isDebugMode;
        this.namespace = 'SFli';
        this.logToDOM = isDebugMode;
        this.debugLogs = [];
    }

    // 디버그 로그 출력
    debug(...args) {
        const logMessage = `[${this.namespace} Debug] ${args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`;
        
        // 콘솔에 로그 출력 (디버그 모드일 때만)
        if (this.isDebugMode) {
            console.log(logMessage);
        }
        
        // 로그 저장 (디버그 패널에 표시하기 위해)
        this.debugLogs.push({type: 'debug', message: logMessage, timestamp: new Date()});
        this.updateDebugPanel();
    }

    // 정보 로그 출력
    info(...args) {
        const logMessage = `[${this.namespace}] ${args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`;
        
        console.info(logMessage);
        this.debugLogs.push({type: 'info', message: logMessage, timestamp: new Date()});
        this.updateDebugPanel();
    }

    // 경고 로그 출력
    warn(...args) {
        const logMessage = `[${this.namespace} Warning] ${args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`;
        
        console.warn(logMessage);
        this.debugLogs.push({type: 'warn', message: logMessage, timestamp: new Date()});
        this.updateDebugPanel();
    }

    // 오류 로그 출력
    error(...args) {
        const logMessage = `[${this.namespace} Error] ${args.map(arg => 
            typeof arg === 'object' ? (arg instanceof Error ? arg.stack || arg.message : JSON.stringify(arg)) : arg).join(' ')}`;
        
        console.error(logMessage);
        this.debugLogs.push({type: 'error', message: logMessage, timestamp: new Date()});
        this.updateDebugPanel();
    }
    
    // DOM에 디버그 로그 업데이트
    updateDebugPanel() {
        if (!this.logToDOM) return;
        
        const debugPanel = document.getElementById('debug-log');
        if (!debugPanel) return;
        
        // 최근 20개 로그만 표시
        const recentLogs = this.debugLogs.slice(-20);
        
        debugPanel.innerHTML = recentLogs.map(log => {
            const time = log.timestamp.toLocaleTimeString();
            const cssClass = `log-${log.type}`;
            return `<div class="${cssClass}"><span class="log-time">${time}</span> ${log.message}</div>`;
        }).join('');
        
        // 스크롤을 항상 아래로 유지
        debugPanel.scrollTop = debugPanel.scrollHeight;
    }
}