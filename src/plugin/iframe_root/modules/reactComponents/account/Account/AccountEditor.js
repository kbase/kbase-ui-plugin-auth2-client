define([
    'preact',
    'htm',
    'md5',
    'kb_common_ts/Auth2',
    'lib/Form',

    'bootstrap',
    'css!./AccountEditor.css',
], (
    preact,
    htm,
    md5,
    auth2,
    Form
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
                onUpdate: ({form}) => {
                    this.setState({
                        form
                    });
                }
            });

            // this.fieldDefinitions = {
            //     name: {
            //         label: 'Name',
            //         isRequired: true,
            //         minLength: 2,
            //         maxLength: 100,
            //         rules: [],
            //         help: 'Your real name, displayed to other KBase users'
            //     },
            //     email: {
            //         label: 'E-Mail',
            //         minLength: 5,
            //         maxLength: 100,
            //         rules: [],
            //         help: 'Your email address may be used by KBase staff to contact you.'
            //     }
            // };
            // this.state = {
            //     form: {
            //         fields: {
            //             name: {
            //                 value: this.props.fields.realname,
            //                 status: 'INITIAL'
            //             },
            //             email: {
            //                 value: this.props.fields.email,
            //                 status: 'INITIAL'
            //             }
            //         }
            //     }
            // };
            this.state = {
                form: {
                    fields: this.form.getAllFields()
                }
            };
        }

        componentDidMount() {
            this.form.initialize();
        }

        // validateField(value, fieldDefinition) {
        //     if (fieldDefinition.minLength) {
        //         if (value.length < fieldDefinition.minLength) {
        //             return {
        //                 isValid: false,
        //                 message: `"${fieldDefinition.label}" must have ${fieldDefinition.minLength} or more characters.`
        //             };
        //         }
        //     }

        //     if (fieldDefinition.maxLength) {
        //         if (value.length > fieldDefinition.maxLength) {
        //             return {
        //                 isValid: false,
        //                 message: `"${fieldDefinition.label}" must have fewer than ${fieldDefinition.maxLength} characters.`
        //             };
        //         }
        //     }

        //     return {
        //         isValid: true
        //     };
        // }

        // updateField(name, value) {
        //     this.setState({
        //         ...this.state,
        //         form: {
        //             ...this.state.form,
        //             fields: {
        //                 ...this.state.form.fields,
        //                 [name]: {
        //                     value
        //                 }
        //             }
        //         }
        //     });
        // }

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

            const dangerColor = '#a94442';
            const successColor = '#3c763d';
            const warningColor = '#8a6d3b';
            const infoColor = '#31708f';

            const labelFlag = ((status, message, isRequired) => {
                switch (status) {
                case 'INITIAL':
                    return;
                case 'INVALID':
                    if (isRequired) {
                        return html`
                            <span style=${{color: dangerColor, display: 'inline'}} className="fa fa-asterisk" />
                        `;
                    }
                    return;
                case 'REQUIRED_MISSING':
                    return html`
                        <span style=${{color: dangerColor, display: 'inline'}} className="fa fa-asterisk" />
                    `;
                case 'VALID':
                    if (isRequired) {
                        return html`
                            <span style=${{color: successColor, display: 'inline'}} className="fa fa-check" />
                        `;
                    }
                    return;
                }
            })(status, message, isRequired);

            const controlStyle = ((status, message, isRequired) => {
                const style = {};
                switch (status) {
                case 'INITIAL':
                    style.borderColor = warningColor;
                    break;
                case 'INVALID':
                    style.borderColor = dangerColor;
                    break;
                case 'REQUIRED_MISSING':
                    style.borderColor = dangerColor;
                }
                return style;
            })(status, message, isRequired);

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

        onSubmit(e) {
            e.preventDefault();
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
