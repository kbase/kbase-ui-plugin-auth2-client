define([
    'preact',
    'htm',
    'lib/provider',
    './ErrorAlert',
    './Loading',
    './SignedOut',

    'bootstrap'
], (
    preact,
    htm,
    {Providers},
    ErrorAlert,
    Loading,
    SignedOut
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class SignedOutController extends Component {
        constructor(props) {
            super(props);
            this.state = {
                status: 'NONE'
            };
        }
        componentDidMount() {
            this.start();
        }

        async start() {
            try {
                this.setState({
                    status: 'PENDING'
                });

                this.props.runtime.setTitle('Signed Out');

                const providers = new Providers({runtime: this.props.runtime}).get();

                this.setState({
                    status: 'SUCCESS',
                    value: {
                        providers
                    }
                });
            } catch (ex) {
                console.error(ex);
                this.setState({
                    status: 'ERROR',
                    error: {
                        message: ex.message
                    }
                });
            }
        }
        render() {
            switch (this.state.status) {
            case 'NONE':
            case 'PENDING':
                return html`
                    <${Loading} message="Loading..." />
                `;
            case 'SUCCESS': {
                const {
                    providers
                } = this.state.value;
                return html`
                    <${SignedOut} 
                        runtime=${this.props.runtime}
                        providers=${providers}
                    />
                `;
            }
            case 'ERROR':
                return html`
                    <${ErrorAlert} message=${this.state.error.message} />
                `;
            }
        }
    }

    return SignedOutController;
});
