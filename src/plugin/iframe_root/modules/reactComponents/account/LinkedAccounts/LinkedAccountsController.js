define([
    'preact',
    'htm',
    'md5',
    'kb_common_ts/Auth2',
    'reactComponents/ErrorAlert',
    'reactComponents/Loading',
    './LinkedAccounts',

    'bootstrap',
], (
    preact,
    htm,
    md5,
    {Auth2},
    ErrorAlert,
    Loading,
    AccountEditor
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class LinkedAccountsController extends Component {
        constructor(props) {
            super(props);
            this.currentUserToken = props.runtime.service('session').getAuthToken();
            this.state = {
                status: 'NONE'
            };
        }

        componentDidMount() {
            this.loadData();
        }

        async unlinkIdentity(identityId) {
            const auth2 = new Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            try {
                await auth2.removeLink(this.currentUserToken, {
                    identityId
                });
                this.props.runtime.notifySuccess(
                    'Successfully unlinked identity',
                    3000
                );
                await this.fetchIdentities();
            } catch (ex) {
                console.error(ex);
                this.props.runtime.notifyError(
                    `Error unlinking: ${ex.message}`
                );
            }
        }

        linkIdentity(providerId) {
            try {
                // TODO: routing back into here.
                const params = {
                    provider: providerId,
                    token: this.currentUserToken
                };
                const action = `${this.props.runtime.config('services.auth.url')}/link/start`;

                this.props.runtime.send('app', 'post-form', {
                    action,
                    params
                });

                // this.auth2.linkStart(this.currentUserToken, {
                //     provider: providerId,
                //     node: this.container
                // });
            } catch (ex) {
                console.error(ex);
                this.props.runtime.notifyError(
                    `Error starting the linking process: ${ex.message}`
                );
            }
        }

        async fetchIdentities() {
            const auth2 = new Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const authToken = this.props.runtime.service('session').getAuthToken();

            const {idents} = await auth2.getMe(authToken);
            this.setState({
                status: 'SUCCESS',
                value: {
                    identities: idents
                }
            });
        }

        async loadData() {
            this.setState({
                status: 'PENDING'
            });

            try {
                await this.fetchIdentities();
            } catch (ex) {
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
                    <${AccountEditor} 
                        runtime=${this.props.runtime} 
                        identities=${this.state.value.identities}
                        params=${this.props.params} 
                        linkIdentity=${this.linkIdentity.bind(this)}
                        unlinkIdentity=${this.unlinkIdentity.bind(this)}
                    />
                `;
            case 'ERROR':
                return html`
                    <${ErrorAlert} message=${this.state.error.message} />
                `;
            }
        }
    }

    return LinkedAccountsController;
});
