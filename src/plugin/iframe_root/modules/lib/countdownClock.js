define([], () => {
    'use strict';

    class CountDownClock {
        constructor(config) {
            this.targetTime = null;
            // Either countdown until a specific time ...
            if (config.until) {
                this.targetTime = config.until;
                // ... or for a quantity of time.
            } else if (config.for) {
                this.targetTime = new Date().getTime() + config.for;
            }
            this.tickInterval = config.tick || 1000;
            this.onTick = config.onTick;
            this.onExpired = config.onExpired;
            this.timer = null;
        }

        tick() {
            const now = new Date().getTime();
            const remaining = this.targetTime - now;

            try {
                this.onTick(remaining);
            } catch (ex) {
                console.error('clock onRun: ' + ex.message);
            }
            if (remaining > 0) {
                this.tock();
            } else {
                this.onExpired();
            }
        }

        tock() {
            this.timer = window.setTimeout(() => {
                if (!this.timer) {
                    return;
                }
                this.tick();
            }, this.tickInterval);
        }

        start() {
            this.tick();
        }

        stop() {
            if (this.timer) {
                window.clearTimeout(this.timer);
                this.timer = null;
            }
        }
    }
    return CountDownClock;
});