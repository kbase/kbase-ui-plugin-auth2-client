define([
    'preact',
    'htm',
    'md5',
    'kb_common_ts/Auth2',
    'kb_service/client/userProfile',
    'reactComponents/ErrorAlert',
    'reactComponents/Loading',
    './AccountEditor',

    'bootstrap',
    'css!./AccountEditor.css',
], (
    preact,
    htm,
    md5,
    {Auth2},
    UserProfileService,
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

        async save({email, realName}) {
            const token = this.props.runtime.service('session').getAuthToken();
            const userProfileClient = new UserProfileService(this.props.runtime.config('services.user_profile.url'), {
                token
            });
            const authClient = new Auth2({
                baseUrl: this.props.runtime.config('services.auth.url')
            });

            const username = this.props.runtime.service('session').getUsername();

            const profile = (await userProfileClient.get_user_profile([username]))[0];

            // Extract field values from form

            const hashedEmail = md5.hash(email.trim().toLowerCase());
            profile.profile.synced.gravatarHash = hashedEmail;
            profile.user.realname = realName;

            // Auth2 params
            const meData = {
                email, display: realName
            };

            await Promise.all([
                authClient.putMe(token, meData),
                userProfileClient.set_user_profile({
                    profile
                })
            ]);

            // TODO: is this still implemented?
            this.props.runtime.send('profile', 'reload');

            this.props.runtime.notifySuccess(
                'Successfully updated your account and user profile',
                3000
            );
        }

        async loadData() {
            this.setState({
                status: 'PENDING'
            });
            this.auth2 = new Auth2({
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
                        params=${this.props.params} 
                        save=${this.save.bind(this)} />
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
