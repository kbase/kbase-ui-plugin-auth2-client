define([
    'preact',
    'htm',
    'uuid',
    'kb_common/format',

    'bootstrap',
    'css!./AccountInfo.css',
], (
    preact,
    htm,
    Uuid,
    format
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class AccountInfo extends Component {
        renderInfoTableRow({label, value, help, render}) {
            const textId = new Uuid(4).format();
            return html`
                <div className="FlexRowGroup" style=${{marginBottom: '1em'}}>
                    <div className="FlexRow">
                        <div className="FlexRow">
                            <label for=${textId} role="label">${label}</b>
                        </div>
                        <div className="FlexCol">
                        </div>
                    </div>
                    <div className="FlexRow">
                        <div className="FlexCol" id=${textId}>
                           ${render ? render(value) : value}
                        </div>
                        <div className="FlexCol">
                           ${help}
                        </div>
                    </div>
                </div>
            `;
        }

        renderInfoTable() {
            return [
                {
                    name: 'username',
                    label: 'Username',
                    help: 'Your permanent identifier within KBase'
                },
                // {
                //     name: 'realname',
                //     label: 'Real name',
                //     help: 'Your tel name, displayed to KBase users'
                // },
                // {
                //     name: 'email',
                //     label: 'E-Mail Address',
                //     help: 'Your email address may be used by KBase staff to contact you.'
                // },
                {
                    name: 'created',
                    label: 'Account Created',
                    help: 'The date and time at which you signed up for KBase',
                    render: (value) => {
                        return format.niceTime(value);
                    }
                },
                {
                    name: 'lastLogin',
                    label: 'Last Sign In',
                    help: 'The date and time you last signed in to KBase',
                    render: (value) => {
                        return `${format.niceElapsedTime(value)
                        } (${
                            format.niceTime(value)
                        })`;
                    }
                }
            ].map((field) => {
                field.value = this.props.values[field.name];
                return this.renderInfoTableRow(field);
            });
        }

        render() {
            return html`
                <div className="AccountInfo">
                    <h3>Account Info (Non-Editable)</h3>
                    <div >
                        ${this.renderInfoTable()}
                    </div>
                </div>
            `;
        }
    }

    return AccountInfo;
});