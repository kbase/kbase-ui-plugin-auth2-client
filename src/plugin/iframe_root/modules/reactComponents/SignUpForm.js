define([
    'preact',
    'htm',
    'lib/dataSource',
    './TypeaheadInput',
    './UseAgreements',
    'reactComponents/Well',
    'kb_common_ts/Auth2',
    'json!data/referralSources.json',

    // For effect
    'css!./SignUpForm.css'
], (
    preact,
    htm,
    DataSource,
    TypeaheadInput,
    UseAgreements,
    Well,
    auth2,
    referralSources
) => {
    const {Component} = preact;
    const html = htm.bind(preact.h);
    class SignUpForm extends Component {
        constructor(props) {
            super(props);

            this.dataSource = DataSource({
                path: `${this.props.runtime.pluginResourcePath}/dataSources/`,
                sources: {
                    // Raw data source
                    institutions: {
                        file: 'institutions.json',
                        type: 'json'
                    },
                    nationalLabs: {
                        file: 'nationalLabs.json',
                        type: 'json'
                    },
                    otherLabs: {
                        file: 'otherLabs.json',
                        type: 'json'
                    },

                    // A computed data source.
                    organizations: {
                        sources: {
                            institutions: {
                                translate: false
                            },
                            nationalLabs: {
                                translate(item) {
                                    return {
                                        value: item.name,
                                        label: `${item.name} (${item.initials})`
                                    };
                                }
                            },
                            otherLabs: {
                                translate(item) {
                                    return {
                                        value: item.name,
                                        label: `${item.name} (${item.initials})`
                                    };
                                }
                            }
                        }
                    }
                }
            });

            this.state = {
                form: {
                    fields: {
                        realname: {
                            status: 'INITIAL',
                            value: this.props.choice.create[0].provfullname,
                            isModified: false
                            // isValid: true,
                            // isValidating: false,
                            // isModified: false,
                            // originalValue: null,
                            // value: null,
                            // validationMessage: 'validation message here...'
                        },
                        email: {
                            status: 'INITIAL',
                            value: this.props.choice.create[0].provemail,
                            isModified: false
                        },
                        username: {
                            status: 'INITIAL',
                            value: '',
                            isModified: false
                        },
                        organization: {
                            status: 'INITIAL',
                            value: '',
                            isModified: false
                        },
                        department: {
                            status: 'INITIAL',
                            value: '',
                            isModified: false
                        },
                        hearAbout: {
                            status: 'INITIAL',
                            value: [],
                            isModified: false
                        }
                    }
                },
                policiesResolved: this.arePoliciesResolved([]),
                agreements: []
            };

            this.initialize();
        }

        formIsValid() {
            const {
                form: {
                    fields: {
                        realname, email, username, organization, department, hearAbout
                    }
                }
            } = this.state;

            return (
                realname.status === 'VALID' &&
                email.status === 'VALID' &&
                username.status === 'VALID' &&
                organization.status === 'VALID' &&
                department.status === 'VALID' &&
                hearAbout.status === 'VALID'
            );
        }

        async initialize() {
            const fields = {
                realname: await this.evaluateField('realname'),
                email: await this.evaluateField('email'),
                username: await this.evaluateField('username'),
                organization: await this.evaluateField('organization'),
                department: await this.evaluateField('department'),
                hearAbout: await this.evaluateField('hearAbout')
            };
            this.setState({
                ...this.state,
                form: {
                    ...this.state.form,
                    fields
                }
            });
        }

        requiredIcon(fieldName) {
            const fieldState = this.state.form.fields[fieldName];
            const classes = (() => {
                if (fieldState.status !== 'VALID') {
                    return 'glyphicon-asterisk text-danger';
                }
                return  'glyphicon-ok text-success';
            })();

            return html`
                <span className="glyphicon ${classes}"
                    style=${{marginLeft: '4px'}}>
                </span>
            `;
        }

        getFieldBorderClass(fieldName) {
            const fieldState = this.state.form.fields[fieldName];
            if (fieldState.status !== 'VALID') {
                return 'has-error';
            }
            return '';

            // if (fieldState.isValidating) {
            //     // return '1px solid yellow';
            //     return 'bs-border-warning';
            // }
            // if (fieldState.isModified) {
            // if (fieldState.status === 'VALID') {
            //     // return '1px solid transparent';
            //     return 'bs-border-invisible';
            // }
            // // return '1px solid red';
            // return 'bs-border-danger';

            // }
            // // return '1px solid transparent';
            // return 'bs-border-invisible';
        }

        renderFormRow(field, info) {
            return html`
                <div className="row">
                    <div className="col-md-5">
                        ${field}
                    </div>
                    <div className="col-md-7" style=${{paddingTop: '20px'}}>
                        ${info}
                    </div>
                </div>
            `;
        }

        setFieldState(fieldName, newState) {
            this.setState({
                form: {
                    ...this.state.form,
                    fields: {
                        ...this.state.form.fields,
                        [fieldName]: newState
                    }
                }
            });
        }

        getFieldState(fieldName) {
            const {
                form: {
                    fields: {
                        [fieldName]: fieldState
                    }
                }
            } = this.state;
            return fieldState;
        }

        getFieldDefinition(fieldName) {
            const fieldDefinitions = {
                realname: {
                    label: 'Real Name',
                    isRequired: true,
                    minLength: 2,
                    maxLength: 100,
                    rules: [
                        {
                            validate: async (value) => {
                                if (/^\s+/.test(value)) {
                                    return {
                                        isValid: false,
                                        message: 'Cannot start with a space'
                                    };
                                }
                                return {
                                    isValid: true
                                };
                            }
                        },
                        {
                            validate: async (value) => {
                                if (/\s+$/.test(value)) {
                                    return {
                                        isValid: false,
                                        message: 'Cannot end with a space'
                                    };
                                }
                                return {
                                    isValid: true
                                };
                            }
                        }
                    ]
                },
                email: {
                    label: 'Email',
                    isRequired: true,
                    minLength: 2,
                    maxLength: 100,
                    rules: []
                },
                username: {
                    label: 'KBase Username',
                    isRequired: true,
                    minLength: 2,
                    maxLength: 100,
                    rules: [
                        {
                            validate: async (value) => {
                                if (/^[a-z0-9_]+$/.test(value)) {
                                    return {
                                        isValid: true
                                    };
                                }
                                return {
                                    isValid: false,
                                    message: 'A username may only contain the letters a-z (lower case), the digits 0-9, and _ (underscore).'
                                };
                            }
                        },
                        {
                            validate: async (value) => {
                                if (/^[0-9]+/.test(value)) {
                                    return {
                                        isValid: false,
                                        message: 'A username may not begin with a number'
                                    };
                                }
                                return {
                                    isValid: true
                                };
                            }
                        },
                        {
                            validate: async (value) => {
                                if (/^_+/.test(value)) {
                                    return {
                                        isValid: false,
                                        message: 'A username may not start with the underscore character _'
                                    };
                                }
                                return {
                                    isValid: true
                                };
                            }
                        },
                        {
                            validate: async (value) => {
                                if (/\s/.test(value)) {
                                    return {
                                        isValid: false,
                                        message: 'A username may not contain spaces'
                                    };
                                }
                                return {
                                    isValid: true
                                };
                            }
                        },
                        {
                            validate: async (value) => {
                                const auth2Client = new auth2.Auth2({
                                    baseUrl: this.props.runtime.config('services.auth.url')
                                });
                                try {
                                    const {availablename} = await auth2Client.loginUsernameSuggest(value);
                                    if (availablename === value) {
                                        return {
                                            isValid: true
                                        };
                                    }
                                    return {
                                        isValid: false,
                                        message: `This username is not available: a suggested available username is ${availablename}`
                                    };
                                } catch (ex) {
                                    console.error('error looking up username in auth', ex);
                                }
                            }
                        }
                    ]
                },
                organization: {
                    label: 'Organization',
                    isRequired: true,
                    minLength: 2,
                    maxLength: 100,
                    rules: []
                },
                department: {
                    label: 'Department',
                    isRequired: true,
                    minLength: 2,
                    maxLength: 100,
                    rules: []
                },
                hearAbout: {
                    label: 'How did you hear about us?',
                    isRequired: true,
                    availableValues: referralSources,
                    rules: []
                }
            };

            return fieldDefinitions[fieldName];
        }

        validateField(value, fieldDefinition) {
            if (fieldDefinition.minLength) {
                if (value.length < fieldDefinition.minLength) {
                    return {
                        isValid: false,
                        message: `"${fieldDefinition.label}" must have ${fieldDefinition.minLength} or more characters.`
                    };
                }
            }

            if (fieldDefinition.maxLength) {
                if (value.length > fieldDefinition.maxLength) {
                    return {
                        isValid: false,
                        message: `"${fieldDefinition.label}" must have fewer than ${fieldDefinition.maxLength} characters.`
                    };
                }
            }

            return {
                isValid: true
            };
        }

        async evaluateField(fieldName, value) {
            // Apply rules.
            // Realname is required, has no character limit afaik, but let us impose
            // a default of 100 characters.

            const fieldState = this.getFieldState(fieldName);
            const fieldDefinition = this.getFieldDefinition(fieldName);

            if (typeof value === 'undefined') {
                value = fieldState.value;
            }

            const parsedValue = (() => {
                if (typeof value === 'string') {
                    return value.trim();
                }
                return value;
            })();


            if (fieldDefinition.isRequired) {
                if (value.length === 0) {
                    return {
                        value,
                        isModified: true,
                        status: 'REQUIRED_MISSING'
                    };
                }
            }

            const {isValid, message} = this.validateField(parsedValue, fieldDefinition);
            if (!isValid) {
                return {
                    value,
                    isModified: true,
                    status: 'INVALID',
                    validationMessage: message
                };
            }

            if ('rules' in fieldDefinition) {
                for (const rule of fieldDefinition.rules) {
                    const {isValid, message} = await rule.validate(value);
                    if (!isValid) {
                        return {
                            value,
                            isModified: true,
                            status: 'INVALID',
                            validationMessage: message
                        };
                    }
                }
            }

            return {
                value,
                isModified: true,
                status: 'VALID'
            };
        }

        async updateField(fieldName, value) {
            const fieldState = await this.evaluateField(fieldName, value);
            this.setFieldState(fieldName, fieldState);
        }

        renderRealnameField() {
            const fieldState = this.state.form.fields.realname;
            const field = html`
                <div className=${`form-group ${this.getFieldBorderClass('realname')}`} style=${{padding: '2px'}}>
                    <label for="signup_realname">
                        Your Name ${this.requiredIcon('realname')}
                    </label>
                    <input type="text" 
                        className="form-control" 
                        id="signup_realname" 
                        name="realname"
                        autocomplete="off"
                        value=${fieldState.value}
                        onInput=${(e) => {return this.updateField('realname', e.target.value);}}
                    />
                    <div className="text-danger"
                        style=${{padding: '4px'}}>
                        ${fieldState.validationMessage}
                    </div>
                </div>
            `;

            const info = html`
                <div>
                    <div>
                        <p>
                            This field contains your name as you wish it to be displayed to other KBase users
                        </p>
                    </div>
                    <div className="hidden">
                        <p>
                            This name will be displayed to other KBase users until you create your profile. 
                            When you create your profile, a new display name will be created which contains 
                            additional information, including title, suffix, first and last name.
                        </p>
                        <p>
                            After you create your profile, that name information will be used for display to 
                            other users (when they are logged in), and in Narratives and related data you may publish.
                            When you have a profile, the name shown here
                            on your account will only be visible to KBase staff.
                        </p>
                    </div>

                </div>
            `;

            return this.renderFormRow(field, info);
        }

        renderEmailField() {
            // TODO: validationFieldBorder
            //
            const fieldState = this.state.form.fields.email;
            const field = html`
                <div className=${`form-group ${this.getFieldBorderClass('realname')}`} style=${{padding: '2px'}}>
                    <label for="signup_realname">
                        E-Mail ${this.requiredIcon('email')}
                    </label>
                    <input type="text" 
                        className="form-control" 
                        id="signup_realname" 
                        name="realname"
                        autocomplete="off"
                        value=${fieldState.value}
                        onInput=${(e) => {return this.updateField('email', e.target.value);}}
                    />
                    <div className="text-danger"
                        style=${{padding: '4px'}}>
                        ${fieldState.validationMessage}
                    </div>
                </div>
            `;

            const info = html`
                <div>
                    <div>
                        <p>
                            KBase may occasionally use this email address to communicate important information about KBase or your account.
                        </p>
                         <p>
                            KBase will not share your email address with anyone, and other KBase users will not be able to see it.
                        </p>
                    </div>
                    <div className="hidden">
                        <p>
                            Is there anything else to say?
                        </p>
                    </div>
                </div>
            `;

            return this.renderFormRow(field, info);
        }

        renderUsernameField() {
            const field = this.renderInputField('username');
            const info = html`
                <div>
                    <div>
                        <p>
                            Your KBase username is the primary identifier associated with all of 
                            your work and assets within KBase.
                        </p>
                         <p style=${{fontWeight: 'bold'}}>
                            Your username is permanent and may not be changed later, so please choose wisely.
                        </p>
                    </div>
                    <div className="hidden">
                        <p>
                            Is there anything else to say?
                        </p>
                    </div>
                </div>
            `;
            return this.renderFormRow(field, info);
        }

        renderOrganizationField() {
            const fieldName = 'organization';
            const fieldState = this.state.form.fields[fieldName];
            const control = html`
                <${TypeaheadInput} 
                    value=${fieldState.value}
                    onSelect=${(org) => {this.updateField(fieldName, org);}}
                    dataSource=${this.dataSource.getFilter('organizations')} />
            `;
            const field = this.renderField(fieldName, control);
            const info = '';

            return this.renderFormRow(field, info);
        }

        renderField(fieldName, control) {
            const fieldDefinition = this.getFieldDefinition(fieldName);
            const fieldState = this.state.form.fields[fieldName];
            return html`
                <div className=${`form-group ${this.getFieldBorderClass(fieldName)}`} style=${{padding: '2px'}}>
                    <label for=${`signup_${fieldName}`}>
                        ${fieldDefinition.label} ${this.requiredIcon(fieldName)}
                    </label>
                    ${control}
                    <div className="text-danger"
                        style=${{padding: '4px'}}>
                        ${fieldState.validationMessage}
                    </div>
                </div>
            `;
        }

        renderInputField(fieldName) {
            const fieldState = this.state.form.fields[fieldName];
            const control = html`
                <input type="text" 
                    className="form-control" 
                    id=${`signup_${fieldName}`}
                    name=${fieldName}
                    autocomplete="off"
                    value=${fieldState.value}
                    onInput=${(e) => {this.updateField(fieldName, e.target.value);}}
                />
            `;
            return this.renderField(fieldName, control);
        }

        renderDescriptionField() {
            const field = this.renderInputField('department');
            const info = '';

            return this.renderFormRow(field, info);
        }

        renderHearAboutField() {
            const fieldName = 'hearAbout';
            const fieldState = this.state.form.fields[fieldName];
            const fieldDefinition = this.getFieldDefinition(fieldName);
            // const control = html`
            //     <${TypeaheadInput}
            //         value=${fieldState.value}
            //         onSelect=${(org) => {this.updateField(fieldName, org);}}
            //         dataSource=${this.dataSource.getFilter(fieldName)} />
            // `;
            const onChange = (e) => {
                const values = fieldState.value;
                let newValues;
                const itemDefinition = fieldDefinition.availableValues.filter(({value}) => {
                    return value === e.target.value;
                })[0];
                if (e.target.checked) {
                    newValues = values.slice();
                    if (itemDefinition.customText) {
                        newValues.push({
                            value: e.target.value,
                            text: null
                        });
                    } else {
                        newValues.push({
                            value: e.target.value
                        });
                    }
                } else {
                    newValues = values.filter((value) => {
                        return value.value !== e.target.value;
                    });
                }
                this.updateField('hearAbout', newValues);
            };
            const checkBoxes = fieldDefinition.availableValues.map(({label, value, customText}) => {
                const inputChanged = (e) => {
                    const fieldState = this.getFieldState('hearAbout');
                    const currentValues = fieldState.value;
                    const itemState = currentValues.filter((currentValue) => {
                        return currentValue.value === value;
                    })[0];
                    itemState.text = e.target.value;
                    this.setFieldState('hearAbout', fieldState);

                };
                const input = (() => {
                    if (!customText || !fieldState.value.find((item)=> {return item.value === value;})) {
                        return;
                    }
                    return html`
                        <div>
                            <input className="form-control" onInput=${inputChanged} tabindex="0"/>
                        </div>
                    `;
                })();
                return html`
                    <div style=${{display: 'flex', flexDirection: 'row'}}>
                        <div style=${{flex: '0 0 1.5em'}}>
                            <input type="checkbox" 
                                className="-checkbox" 
                                tabindex="0"
                                value=${value} 
                                onChange=${onChange}/>
                        </div>
                        <div style=${{flex: '1 1 0'}}>
                            <div>${label}</div>
                            ${input}
                        </div>
                    </div>
                `;
            });
            const control = html`
                <div className="-hearAbout">
                    ${checkBoxes}
                </div>
            `;
            const field = this.renderField(fieldName, control);
            const info = html`
                <p>
                    Select all that apply.
                </p>
            `;

            return this.renderFormRow(field, info);
        }

        onSubmitSignUp(e) {
            e.preventDefault();
            const {
                form: {
                    fields: {
                        username: {value: username},
                        realname: {value: realname},
                        email: {value: email},
                        organization: {value: organization},
                        department: {value: department},
                        hearAbout: {value: hearAbout}
                    },
                },
                agreements
            } = this.state;
            const signupFields = {
                account: {username, realname, email},
                profile: {organization, department},
                survey: {
                    hearAbout: {
                        question: this.getFieldDefinition('hearAbout').label,
                        response: hearAbout.reduce((response, {value, text}) => {
                            response[value] = text || '';
                            return response;
                        }, {})
                    }
                },
                agreements
            };
            this.props.onSubmitSignUp(signupFields);
        }

        onCancelSignUp(e) {
            e.preventDefault();
            this.props.onCancelSignUp();
        }

        renderFormButtons() {
            const disabled = !(this.formIsValid() && this.state.policiesResolved);
            return html`
                <div className="btn-toolbar" style=${{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <button className="btn btn-primary" 
                        disabled=${disabled}
                        onClick=${this.onSubmitSignUp.bind(this)}
                    >
                        Create KBase Account
                    </button>
                    <button className="btn btn-danger"
                        onClick=${this.onCancelSignUp.bind(this)}>
                        Cancel Sign Up
                    </button>
                </div>
            `;
        }

        arePoliciesResolved(agreements) {
            const missing = this.props.policiesToResolve.filter((missingPolicy) => {
                // Filter out the policy if it is agreed to.
                return !agreements.find(({id, version}) => {
                    return id === missingPolicy.id &&
                           version === missingPolicy.version;
                });
            });

            // const outdated = this.props.policiesToResolve.outdated.filter((policy) => {
            //     // Filter out the policy if it is agreed to.
            //     return !agreements.find(({id, version}) => {
            //         return id === policy.id &&
            //                version === policy.version;
            //     });
            // });

            return missing.length === 0;
        }

        getResolvedPolicies(agreements) {
            const missing = this.props.policiesToResolve.filter((missingPolicy) => {
                // Filter out the policy if it is agreed to.
                return !agreements.find(({id, version}) => {
                    return id === missingPolicy.id &&
                           version === missingPolicy.version;
                });
            });

            // const outdated = this.props.policiesToResolve.outdated.filter((policy) => {
            //     // Filter out the policy if it is agreed to.
            //     return !agreements.find(({id, version}) => {
            //         return id === policy.id &&
            //                version === policy.version;
            //     });
            // });

            return missing.length === 0 ;
        }

        onAgree(agreements) {
            this.setState({
                policiesResolved: this.arePoliciesResolved(agreements),
                agreements
            });
        }

        renderSignupForm() {
            return html`
                    <div className="container-fluid" style=${{width: '100%'}}>
                        <div className="row">
                            <div className="col-md-12">
                                <p>
                                Some field values have been pre-populated from your 
                                <span style=${{padding: '0 0.25em', fontWeight: 'bold'}}>${this.props.choice.provider}</span>
                                account
                                </p>
                            </div>
                        </div>
                        <form autocomplete="off">
                            ${this.renderRealnameField()}
                            <hr />
                            ${this.renderEmailField()}
                            <hr />
                            ${this.renderUsernameField()}
                            <hr />
                            ${this.renderOrganizationField()}
                            <hr />
                            ${this.renderDescriptionField()}
                            <hr />
                            ${this.renderHearAboutField()}
                            <hr />
                            <${UseAgreements} policiesToResolve=${this.props.policiesToResolve} onAgree=${this.onAgree.bind(this)}/>
                            <hr />
                            ${this.renderFormButtons()}
                        </form>
                    </div>
                `;
        }


        renderSignupPanel() {
            if (!['incomplete', 'complete'].includes(this.props.signupState.status)) {
                return;
            }

            return html`
                <${Well} type="primary">
                    ${this.renderSignupForm()}
                </>
            `;

            // return html`
            //     <${Panel}
            //         type="default"
            //         classes=${['kb-panel-light']}
            //         title="Sign up for KBase">
            //         ${this.renderSignupForm()}
            //     </>
            // `;
        }

        render() {
            return html`
                <div className="SignUpForm">
                    ${this.renderSignupPanel()}
                </div>
            `;
        }
    }
    return SignUpForm;
});
