class ExerciseTimer {
    constructor() {
        this.currentTime = 0;
        this.totalTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.currentRound = 1;
        this.totalRounds = 8;
        this.currentPhase = 'prepare'; // prepare, work, rest, finished
        this.mode = 'hiit'; // hiit or slow
        this.interval = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.updateDisplay();
    }

    initializeElements() {
        this.elements = {
            currentPhase: document.getElementById('current-phase'),
            timeRemaining: document.getElementById('time-remaining'),
            currentRound: document.getElementById('current-round'),
            totalRounds: document.getElementById('total-rounds'),
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            hiitMode: document.getElementById('hiit-mode'),
            slowMode: document.getElementById('slow-mode'),
            hiitSettings: document.getElementById('hiit-settings'),
            slowSettings: document.getElementById('slow-settings'),
            timerDisplay: document.querySelector('.timer-display'),
            progressFill: document.getElementById('progress-fill')
        };

        this.settings = {
            hiit: {
                workTime: document.getElementById('work-time'),
                restTime: document.getElementById('rest-time'),
                rounds: document.getElementById('rounds'),
                prepTime: document.getElementById('prep-time')
            },
            slow: {
                exerciseTime: document.getElementById('exercise-time'),
                breakTime: document.getElementById('break-time'),
                rounds: document.getElementById('slow-rounds')
            }
        };
    }

    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.hiitMode.addEventListener('click', () => this.switchMode('hiit'));
        this.elements.slowMode.addEventListener('click', () => this.switchMode('slow'));

        // Add event listeners for settings changes
        Object.values(this.settings.hiit).forEach(input => {
            input.addEventListener('change', () => this.loadSettings());
        });
        Object.values(this.settings.slow).forEach(input => {
            input.addEventListener('change', () => this.loadSettings());
        });
    }

    switchMode(mode) {
        if (this.isRunning) return; // Don't switch modes while timer is running
        
        this.mode = mode;
        this.reset();
        
        // Update UI
        if (mode === 'hiit') {
            this.elements.hiitMode.classList.add('active');
            this.elements.slowMode.classList.remove('active');
            this.elements.hiitSettings.style.display = 'block';
            this.elements.slowSettings.style.display = 'none';
        } else {
            this.elements.slowMode.classList.add('active');
            this.elements.hiitMode.classList.remove('active');
            this.elements.slowSettings.style.display = 'block';
            this.elements.hiitSettings.style.display = 'none';
        }
        
        this.loadSettings();
        this.updateDisplay();
    }

    loadSettings() {
        if (this.mode === 'hiit') {
            this.config = {
                workTime: parseInt(this.settings.hiit.workTime.value),
                restTime: parseInt(this.settings.hiit.restTime.value),
                rounds: parseInt(this.settings.hiit.rounds.value),
                prepTime: parseInt(this.settings.hiit.prepTime.value)
            };
        } else {
            this.config = {
                exerciseTime: parseInt(this.settings.slow.exerciseTime.value) * 60, // convert to seconds
                breakTime: parseInt(this.settings.slow.breakTime.value) * 60, // convert to seconds
                rounds: parseInt(this.settings.slow.rounds.value)
            };
        }
        
        this.totalRounds = this.config.rounds;
        this.elements.totalRounds.textContent = this.totalRounds;
        
        if (!this.isRunning) {
            this.reset();
        }
    }

    start() {
        if (this.isPaused) {
            this.isPaused = false;
            this.isRunning = true;
        } else {
            this.isRunning = true;
            this.setupInitialState();
        }
        
        this.elements.startBtn.disabled = true;
        this.elements.pauseBtn.disabled = false;
        
        this.interval = setInterval(() => this.tick(), 1000);
        this.playBeep();
    }

    pause() {
        if (!this.isRunning) return;
        
        this.isPaused = true;
        this.isRunning = false;
        clearInterval(this.interval);
        
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.startBtn.textContent = 'Resume';
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.interval);
        
        this.currentRound = 1;
        this.currentPhase = 'prepare';
        
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.startBtn.textContent = 'Start';
        this.elements.currentRound.textContent = this.currentRound;
        
        this.setupInitialState();
        this.updateDisplay();
        this.updateProgress();
    }

    setupInitialState() {
        if (this.mode === 'hiit') {
            this.currentTime = this.config.prepTime;
            this.currentPhase = this.config.prepTime > 0 ? 'prepare' : 'work';
            if (this.config.prepTime === 0) {
                this.currentTime = this.config.workTime;
            }
        } else {
            this.currentTime = this.config.exerciseTime;
            this.currentPhase = 'work';
        }
    }

    tick() {
        this.currentTime--;
        this.updateDisplay();
        this.updateProgress();
        
        if (this.currentTime <= 0) {
            this.nextPhase();
        }
        
        // Beep warning at 3, 2, 1 seconds
        if (this.currentTime <= 3 && this.currentTime > 0) {
            this.playBeep(true);
        }
    }

    nextPhase() {
        if (this.mode === 'hiit') {
            this.nextPhaseHIIT();
        } else {
            this.nextPhaseSlow();
        }
        
        this.playBeep();
        this.updateDisplay();
    }

    nextPhaseHIIT() {
        if (this.currentPhase === 'prepare') {
            this.currentPhase = 'work';
            this.currentTime = this.config.workTime;
        } else if (this.currentPhase === 'work') {
            this.currentPhase = 'rest';
            this.currentTime = this.config.restTime;
        } else if (this.currentPhase === 'rest') {
            this.currentRound++;
            if (this.currentRound <= this.totalRounds) {
                this.currentPhase = 'work';
                this.currentTime = this.config.workTime;
                this.elements.currentRound.textContent = this.currentRound;
            } else {
                this.finishWorkout();
            }
        }
    }

    nextPhaseSlow() {
        if (this.currentPhase === 'work') {
            if (this.currentRound < this.totalRounds) {
                this.currentPhase = 'rest';
                this.currentTime = this.config.breakTime;
            } else {
                this.finishWorkout();
            }
        } else if (this.currentPhase === 'rest') {
            this.currentRound++;
            this.currentPhase = 'work';
            this.currentTime = this.config.exerciseTime;
            this.elements.currentRound.textContent = this.currentRound;
        }
    }

    finishWorkout() {
        this.currentPhase = 'finished';
        this.currentTime = 0;
        this.isRunning = false;
        clearInterval(this.interval);
        
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.startBtn.textContent = 'Start';
        
        this.playFinishedSound();
    }

    updateDisplay() {
        // Update phase text
        const phaseTexts = {
            prepare: 'Get Ready',
            work: this.mode === 'hiit' ? 'Work!' : 'Exercise',
            rest: this.mode === 'hiit' ? 'Rest' : 'Break',
            finished: 'Workout Complete!'
        };
        
        this.elements.currentPhase.textContent = phaseTexts[this.currentPhase];
        
        // Update time display
        this.elements.timeRemaining.textContent = this.formatTime(this.currentTime);
        
        // Update visual style based on phase
        this.elements.timerDisplay.className = `timer-display ${this.currentPhase}`;
    }

    updateProgress() {
        let totalWorkoutTime = 0;
        let elapsedTime = 0;
        
        if (this.mode === 'hiit') {
            const prepTime = this.config.prepTime;
            const roundTime = this.config.workTime + this.config.restTime;
            totalWorkoutTime = prepTime + (roundTime * this.totalRounds) - this.config.restTime; // Last round has no rest
            
            if (this.currentPhase === 'prepare') {
                elapsedTime = prepTime - this.currentTime;
            } else if (this.currentPhase === 'work') {
                elapsedTime = prepTime + ((this.currentRound - 1) * roundTime) + (this.config.workTime - this.currentTime);
            } else if (this.currentPhase === 'rest') {
                elapsedTime = prepTime + ((this.currentRound - 1) * roundTime) + this.config.workTime + (this.config.restTime - this.currentTime);
            } else if (this.currentPhase === 'finished') {
                elapsedTime = totalWorkoutTime;
            }
        } else {
            const roundTime = this.config.exerciseTime + this.config.breakTime;
            totalWorkoutTime = (roundTime * this.totalRounds) - this.config.breakTime; // Last round has no break
            
            if (this.currentPhase === 'work') {
                elapsedTime = ((this.currentRound - 1) * roundTime) + (this.config.exerciseTime - this.currentTime);
            } else if (this.currentPhase === 'rest') {
                elapsedTime = ((this.currentRound - 1) * roundTime) + this.config.exerciseTime + (this.config.breakTime - this.currentTime);
            } else if (this.currentPhase === 'finished') {
                elapsedTime = totalWorkoutTime;
            }
        }
        
        const progress = Math.min((elapsedTime / totalWorkoutTime) * 100, 100);
        this.elements.progressFill.style.width = `${progress}%`;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    playBeep(short = false) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = short ? 800 : 1000;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + (short ? 0.1 : 0.3));
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + (short ? 0.1 : 0.3));
    }

    playFinishedSound() {
        // Play a celebratory sequence of beeps
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(context.destination);
                
                oscillator.frequency.value = 1200 + (i * 200);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
                
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.4);
            }, i * 200);
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ExerciseTimer();
});