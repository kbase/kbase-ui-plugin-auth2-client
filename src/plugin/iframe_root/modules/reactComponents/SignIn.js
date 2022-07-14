define([
    'preact',
    'htm',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',
    './SignInView',
    './ErrorAlert',
    './Loading',
], (
    preact,
    htm,
    Auth2Error,
    auth2,
    SignInView,
    ErrorAlert,
    Loading,
) => {
    const {Component} = preact;
    const html = htm.bind(preact.h);

    class SignIn extends Component {
        constructor(props) {
            super(props);

            this.state = {
                status: 'NONE'
            };
        }

        componentDidMount() {
            this.startItUp();
        }

        getNextRequest() {
            if (this.props.params.nextrequest) {
                return JSON.parse(this.props.params.nextrequest);
            }
            return null;
        }

        async startItUp() {
            try {
                this.setState({
                    status: 'PENDING'
                });

                // If we land here and are logged in already,
                // just go to the "dashboard"
                if (this.props.runtime.service('session').isAuthenticated()) {
                    const nextRequest = this.getNextRequest();
                    if (nextRequest) {
                        this.props.runtime.send('app', 'navigate', nextRequest);
                    } else {
                        this.props.runtime.send('app', 'navigate', {
                            path: 'dashboard'
                        });
                    }
                    return;
                }

                await this.cancelLogin();
                this.setState({
                    status: 'SUCCESS'
                });
            } catch (ex) {
                this.setState({
                    status: 'ERROR',
                    error: {
                        message: ex.message
                    }
                });
            }
        }

        async cancelLogin() {
            const auth2Client = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            try {
                await await auth2Client.loginCancel();
            } catch (ex) {
                if (ex instanceof Auth2Error.AuthError) {
                    if (ex.code !== '10010') {
                        throw ex;
                    }
                }
            }
        }

        render() {
            switch (this.state.status) {
            case 'NONE':
            case 'PENDING':
                return html`
                    <${Loading} message="Loading..." />
                `;
            case 'SUCCESS':
                return html`
                    <${SignInView} runtime=${this.props.runtime} params=${this.props.params} />
                `;
            case 'ERROR':
                return html`
                    <${ErrorAlert} message=${this.state.error.message} />
                `;
            }
        }
    }

    return SignIn;
});