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

    class Clock extends Component {
        constructor(props) {
            super(props);
            this.clock = null;
            this.state = {
                status: 'INITIAL',
                ticks: 0
            };
        }

        componentDidMount() {
            this.clock = window.setInterval(() => {
                try {
                    this.setState((state) => {
                        return {
                            status: 'RUNNING',
                            ticks: state.ticks + 1
                        };
                    });
                } catch (ex) {
                    console.error('Error rendering on clock tick', ex);
                }
            }, this.props.tick);
        }

        componentWillUnmount() {
            if (this.clock) {
                window.clearInterval(this.clock);
            }
        }

        render() {
            switch (this.state.status) {
            case 'INITIAL':
            case 'RUNNING':
                return this.props.render(this.state.ticks);
            }
        }
    }

    return Clock;
});
