define([
    'preact',
    'htm',
    'lib/Form',
    'lib/constants',

    'bootstrap',
    'css!./AccountEditor.css',
], (
    preact,
    htm,
    Form,
    {DANGER_COLOR, WARNING_COLOR}
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class AccountEditor extends Component {
        constructor(props) {
            super(props);

            this.form = new Form({
                fields: [
                    {
                        name: 'name',
                        label: 'Name',
                        isRequired: true,
                        minLength: 2,
                        maxLength: 100,
                        rules: [],
                        help: 'Your real name, displayed to other KBase users'
                    },
                    {
                        name: 'email',
                        label: 'E-Mail',
                        isRequired: true,
                        minLength: 5,
                        maxLength: 100,
                        rules: [
                            {
                                validate: async (value) => {
                                    const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                                    if (!regex.test(value)) {
                                        return {
                                            isValid: false,
                                            message: 'Please enter a valid email address'
                                        };
                                    }
                                    return {
                                        isValid: true
                                    };
                                }
                            }
                        ],
                        help: 'Your email address may be used by KBase staff to contact you.'
                    }
                ],
                initialValues: {
                    name: this.props.fields.realname,
                    email: this.props.fields.email
                },
                onUpdate: ({form: {fields}}) => {
                    const isValid = (() => {
                        const fieldList = Object.values(fields);
                        if (fieldList.length === 0) {
                            return null;
                        }
                        return !fieldList.some(({status}) => {
                            return status !== 'VALID';
                        });
                    })();

                    const isModified = (() => {
                        const fieldList = Object.values(fields);
                        if (fieldList.length === 0) {
                            return null;
                        }
                        return fieldList.some(({isModified}) => {
                            return isModified;
                        });
                    })();

                    this.setState({
                        form: {
                            fields,
                            isValid,
                            isModified
                        }
                    });
                }
            });
            this.state = {
                form: {
                    fields: this.form.getAllFields(),
                    isValid: false
                }
            };
        }

        componentDidMount() {
            this.form.initialize();
        }

        renderFormRow(name) {
            const {label, help, isRequired} = this.form.getFieldDefinition(name);
            // const {value} = this.form.getFieldState(name);

            // State is synced with the form object
            const {value, status, message} = this.state.form.fields[name];

            const fieldMessage = ((status, message) => {
                switch (status) {
                case 'INITIAL':
                    return;
                case 'INVALID':
                    return html`
                        <div className="text-danger"
                            style=${{padding: '4px'}}>
                            ${message}
                        </div>
                    `;
                case 'REQUIRED_MISSING':
                    return html`
                        <div className="text-danger"
                            style=${{padding: '4px'}}>
                            ${message}
                        </div>
                    `;
                }
            })(status, message);

            const labelFlag = ((status, message, isRequired) => {
                switch (status) {
                case 'INITIAL':
                    return;
                case 'INVALID':
                    if (isRequired) {
                        return html`
                            <span className="fa fa-asterisk text-danger -label-flag" />
                        `;
                    }
                    return;
                case 'REQUIRED_MISSING':
                    return html`
                        <span className="fa fa-asterisk text-danger -label-flag" />
                    `;
                case 'VALID':
                    if (isRequired) {
                        return html`
                            <span className="fa fa-check text-success -label-flag" />
                        `;
                    }
                    return;
                }
            })(status, message, isRequired);

            const controlStyle = ((status) => {
                const style = {};
                switch (status) {
                case 'INITIAL':
                    style.borderColor = WARNING_COLOR;
                    break;
                case 'INVALID':
                    style.borderColor = DANGER_COLOR;
                    break;
                case 'REQUIRED_MISSING':
                    style.borderColor = DANGER_COLOR;
                }
                return style;
            })(status);

            return html`
                <div className="FlexRowGroup" style=${{marginBottom: '1em'}}>
                    <div className="FlexRow">
                        <div className="FlexRow">
                            <b>${label}</b> ${labelFlag}
                        </div>
                        <div className="FlexCol">
                        </div>
                    </div>
                    <div className="FlexRow">
                        <div className="FlexCol" style=${{marginRight: '1em'}}>
                            <input className="form-control" 
                                style=${controlStyle}
                                value=${value} 
                                onInput=${(e) => {
        this.form.updateField(name, e.target.value);
    }} />
                        </div>
                        <div className="FlexCol">
                           ${help}
                        </div>
                    </div>

                    ${fieldMessage}
                </div>
            `;
        }

        async saveForm() {
            try {
                const email = this.form.getFieldState('email').value;
                const realName = this.form.getFieldState('name').value;
                await this.props.save({
                    email, realName
                });
                this.form.commit();
            } catch (ex) {
                console.error(ex);
                this.props.runtime.notifyError(
                    `Error updating account or profile: ${ex.message}`
                );
            }
        }

        onSubmit(e) {
            e.preventDefault();
            this.saveForm();
        }

        render() {
            return html`
                <div className="AccountEditor">
                    <h3>Edit Account</h3>
                    <form 
                        onSubmit=${this.onSubmit.bind(this)}>
                        ${this.renderFormRow('name')}
                        ${this.renderFormRow('email')}
                        <div>
                            <button className="btn btn-primary"
                                disabled=${!(this.state.form.isValid && this.state.form.isModified)}
                                type="submit">
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            `;
        }
    }

    return AccountEditor;
});
