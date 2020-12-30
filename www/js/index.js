(() => {
    // Audio
    let soundStart = 'audio/start.mp3';
    let soundThrow = new Audio('audio/axe_throw.mp3');
    let soundRecall = new Audio('audio/axe_recall.mp3');
    const soundSwings = [
        'audio/swing_1.mp3',
        'audio/swing_2.mp3',
        'audio/swing_3.mp3',
    ]
    // Mode
    let mode = 'throw';
    // Max acceleration X
    let maxX = 0;
    // Minimum accel needed to trigger throw
    let minAccelThrow = 40;
    // Minimum accel needed to trigger swing
    let minAccelSwing = 30;
    // New swing boolean
    // let newSwing = false;

    // Turn accel indicator on or off
    let testEnable = false;

    // Selectors
    const test = document.querySelector('#test');
    const disclaimer = document.querySelector('#disclaimer');
    const buttonDisclaimer = document.querySelector('#disclaimer button');
    const modeChange = document.querySelector('#modeChange');
    const textMode = document.querySelector('#modeChange .mode');
    const buttonMode = document.querySelector('#modeChange button');
    const start = document.querySelector('#start');
    const imgAxe = document.querySelector('#start img');
    const results = document.querySelector('#results');
    const textAccel = document.querySelector('#results .accel');
    const reset = document.querySelector('#reset');

    async function motionAllowed() {
        if (window.DeviceMotionEvent) {
            // Check if iOS 13+
            if (typeof window.DeviceMotionEvent.requestPermission === 'function') {
                const permission = await window.DeviceMotionEvent.requestPermission();
                return permission === 'granted' ? true : false;
            } else {
                // non-iOS 13+ devices
                return true;
            }
        }
        return false;
    }

    function vibrate(ms) {
        if ('vibrate' in window.navigator) {
            window.navigator.vibrate(ms);
        }
    }

    function writeResults() {
        imgAxe.classList.add('hide');
        textAccel.textContent = `${Math.floor(maxX)} m/s²`;
        results.classList.remove('hide');
    }

    function handleThrow(e) {
        // Keep detecting max
        if (e.acceleration.x > maxX) {
            maxX = e.acceleration.x;
            if (testEnable) {
                test.textContent = `${maxX}`;
            }
        }
        if (maxX > minAccelThrow) { 
            vibrate(200);
            soundThrow.play();

            // Need to wait some time to capture the max acceleration instead of just when it masses the minimum
            setTimeout(function(){
                window.removeEventListener('devicemotion', handleThrow);
                imgAxe.addEventListener('transitionend', writeResults);
                imgAxe.classList.add('rotate-out');
            }, 100)
        }
    }

    // TODO: Figure out how to detect the end of a swing so 1 long swing does not trigger multiple times
    function handleCombat(e) {
        if (e.acceleration.x > maxX) {
            maxX = e.acceleration.x;
            if (testEnable) {
                test.textContent = `${maxX}`;
            }
        }
        if (maxX > minAccelSwing) { 
            newSwing = true;
            maxX = 0;
            // Remove listener immediately to not trigger multiple swings
            window.removeEventListener('devicemotion', handleCombat);
            // Choose random swing sound
            const randInt = Math.floor(Math.random()*soundSwings.length)
            new Audio(soundSwings[randInt]).play();
            vibrate(200);
            imgAxe.classList.add('flash');
            // Add listener back after timeout
            setTimeout(function(){
                maxX = 0;
                imgAxe.classList.remove('flash');
                window.addEventListener('devicemotion', handleCombat);
            }, 100)
        }
        // // If in the middle of a swing and acceleration falls below accel threshold, reset
        // if (newSwing && maxX < minAccelSwing) {
        //     newSwing = false;
        //     imgAxe.classList.remove('flash');
        // } 
        // // If not in the middle of a swing and acceleration passes threshold, trigger sounds/display changes
        // if (!newSwing && maxX > minAccelSwing) { 
        //     newSwing = true;
        //     maxX = 0;
        //     // Remove listener immediately to not trigger multiple swings
        //     window.removeEventListener('devicemotion', handleCombat);
        //     // Choose random swing sound
        //     const randInt = Math.floor(Math.random()*soundSwings.length)
        //     new Audio(soundSwings[randInt]).play();
        //     vibrate(200);
        //     imgAxe.classList.add('flash');
        //     // Add listener back after timeout
        //     setTimeout(function(){
        //         window.addEventListener('devicemotion', handleCombat);
        //     }, 100)
        // }
    }

    function handleDisclaimer(e) {
        if (motionAllowed()) {
            window.addEventListener('devicemotion', handleThrow);
            buttonMode.addEventListener('click', handleModeChange);
            reset.addEventListener('click', handleReset);
            disclaimer.classList.add('hide');
            modeChange.classList.remove('hide');
            start.classList.remove('hide');
            new Audio(soundStart).play();
            vibrate(200);
        } else {
            alert('Your device does not support this app')
        }
    }

    function handleResetEnd(e) {
        // Only want to vibrate and allow throwing again when axe is fully recalled
        vibrate(200);
        imgAxe.removeEventListener('transitionend', handleResetEnd);
        window.addEventListener('devicemotion', handleThrow);
    }

    function handleReset(e) {
        maxX = 0;
        results.classList.add('hide');
        imgAxe.removeEventListener('transitionend', writeResults);
        imgAxe.classList.remove( 'hide');
        imgAxe.addEventListener('transitionend', handleResetEnd);
        setTimeout(function(){
            // Reverse axe animation
            imgAxe.classList.remove('rotate-out');
            soundRecall.play();
        }, 100)
    }


    function handleModeChange() {
        if (mode === 'throw') {
            imgAxe.removeEventListener('transitionend', writeResults);
            imgAxe.removeEventListener('transitionend', handleResetEnd);
            results.classList.add('hide');
            imgAxe.classList.remove( 'hide', 'rotate-out');
            window.removeEventListener('devicemotion', handleThrow);
            window.addEventListener('devicemotion', handleCombat);
        } else {
            window.removeEventListener('devicemotion', handleCombat);
            window.addEventListener('devicemotion', handleThrow);
        }
        maxX = 0;
        mode = (mode === 'throw') ? 'combat' : 'throw';
        textMode.textContent = mode;
        new Audio(soundStart).play();
        vibrate(200);
    }

    buttonDisclaimer.addEventListener('click', handleDisclaimer);
})();