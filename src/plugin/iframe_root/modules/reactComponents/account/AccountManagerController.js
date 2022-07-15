define([
    'preact',
    'htm',
    'kb_common_ts/Auth2',
    'reactComponents/ErrorAlert',
    'reactComponents/Loading',
    './AccountManager',

    'bootstrap'
], (
    preact,
    htm,
    {Auth2},
    ErrorAlert,
    Loading,
    AccountManager
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class AccountManagerController extends Component {
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

                const auth2 = new Auth2({
                    baseUrl: this.props.runtime.config('services.auth.url')
                });
                const authToken = this.props.runtime.service('session').getAuthToken();
                const {roles} = await auth2.getMe(authToken);

                this.setState({
                    status: 'SUCCESS',
                    value: {
                        roles: roles.map(({id}) => {return id;})
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
                    roles
                } = this.state.value;
                return html`
                    <${AccountManager} 
                        runtime=${this.props.runtime}
                        roles=${roles}
                        params=${this.props.params}
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

    return AccountManagerController;

});
