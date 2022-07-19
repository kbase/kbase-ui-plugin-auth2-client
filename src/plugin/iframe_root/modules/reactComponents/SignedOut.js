define([
    'preact',
    'htm',

    'bootstrap',
    'css!./ErrorAlert.css',
], (
    preact,
    htm,
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class SignedOut extends Component {
        render() {
            const providerLinksList = this.props.providers.map(({logoutUrl, label}) => {
                return html`
                    <li>
                        <a href=${logoutUrl} target="_blank" role="link">Log out from ${label}</a>
                    </li>
                `;
            });
            return html`
                <div className="container-fluid" style=${{width: '100%'}}>
                    <div className="row"> 
                        <div className="col-md-1">
                        </div>
                        <div className="col-md-10">
                            <p style=${{fontWeight: 'bold'}}>
                                You are signed out of KBase.
                            </p>
                            <p>
                                However, you may still be logged into a identity provider you have recently 
                                used to sign in to KBase in this browser. 
                                This would allow your KBase account to be accessed merely by 
                                using the Sign In button and choosing the sign-in provider.
                            </p>
                            <p>
                                If you wish to ensure that your KBase account is inaccessible from this browser, 
                                you should sign out of any accounts you have used to access KBase as well.
                            </p>
                            <ul>
                                ${providerLinksList}
                            </ul>
                            <p>
                                Additional security measures include:
                            </p>
                            <ul>
                                <li>Remove all browser cookies</li>
                                <li>Use your browser's private-browsing feature</li>
                            </ul>
                        </div>
                        <div className="col-md-1">
                        </div>
                    </div>
                   
                </div>
            `;
        }
    }

    return SignedOut;
});