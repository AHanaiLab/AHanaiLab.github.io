# Exercise Timers

A web-based exercise timer application designed for HIIT (High-Intensity Interval Training) and slow training workouts.

## Features

### HIIT Mode
- Customizable work and rest intervals
- Adjustable preparation time
- Configurable number of rounds
- Visual and audio cues for phase transitions
- Real-time progress tracking

### Slow Training Mode
- Longer exercise and break periods (in minutes)
- Suitable for strength training and endurance workouts
- Customizable number of sets
- Visual feedback for current phase

### General Features
- Clean, responsive web interface
- Visual phase indicators with color coding
- Audio beeps for interval transitions and warnings
- Progress bar showing workout completion
- Pause and resume functionality
- Easy switching between timer modes

## Usage

1. Open `index.html` in any modern web browser
2. Choose your preferred mode:
   - **HIIT Mode**: For high-intensity interval training
   - **Slow Training**: For longer, steady-pace exercises
3. Adjust the timer settings:
   - **HIIT**: Work time, rest time, rounds, preparation time
   - **Slow Training**: Exercise time, break time, number of sets
4. Click "Start" to begin the workout
5. Use "Pause" to temporarily stop the timer
6. Use "Reset" to return to the beginning

## Timer Phases

### HIIT Mode
1. **Preparation** (orange) - Get ready for the workout
2. **Work** (red) - High-intensity exercise period
3. **Rest** (green) - Recovery period
4. **Finished** (purple) - Workout complete

### Slow Training Mode
1. **Exercise** (red) - Active training period
2. **Break** (green) - Rest period between sets
3. **Finished** (purple) - Workout complete

## Audio Cues
- **Start of each phase**: Single beep
- **Last 3 seconds**: Warning beeps
- **Workout completion**: Celebratory sequence

## Browser Compatibility
Works on all modern browsers that support:
- HTML5
- CSS3
- ES6 JavaScript
- Web Audio API

## Technical Details
- Pure HTML, CSS, and JavaScript (no dependencies)
- Responsive design for mobile and desktop
- Uses Web Audio API for sound generation
- Local storage for settings persistence (future enhancement)