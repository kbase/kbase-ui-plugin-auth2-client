define([
    'preact',
    'htm',
    'kb_common_ts/Auth2',
    'lib/utils',
    'reactComponents/ErrorAlert',
    'reactComponents/Loading',
    './LoginTokens',

    'bootstrap'
], (
    preact,
    htm,
    {Auth2},
    Utils,
    ErrorAlert,
    Loading,
    LoginTokens
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class LoginTokensController extends Component {
        constructor(props) {
            super(props);
            // Okay, weirdo.
            this.utils = Utils.make({
                runtime: this.props.runtime
            });
            this.state = {
                status: 'NONE'
            };
        }

        componentDidMount() {
            this.loadData();
        }

        async revokeToken(tokenID) {
            const auth2 = new Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const authToken = this.props.runtime.service('session').getAuthToken();
            try {
                await auth2.revokeToken(authToken, tokenID);
                const {tokens, current} = await auth2.getTokens(authToken);
                this.setState({
                    status: 'SUCCESS',
                    value: {
                        ...this.state.value,
                        tokens: tokens.filter((token) => {
                            return token.type === 'Login';
                        }),
                        current
                    }
                });
            } catch (ex) {
                console.error(ex);
                // TODO: what now? probably send an alert
            }
        }

        async revokeAllTokens() {
            const auth2 = new Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const authToken = this.props.runtime.service('session').getAuthToken();
            try {
                const {tokens: currentTokens} = await auth2.getTokens(authToken);

                // All others
                await Promise.all(currentTokens
                    .filter(({type}) => {
                        return type=== 'Login';
                    })
                    .map(({id}) => {
                        return auth2.revokeToken(authToken, id);
                    }));

                const {tokens} = await auth2.getTokens(authToken);

                this.setState({
                    status: 'SUCCESS',
                    value: {
                        ...this.state.value,
                        tokens: tokens.filter((token) => {
                            return token.type === 'Login';
                        })
                    }
                });
            } catch (ex) {
                console.error(ex);
                // TODO: what now? probably send an alert
            }
        }

        async revokeAllTokensAndLogout() {
            const auth2 = new Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const authToken = this.props.runtime.service('session').getAuthToken();
            try {
                const {tokens, current} = await auth2.getTokens(authToken);

                // All others
                for (const {id} of tokens) {
                    await auth2.revokeToken(authToken, id);
                }

                // Current session
                await auth2.revokeToken(current.id);

                await this.props.runtime.service('session').getClient().logout(authToken);

                this.props.runtime.send('app', 'auth-navigate', {
                    nextRequest: {path: 'auth2/signedout'},
                    tokenInfo: null
                });

                // No need to set the state, as we are redirecting!
                // TODO: or maybe have a redirecting state?
            } catch (ex) {
                console.error(ex);
                // TODO: what now? probably send an alert
            }
        }

        async revokeCurrentAndLogout() {
            const authToken = this.props.runtime.service('session').getAuthToken();
            try {
                await this.props.runtime.service('session').getClient().logout(authToken);

                this.props.runtime.send('app', 'auth-navigate', {
                    nextRequest: {path: 'auth2/signedout'},
                    tokenInfo: null
                });

                // No need to set the state, as we are redirecting!
                // TODO: or maybe have a redirecting state?
            } catch (ex) {
                console.error(ex);
                // TODO: what now? probably send an alert
            }
        }


        async loadData() {
            this.setState({
                status: 'PENDING'
            });
            const auth2 = new Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const authToken = this.props.runtime.service('session').getAuthToken();

            try {
                const {tokens, current} = await auth2.getTokens(authToken);
                this.setState({
                    status: 'SUCCESS',
                    value: {
                        tokens: tokens.filter((token) => {
                            return token.type === 'Login';
                        }),
                        current
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
            case 'SUCCESS':
                return html`
                    <${LoginTokens} 
                        runtime=${this.props.runtime} 
                        tokens=${this.state.value.tokens} 
                        current=${this.state.value.current}
                        revokeToken=${this.revokeToken.bind(this)}
                        revokeAllTokens=${this.revokeAllTokens.bind(this)}
                        revokeAllTokensAndLogout=${this.revokeAllTokensAndLogout.bind(this)}
                        revokeCurrentAndLogout=${this.revokeCurrentAndLogout.bind(this)}
                    />
                `;
            case 'ERROR':
                return html`
                    <${ErrorAlert} message=${this.state.error.message} />
                `;
            }
        }
    }

    return LoginTokensController;
});