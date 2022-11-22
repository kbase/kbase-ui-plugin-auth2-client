define([
    'preact',
    'lib/CountdownClock',

    'bootstrap',
], (
    preact,
    CountdownClock
) => {

    const {Component} = preact;

    class CountdownAlarmClock extends Component {
        constructor(props) {
            super(props);
            this.clock = null;
            this.clock = new CountdownClock({
                tick: 1000,
                expiresIn: this.props.expiresIn,
                expiresAt: this.props.expiresAt,
                onTick: this.onTick.bind(this),
                onExpired: this.onExpired.bind(this)
            });
            this.state = {
                // NONE, RUNNING, DONE
                status: 'NONE',
                remaining: this.clock.remaining()
            };
        }

        componentDidMount() {
            this.clock.start();
        }

        componentWillUnmount() {
            if (this.clock === null) {
                return;
            }
            this.clock.stop();
        }

        onTick(remaining) {
            this.setState({
                status: 'RUNNING',
                remaining
            });
        }

        onExpired() {
            this.props.onExpired();
            this.setState({
                status: 'DONE'
            });
        }

        render() {
            switch (this.state.status) {
            case 'NONE':
            case 'RUNNING':
                return this.props.render(this.state.remaining);
            case 'DONE':
                return this.props.render(0);
            }
        }
    }

    return CountdownAlarmClock;
});
