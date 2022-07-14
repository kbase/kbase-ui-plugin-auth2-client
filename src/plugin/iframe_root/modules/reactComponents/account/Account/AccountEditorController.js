define([
    'preact',
    'htm',
    'md5',
    'kb_common_ts/Auth2',
    'reactComponents/ErrorAlert',
    'reactComponents/Loading',
    './AccountEditor',

    'bootstrap',
    'css!./AccountEditor.css',
], (
    preact,
    htm,
    md5,
    auth2,
    ErrorAlert,
    Loading,
    AccountEditor
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

        // doSave({email, realname}) {
        //     const client = new UserProfileService(this.runtime.config('services.user_profile.url'), {
        //         token: this.runtime.service('session').getAuthToken()
        //     });

        //     return client.get_user_profile([account.user]).then((result) => {
        //         // User profile params
        //         const profile = result[0];
        //         const hashedEmail = md5.hash(email.trim().toLowerCase());
        //         profile.profile.synced.gravatarHash = hashedEmail;
        //         profile.user.realname = realname;

        //         // Auth2 params
        //         const meData = {
        //             email, display: realname
        //         };

        //         const currentUserToken = this.runtime.service('session').getAuthToken();
        //         return Promise.all([
        //             this.auth2.putMe(currentUserToken, meData),
        //             client.set_user_profile({
        //                 profile
        //             })
        //         ]).then(() => {
        //             this.runtime.send('profile', 'reload');
        //         });
        //     });
        // }

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
                    <${AccountEditor} 
                        runtime=${this.props.runtime} 
                        fields=${this.state.value}
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