define([
    'preact',
    'htm',
    '../Tabs',
    './Account/Account',
    './LinkedAccounts/LinkedAccountsController',
    './DeveloperTokens/DeveloperTokensController',
    './LoginTokens/LoginTokensController',
    './UseAgreements/Controller',
    './ServiceTokens/ServiceTokensController',

    'bootstrap',
    'css!./AccountManager.css',
], (
    preact,
    htm,
    Tabs,
    Account,
    LinkedAccounts,
    DeveloperTokens,
    LoginTokens,
    UseAgreements,
    ServiceTokensController
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class AccountManager extends Component {
        componentDidMount() {
            this.props.runtime.send('ui', 'setTitle', 'Account Manager');
        }
        render() {
            const tabs = [
                {
                    id: 'account',
                    title: 'Account',
                    component: Account
                },
                {
                    id: 'links',
                    title: 'Linked Sign-In Accounts',
                    component: LinkedAccounts
                }
            ];

            if (this.props.roles.includes('DevToken')) {
                tabs.push({
                    id: 'developerTokens',
                    title: 'Developer Tokens',
                    component: DeveloperTokens
                });
            }

            if (this.props.roles.includes('ServToken')) {
                tabs.push({
                    id: 'serviceTokens',
                    title: 'Service Tokens',
                    component: ServiceTokensController
                });
            }

            tabs.push({
                id: 'loginTokens',
                title: 'Sign-Ins',
                component: LoginTokens
            });

            tabs.push({
                id: 'usePolicyAgreements',
                title: 'Use Agreements',
                component: UseAgreements
            });
            const tabProps = {
                runtime: this.props.runtime,
            };

            const selectedTab = this.props.params && this.props.params.tab;
            return html`
                <div className="AccountManager">
                   <${Tabs} tabs=${tabs} selectedTab=${selectedTab} tabProps=${tabProps} bodyStyle=${{marginTop: '1em'}}/>
                </div>
            `;
        }
    }

    return AccountManager;
});