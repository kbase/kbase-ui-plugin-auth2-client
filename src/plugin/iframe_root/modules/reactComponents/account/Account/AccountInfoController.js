define([
    'preact',
    'htm',
    'kb_common_ts/Auth2',
    'reactComponents/ErrorAlert',
    'reactComponents/Loading',
    './AccountInfo'
], (
    preact,
    htm,
    auth2,
    ErrorAlert,
    Loading,
    AccountInfo
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class AccountEditorController extends Component {
        constructor(props) {
            super(props);
            this.state = {
                status: 'NONE'
            };
        }

        componentDidMount() {
            this.loadData();
        }

        async loadData() {
            this.setState({
                status: 'PENDING'
            });
            this.auth2 = new auth2.Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });
            const authToken = this.props.runtime.service('session').getAuthToken();

            try {
                const me = await this.auth2.getMe(authToken);
                const {display, email, created, lastlogin, user}  = me;
                this.setState({
                    status: 'SUCCESS',
                    value: {
                        username: user,
                        realname: display,
                        email,
                        created,
                        lastLogin: lastlogin,
                    }
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

        render() {
            switch (this.state.status) {
            case 'NONE':
            case 'PENDING':
                return html`
                    <${Loading} message="Loading..." />
                `;
            case 'SUCCESS':
                return html`
                    <${AccountInfo} 
                        runtime=${this.props.runtime} 
                        values=${this.state.value}
                        params=${this.props.params} />
                `;
            case 'ERROR':
                return html`
                    <${ErrorAlert} message=${this.state.error.message} />
                `;
            }
        }
    }

    return AccountEditorController;
});
