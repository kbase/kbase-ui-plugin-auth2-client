define([
    'preact',
    'htm',
    'md5',
    'kb_common_ts/Auth2',
    'lib/Form',
    'kb_service/client/userProfile',

    'bootstrap',
    'css!./AccountEditor.css',
], (
    preact,
    htm,
    md5,
    {Auth2},
    Form,
    UserProfileService
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
                    fields: this.form.getAllFields(),
                    isValid: false
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

        async saveForm() {
            try {
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
                const email = this.form.getFieldState('email').value;
                const realName = this.form.getFieldState('name').value;

                const hashedEmail = md5.hash(email.trim().toLowerCase());
                profile.profile.synced.gravatarHash = hashedEmail;
                profile.user.realname = realName;

                // // Auth2 params
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
