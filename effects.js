// Kahoot Bot Controller (based on kahoot-bot.net functionality)
class KahootBotController {
    constructor() {
        this.activeBots = [];
        this.totalAnswers = 0;
        this.isRunning = false;
        this.mode = 'random'; // random or manual
        this.currentAnswer = 0;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupJoystick();
        this.updateUI();
    }
    
    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startFlood());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopFlood());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('clearFeed').addEventListener('click', () => this.clearFeed());
        
        document.getElementById('randomMode').addEventListener('click', () => this.setMode('random'));
        document.getElementById('manualMode').addEventListener('click', () => this.setMode('manual'));
    }
    
    setupJoystick() {
        const joystickBase = document.querySelector('.joystick-base');
        const joystickThumb = document.querySelector('.joystick-thumb');
        let isDragging = false;
        
        const updateJoystick = (e) => {
            if (!isDragging) return;
            
            const rect = joystickBase.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            let x = (e.clientX || e.touches[0].clientX) - centerX;
            let y = (e.clientY || e.touches[0].clientY) - centerY;
            
            const distance = Math.min(Math.sqrt(x*x + y*y), 60);
            const angle = Math.atan2(y, x);
            
            const thumbX = Math.cos(angle) * distance;
            const thumbY = Math.sin(angle) * distance;
            
            joystickThumb.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;
            
            // Determine answer based on joystick direction
            if (distance > 30) {
                if (angle > -Math.PI/4 && angle < Math.PI/4) this.currentAnswer = 0; // Right
                else if (angle > Math.PI/4 && angle < 3*Math.PI/4) this.currentAnswer = 1; // Down
                else if (angle < -Math.PI/4 && angle > -3*Math.PI/4) this.currentAnswer = 2; // Up
                else this.currentAnswer = 3; // Left
                
                this.addEvent(`🎮 Manual control: Answer ${this.currentAnswer + 1}`);
            }
        };
        
        joystickBase.addEventListener('mousedown', () => isDragging = true);
        joystickBase.addEventListener('touchstart', () => isDragging = true);
        window.addEventListener('mouseup', () => {
            isDragging = false;
            joystickThumb.style.transform = 'translate(-50%, -50%)';
        });
        window.addEventListener('touchend', () => {
            isDragging = false;
            joystickThumb.style.transform = 'translate(-50%, -50%)';
        });
        window.addEventListener('mousemove', updateJoystick);
        window.addEventListener('touchmove', updateJoystick);
    }
    
    setMode(mode) {
        this.mode = mode;
        document.getElementById('randomMode').classList.toggle('active', mode === 'random');
        document.getElementById('manualMode').classList.toggle('active', mode === 'manual');
        document.getElementById('joystickContainer').classList.toggle('hidden', mode !== 'manual');
        this.addEvent(`🔄 Switched to ${mode.toUpperCase()} mode`);
    }
    
    async startFlood() {
        const pin = document.getElementById('gamePin').value;
        const botCount = parseInt(document.getElementById('botCount').value);
        const namePrefix = document.getElementById('namePrefix').value;
        
        if (!pin || pin.length !== 6) {
            this.addEvent('❌ Invalid PIN! Please enter a 6-digit game PIN');
            return;
        }
        
        if (botCount < 1 || botCount > 1000) {
            this.addEvent('❌ Bot count must be between 1 and 1000');
            return;
        }
        
        this.isRunning = true;
        this.activeBots = [];
        this.totalAnswers = 0;
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('gameStatus').innerText = 'Flooding...';
        
        this.addEvent(`🚀 Starting flood attack on PIN ${pin} with ${botCount} bots`);
        
        // Simulate bot connections
        for (let i = 0; i < botCount; i++) {
            if (!this.isRunning) break;
            
            const botId = `${namePrefix}${i + 1}`;
            this.activeBots.push({
                id: botId,
                pin: pin,
                connected: true,
                answers: 0
            });
            
            this.addEvent(`🤖 Bot ${botId} joined the game`);
            this.updateStats();
            
            // Simulate random answer timing
            this.simulateBotBehavior(botId);
            
            // Delay between connections to avoid rate limiting
            await this.sleep(Math.random() * 100 + 50);
        }
        
        this.addEvent(`✅ Successfully deployed ${this.activeBots.length} bots!`);
        document.getElementById('gameStatus').innerText = 'Active';
    }
    
    simulateBotBehavior(botId) {
        const interval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(interval);
                return;
            }
            
            const bot = this.activeBots.find(b => b.id === botId);
            if (!bot || !bot.connected) {
                clearInterval(interval);
                return;
            }
            
            let answer;
            if (this.mode === 'random') {
                answer = Math.floor(Math.random() * 4);
            } else {
                answer = this.currentAnswer;
            }
            
            bot.answers++;
            this.totalAnswers++;
            
            this.addEvent(`🎯 Bot ${botId} answered: ${answer + 1}${this.mode === 'manual' ? ' (manual control)' : ''}`);
            this.updateStats();
            
        }, Math.random() * 8000 + 2000); // Answer every 2-10 seconds
    }
    
    stopFlood() {
        this.isRunning = false;
        this.activeBots = [];
        this.addEvent('⛔ Flood attack stopped. All bots disconnected.');
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('gameStatus').innerText = 'Stopped';
        this.updateStats();
    }
    
    clearAll() {
        this.stopFlood();
        this.totalAnswers = 0;
        this.updateStats();
        this.addEvent('🗑️ Cleared all bot data');
    }
    
    updateStats() {
        document.getElementById('activeBots').innerText = this.activeBots.length;
        document.getElementById('totalAnswers').innerText = this.totalAnswers;
    }
    
    addEvent(message) {
        const eventList = document.getElementById('eventList');
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-item';
        eventDiv.innerHTML = `
            <span style="color: #00ff88;">[${new Date().toLocaleTimeString()}]</span>
            <span> ${message}</span>
        `;
        eventList.insertBefore(eventDiv, eventList.firstChild);
        
        // Keep only last 50 events
        while (eventList.children.length > 50) {
            eventList.removeChild(eventList.lastChild);
        }
    }
    
    clearFeed() {
        document.getElementById('eventList').innerHTML = '';
        this.addEvent('📋 Event feed cleared');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the bot controller
const botController = new KahootBotController();
