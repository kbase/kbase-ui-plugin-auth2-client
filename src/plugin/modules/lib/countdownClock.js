define([], function () {
    'use strict';
    
    function CountDownClock(config) {
        var targetTime;
        // Either countdown until a specific time ...
        if (config.until) {
            targetTime = config.until;
            // ... or for a quantity of time.
        } else if (config.for) {
            targetTime = new Date().getTime() + config.for;
        }
        // var startTime;
        var tickInterval = config.tick || 1000;
        var onTick = config.onTick;
        var onExpired = config.onExpired;
        var timer;

        function tick() {
            var now = new Date().getTime();
            var remaining = targetTime - now;

            try {
                onTick(remaining);
            } catch (ex) {
                console.error('clock onRun: ' + ex.message);
            }
            if (remaining > 0) {
                tock();
            } else {
                onExpired();
            }
        }

        function tock() {
            timer = window.setTimeout(function () {
                if (!timer) {
                    return;
                }
                tick();
            }, tickInterval);
        }

        function start() {
            tick();
        }

        function stop() {
            timer = null;
        }

        return {
            start: start,
            stop: stop
        };
    }
    return CountDownClock;
});