define([], () => {
    class CountdownClock {
        constructor({expiresAt, expiresIn, tick, onTick, onExpired}) {
            this.targetTime = null;
            // Either countdown until a specific time ...
            if (expiresAt) {
                this.targetTime = expiresAt;
                // ... or for a quantity of time.
            } else if (expiresIn) {
                this.targetTime = new Date().getTime() + expiresIn;
            } else {console.error;
                throw new Error('Either "expiresAt" or "expiresIn" must be provided');
            }
            this.tickInterval = tick || 1000;
            this.onTick = onTick;
            this.onExpired = onExpired;
            this.timer = null;
            this.status = 'NONE';
        }

        remaining() {
            const now = new Date().getTime();
            return this.targetTime - now;
        }

        tick() {
            if (this.status !== 'RUNNING') {
                return;
            }
            const remaining = this.remaining();
            try {
                this.onTick(remaining);
            } catch (ex) {
                console.error(`clock onRun: ${ex.message}`);
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
            this.status = 'RUNNING';
            this.tick();
        }

        stop() {
            this.status = 'STOPPED';
            if (this.timer) {
                window.clearTimeout(this.timer);
                this.timer = null;
            }
        }
    }
    return CountdownClock;
});