define([
    'preact',
    'htm',
    'lib/CountdownClock',

    'bootstrap',
], (
    preact,
    htm,
    CountdownClock
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class CountdownAlarmClock extends Component {
        constructor(props) {
            super(props);
            this.clock = null;
            this.state = {
                // NONE, RUNNING, DONE
                status: 'NONE'
            };
        }

        componentDidMount() {
            this.clock = new CountdownClock({
                tick: 1000,
                until: this.props.until,
                onTick: this.onTick.bind(this),
                onExpired: this.onExpired.bind(this)
            });
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
            this.setState({
                status: 'DONE'
            });
        }

        render() {
            switch (this.state.status) {
            case 'NONE':
                return html`<div>NONE</div>`;
            case 'RUNNING':
                return this.props.render(this.state.remaining);
            case 'DONE':
                return this.props.render(0);
            }
        }
    }

    return CountdownAlarmClock;
});
