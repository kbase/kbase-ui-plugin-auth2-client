define([
    'preact',
    'htm',
    '../../Tabs',
    './AccountEditorController',
    './AccountInfoController',

    'bootstrap',
], (
    preact,
    htm,
    Tabs,
    AccountEditor,
    AccountInfo
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class Account extends Component {
        renderBody() {
            return html`
                <div style=${{marginLeft: '1em'}}>
                    <div style=${{marginBottom: '2em'}}>
                        <${AccountEditor} runtime=${this.props.runtime}/>
                    </div>

                    <${AccountInfo}  runtime=${this.props.runtime} />
                </div>
            `;
        }
        renderHelp() {
            return html`
                <div>
                    <p>
                        You may view and edit edit your basic account information here.
                    </p>
                    <p>
                        Changes saved will be immediately available
                    </p>
                </div>
            `;
        }
        render() {
            const tabs = [
                {
                    id: 'account',
                    title: 'Update Your Account',
                    render: this.renderBody.bind(this)
                }, {
                    id: 'help',
                    title: html`<span className="fa fa-info-circle" />`,
                    render: this.renderHelp.bind(this)
                }
            ];
            const tabProps = {
                runtime: this.props.runtime,
            };
            return html`
                <div className="AccountManager">
                   <${Tabs} tabs=${tabs} tabProps=${tabProps} bodyStyle=${{marginTop: '1em'}}/>
                </div>
            `;
        }
    }

    return Account;
});