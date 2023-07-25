define([
  'preact',
  'htm',
  './TypeaheadInput',
  './UseAgreements',
  'reactComponents/Well',
  'kb_common_ts/Auth2',
  'json!data/referralSources.json',

  // For effect
  'css!./SignUpForm.css',
], (
    preact,
    htm,
    TypeaheadInput,
    UseAgreements,
    Well,
    auth2,
    referralSources,
) => {
  const {Component} = preact;
  const html = htm.bind(preact.h);

  // eslint-disable-next-line max-len
  const EMAIL_REGEXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  /**
   * doc here
   */
  class FieldEvaluator {
    /**
     * doc here
     * @param {*} param0
     */
    constructor({process, updater}) {
      this.process = process;
      this.updater = updater;
      this.canceled = false;
    }

    /**
     * doc here
     * @return {*}
     */
    async run() {
      const result = await this.process();
      if (this.canceled) {
        return;
      }
      return this.updater(result);
    }

    /**
     * doc here
     */
    cancel() {
      this.canceled = true;
    }
  }

  /**
   * doc here
   */
  class SignUpForm extends Component {
    /**
     * doc here
     * @param {*} props
     */
    constructor(props) {
      super(props);

      this.state = {
        ready: false,
        form: {
          fields: {
            realname: {
              status: 'INITIAL',
              value: this.props.choice.create[0].provfullname,
              isModified: false,
            },
            email: {
              status: 'INITIAL',
              value: this.props.choice.create[0].provemail,
              isModified: false,
            },
            username: {
              status: 'INITIAL',
              value: '',
              isModified: false,
            },
            organization: {
              status: 'INITIAL',
              value: '',
              isModified: false,
            },
            department: {
              status: 'INITIAL',
              value: '',
              isModified: false,
            },
            hearAbout: {
              status: 'INITIAL',
              value: [],
              isModified: false,
            },
          },
        },
        policiesResolved: false,
        agreements: [],
      };

      this.updateQueues = {};

      this.initialize();
    }

    /**
     * Determines if the entire form is valid.
     *
     * @return {boolean}
     */
    formIsValid() {
      const {
        form: {
          fields: {
            realname, email, username, organization, department, hearAbout,
          },
        },
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

    /**
     * Determins if the form may be submitted by the user.
     *
     * @return {boolean}
     */
    canSubmitForm() {
      return this.formIsValid() && this.state.policiesResolved;
    }

    /**
     * doc here
     * @return {*}
     */
    async loadOrganizations() {
      const fetchJSON = async (name) => {
        const path = `${this.props.runtime.pluginResourcePath}/dataSources/`;
        const response = await fetch(`${path}/${name}.json`);
        if (response.status !== 200) {
          throw new Error(`Cannot load data source: ${ name}`);
        }
        return response.json();
      };

      const [institutions, nationalLabs, otherLabs] = await Promise.all([
        fetchJSON('institutions'),
        fetchJSON('nationalLabs'),
        fetchJSON('otherLabs'),
      ]);
      const all = [].concat(
          institutions,
          nationalLabs.map(({name, initials}) => {
            return {
              label: `${name} (${initials})`,
              value: name,
            };
          }),
          otherLabs.map(({name, initials}) => {
            return {
              label: `${name} (${initials})`,
              value: name,
            };
          }),
      );
      return all.map(({label, value}) => {
        return {label, value, search: label.toLowerCase()};
      });
    }

    /**
     * doc here
     */
    async initialize() {
      const organizations = await this.loadOrganizations();
      const fields = {
        realname: await this.evaluateField('realname'),
        email: await this.evaluateField('email'),
        username: await this.evaluateField('username'),
        organization: await this.evaluateField('organization'),
        department: await this.evaluateField('department'),
        hearAbout: await this.evaluateField('hearAbout'),
      };
      this.setState({
        ...this.state,
        form: {
          ...this.state.form,
          fields,
        },
        organizations,
        ready: true,
      });
    }

    /**
     * doc here
     * @param {*} fieldName
     * @return {string}
     */
    requiredIcon(fieldName) {
      const fieldState = this.state.form.fields[fieldName];
      const classes = (() => {
        switch (fieldState.status) {
          case 'REQUIRED_MISSING':
            return 'glyphicon-asterisk text-danger';
          case 'VALID':
            return 'glyphicon-ok text-success';
          case 'LOCAL_VALID':
            return 'glyphicon-asterisk text-warning';
          case 'REMOTE_VALIDATING':
            return 'glyphicon-asterisk text-warning';
          case 'INVALID':
            return 'glyphicon-remove text-danger';
        }
      })();

      return html`
                <span className="glyphicon ${classes}"
                    style=${{marginLeft: '4px'}}>
                </span>
            `;
    }

    /**
     * doc here
     *
     * @param {string} fieldName
     * @return {string}
     */
    getFieldBorderClass(fieldName) {
      const fieldState = this.state.form.fields[fieldName];
      switch (fieldState.status) {
        case 'VALID':
          return '';
        case 'LOCAL_VALID':
          return 'has-error';
        case 'REMOTE_VALIDATING':
          return 'has-error';
        case 'INVALID':
          return 'has-error';
      }
      return '';
    }

    /**
     * doc here
     * @param {*} field
     * @param {*} info
     * @return {string}
     */
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

    /**
     * doc here
     * @param {*} fieldName
     * @param {*} newState
     */
    setFieldState(fieldName, newState) {
      this.setState({
        form: {
          ...this.state.form,
          fields: {
            ...this.state.form.fields,
            [fieldName]: newState,
          },
        },
      });
    }

    /**
     * doc here
     * @param {*} fieldName
     * @return {*}
     */
    getFieldState(fieldName) {
      const {
        form: {
          fields: {
            [fieldName]: fieldState,
          },
        },
      } = this.state;
      return fieldState;
    }

    /**
     * doc here
     * @param {*} fieldName
     * @return {*}
     */
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
                    message: 'Cannot start with a space',
                  };
                }
                return {
                  isValid: true,
                };
              },
            },
            {
              validate: async (value) => {
                if (/\s+$/.test(value)) {
                  return {
                    isValid: false,
                    message: 'Cannot end with a space',
                  };
                }
                return {
                  isValid: true,
                };
              },
            },
          ],
        },
        email: {
          label: 'Email',
          isRequired: true,
          minLength: 2,
          maxLength: 100,
          rules: [{
            validate: async (value) => {
              if (EMAIL_REGEXP.test(value)) {
                return {
                  isValid: true,
                };
              }
              return {
                isValid: false,
                message: 'Not a valid email address',
              };
            },
          }],
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
                    isValid: true,
                  };
                }
                return {
                  isValid: false,
                  message: 'A username may only contain the letters a-z (lower case), the digits 0-9, and _ (underscore).',
                };
              },
            },
            {
              validate: async (value) => {
                if (/^\d+/.test(value)) {
                  return {
                    isValid: false,
                    message: 'A username may not begin with a number',
                  };
                }
                return {
                  isValid: true,
                };
              },
            },
            {
              validate: async (value) => {
                if (/^_+/.test(value)) {
                  return {
                    isValid: false,
                    message: 'A username may not start with the underscore character _',
                  };
                }
                return {
                  isValid: true,
                };
              },
            },
            {
              validate: async (value) => {
                if (/\s/.test(value)) {
                  return {
                    isValid: false,
                    message: 'A username may not contain spaces',
                  };
                }
                return {
                  isValid: true,
                };
              },
            },
          ],
          remoteRuleMessage: 'Username is valid, check if available with KBase',
          remoteRules: [
            {
              validate: async (value) => {
                const auth2Client = new auth2.Auth2({
                  baseUrl: this.props.runtime.config('services.auth.url'),
                });
                try {
                  const {availablename} = await auth2Client.loginUsernameSuggest(value);
                  if (availablename === value) {
                    return {
                      isValid: true,
                    };
                  }
                  return {
                    isValid: false,
                    message: `This username is not available: a suggested available username is ${availablename}`,
                  };
                } catch (ex) {
                  console.error('error looking up username in auth', ex);
                }
              },
            },
          ],
        },
        organization: {
          label: 'Organization',
          isRequired: true,
          minLength: 2,
          maxLength: 100,
          rules: [],
        },
        department: {
          label: 'Department',
          isRequired: true,
          minLength: 2,
          maxLength: 100,
          rules: [],
        },
        hearAbout: {
          label: 'How did you hear about us?',
          isRequired: true,
          availableValues: referralSources,
          rules: [],
        },
      };

      return fieldDefinitions[fieldName];
    }

    /**
     * doc here
     * @param {*} value
     * @param {*} fieldDefinition
     * @return {*}
     */
    validateField(value, fieldDefinition) {
      if (fieldDefinition.minLength) {
        if (value.length < fieldDefinition.minLength) {
          return {
            isValid: false,
            message: `"${fieldDefinition.label}" must have ${fieldDefinition.minLength} or more characters.`,
          };
        }
      }

      if (fieldDefinition.maxLength) {
        if (value.length > fieldDefinition.maxLength) {
          return {
            isValid: false,
            message: `"${fieldDefinition.label}" must have fewer than ${fieldDefinition.maxLength} characters.`,
          };
        }
      }

      return {
        isValid: true,
      };
    }

    /**
     * doc here
     * @param {*} fieldName
     * @param {*} value
     * @return {*}
     */
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
            status: 'REQUIRED_MISSING',
          };
        }
      }

      const {isValid, message} = this.validateField(parsedValue, fieldDefinition);
      if (!isValid) {
        return {
          value,
          isModified: true,
          status: 'INVALID',
          validationMessage: message,
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
              validationMessage: message,
            };
          }
        }
      }

      if ('remoteRules' in fieldDefinition) {
        return {
          value,
          isModified: true,
          status: 'LOCAL_VALID',
          validationMessage: fieldDefinition.remoteRuleMessage,
        };
      }
      return {
        value,
        isModified: true,
        status: 'VALID',
      };
    }

    /**
     * doc here
     * @param {*} fieldName
     * @return {*}
     */
    async evaluateRemoteRules(fieldName) {
      if (!('remoteRules' in fieldDefinition)) {
        return;
      }
      // Apply remote rules.
      const fieldState = this.getFieldState(fieldName);
      const fieldDefinition = this.getFieldDefinition(fieldName);

      const value = fieldState.value;

      for (const rule of fieldDefinition.remoteRules) {
        const {isValid, message} = await rule.validate(value);
        if (!isValid) {
          return {
            value,
            isModified: true,
            status: 'INVALID',
            validationMessage: message,
          };
        }
      }
      return {
        value,
        isModified: true,
        status: 'VALID',
      };
    }

    /**
     * doc here
     * @param {*} fieldName
     */
    cancelUpdateQueue(fieldName) {
      if (!(fieldName in this.updateQueues)) {
        this.updateQueues[fieldName] = [];
      }

      for (const item of this.updateQueues[fieldName]) {
        item.cancel();
      }
      this.updateQueues[fieldName] = [];
    }

    /**
     * doc here
     * @param {*} fieldName
     * @param {*} value
     */
    async updateField(fieldName, value) {
      this.cancelUpdateQueue(fieldName);
      const evaluator = new FieldEvaluator({
        process: async () => {
          return this.evaluateField(fieldName, value);
        },
        updater: (fieldState) => {
          this.setFieldState(fieldName, fieldState);
          // remove from queues
          this.cancelUpdateQueue(fieldName);
        },
      });

      this.updateQueues[fieldName].push(evaluator);
      evaluator.run();
    }

    /**
     * doc here
     * @return {*}
     */
    renderRealnameField() {
      const fieldState = this.state.form.fields.realname;
      const messageClass = (() => {
        switch (fieldState.status) {
          case 'VALID':
            return 'success';
          case 'LOCAL_VALID':
            return 'success';
          case 'INVALID':
            return 'danger';
        }
      })();
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
                        onInput=${(e) => {
    return this.updateField('realname', e.target.value);
  }}
                    />
                    <div className="text-${messageClass}"
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

    /**
     * doc here
     * @return {*}
     */
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
                        onInput=${(e) => {
    return this.updateField('email', e.target.value);
  }}
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

    /**
     * doc here
     * @return {*}
     */
    renderUsernameField() {
      const field = this.renderLookupInputField('username');
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

    /**
     * doc here
     * @return {*}
     */
    renderOrganizationField() {
      const fieldName = 'organization';
      const control = html`
                <${TypeaheadInput} 
                    onSelect=${(org) => {
    this.updateField(fieldName, org);
  }}
              data=${this.state.organizations}
          />

      `;
      const field = this.renderField(fieldName, control);
      const info = '';

      return this.renderFormRow(field, info);
    }

    /**
     * doc here
     * @param {*} fieldName
     * @param {*} control
     * @return {*}
     */
    renderField(fieldName, control) {
      const fieldDefinition = this.getFieldDefinition(fieldName);
      const fieldState = this.state.form.fields[fieldName];
      const messageClassName = (() => {
        switch (fieldState.status) {
          case 'VALID':
            return 'text-success';
          case 'LOCAL_VALID':
            return 'text-warning';
          case 'REMOTE_VALIDATING':
            return 'text-warning';
          case 'INVALID':
            return 'text-danger';
        }
      })();
      return html`
          <div className=${`form-group ${this.getFieldBorderClass(fieldName)}`} style=${{padding: '2px'}}>
              <label for=${`signup_${fieldName}`}>
                  ${fieldDefinition.label} ${this.requiredIcon(fieldName)}
              </label>
              ${control}
              <div className=${messageClassName}
                  style=${{padding: '4px'}}>
                  ${fieldState.validationMessage}
              </div>
          </div>
      `;
    }

    /**
     * doc here
     * @param {*} fieldName
     * @return {*}
     */
    renderInputField(fieldName) {
      const fieldState = this.state.form.fields[fieldName];
      const control = html`
          <input type="text" 
              className="form-control" 
              id=${`signup_${fieldName}`}
              name=${fieldName}
              autocomplete="off"
              value=${fieldState.value}
              onInput=${(e) => {
    this.updateField(fieldName, e.target.value);
  }}
          />
      `;
      return this.renderField(fieldName, control);
    }

    /**
     * doc here
     * @param {*} fieldName
     * @return {*}
     */
    renderLookupInputField(fieldName) {
      const fieldState = this.state.form.fields[fieldName];
      const onLookup = async () => {
        const validate = async (value) => {
          const auth2Client = new auth2.Auth2({
            baseUrl: this.props.runtime.config('services.auth.url'),
          });
          try {
            const {availablename} = await auth2Client.loginUsernameSuggest(value);
            if (availablename === value) {
              return {
                isValid: true,
              };
            }
            return {
              isValid: false,
              message: `This username is not available: a suggested available username is ${availablename}`,
            };
          } catch (ex) {
            console.error('error looking up username in auth', ex);
          }
        };

        const value = this.state.form.fields[fieldName].value;
        this.setFieldState(fieldName, {
          value, isModified: true, status: 'REMOTE_VALIDATING',
          validationMessage: html`Checking if username is available at KBase... <span className="fa fa-spinner fa-pulse " /> `,
        });
        const {isValid, message} = await validate(value);
        const fieldState = (() => {
          if (isValid) {
            return {
              value,
              isModified: true,
              status: 'VALID',
              validationMessage: 'This username is available',
            };
          }
          return {
            value,
            isModified: true,
            status: 'INVALID',
            validationMessage: message,
          };
        })();
        this.setFieldState(fieldName, fieldState);
      };
      // const buttonMessage = (() => {
      //     switch (fieldState.status) {
      //     case 'REQUIRED_MISSING':
      //         return 'Check Username with KBase';
      //     case 'VALID':
      //         return 'Username available';
      //     case 'LOCAL_VALID':
      //         return 'Check Username with KBase';
      //     case 'REMOTE_VALIDATING':
      //         return 'Checking for availability...';
      //     case 'INVALID':
      //         return 'Check Username with KBase';
      //     }
      //     return fieldState.status;
      // })();


      const control = html`
          <div style=${{display: 'flex', flexDirection: 'row'}}>
              <input type="text" 
                  style=${{flex: '1 1 0'}}
                  className="form-control" 
                  id=${`signup_${fieldName}`}
                  name=${fieldName}
                  autocomplete="off"
                  value=${fieldState.value}
                  onInput=${(e) => {
    this.updateField(fieldName, e.target.value);
  }}
              />
              <button type="button"
                  style=${{flex: '0 0 auto'}}
                  className="btn btn-primary"
                  disabled=${fieldState.status !== 'LOCAL_VALID'}
                  onClick=${onLookup}
              >
                  Check for Availability
              </button>
          </div>
      `;
      return this.renderField(fieldName, control);
    }

    /**
     * doc here
     * @return {*}
     */
    renderDescriptionField() {
      const field = this.renderInputField('department');
      const info = '';

      return this.renderFormRow(field, info);
    }

    /**
     * doc here
     * @return {*}
     */
    renderHearAboutField() {
      const fieldName = 'hearAbout';
      const fieldState = this.state.form.fields[fieldName];
      const fieldDefinition = this.getFieldDefinition(fieldName);
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
              text: null,
            });
          } else {
            newValues.push({
              value: e.target.value,
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
          if (!customText || !fieldState.value.find((item)=> {
            return item.value === value;
          })) {
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

    /**
     * doc here
     * @param {*} e
     */
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
            hearAbout: {value: hearAbout},
          },
        },
        agreements,
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
            }, {}),
          },
        },
        agreements,
      };
      this.props.onSubmitSignUp(signupFields);
    }

    /**
     * doc here
     * @param {*} e
     */
    onCancelSignUp(e) {
      e.preventDefault();
      this.props.onCancelSignUp();
    }

    /**
     * doc here
     * @return {*}
     */
    renderFormMessage() {
      if (!this.canSubmitForm()) {
        return html`
            <div className="alert alert-warning" style=${{marginBottom: '1rem'}}><b>Reminder -</b> All fields must be completed in order to create a KBase account</>
        `;
      }
      return html`
          <div className="alert alert-success" style=${{marginBottom: '1rem'}}><b>Ready -</b> All fields are complete, you may now create your account</>
      `;
    }

    /**
     * doc here
     * @return {*}
     */
    renderFormButtons() {
      const disabled = !(this.canSubmitForm());
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

    /**
     * doc here
     * @param {*} agreements
     * @return {*}
     */
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

    // getResolvedPolicies(agreements) {
    //     const missing = this.props.policiesToResolve.filter((missingPolicy) => {
    //         // Filter out the policy if it is agreed to.
    //         return !agreements.find(({id, version}) => {
    //             return id === missingPolicy.id &&
    //                    version === missingPolicy.version;
    //         });
    //     });

    //     // const outdated = this.props.policiesToResolve.outdated.filter((policy) => {
    //     //     // Filter out the policy if it is agreed to.
    //     //     return !agreements.find(({id, version}) => {
    //     //         return id === policy.id &&
    //     //                version === policy.version;
    //     //     });
    //     // });

    //     return missing.length === 0 ;
    // }

    /**
     * doc here
     * @param {*} allAgreedTo
     */
    onAgreed(allAgreedTo) {
      if (allAgreedTo) {
        this.setState({
          policiesResolved: allAgreedTo,
          agreements: this.props.policiesToResolve.map(({id, version}) => {
            return {id, version};
          }),
        });
      } else {
        this.setState({
          policiesResolved: allAgreedTo,
          agreements: [],
        });
      }
    }

    /**
     * doc here
     * @return {*}
     */
    renderSignupForm() {
      return html`
          <div className="container-fluid" style=${{width: '100%'}}>
              <div className="row">
                  <div className="col-md-12">
                      <p>
                      Some field values have been pre-populated from your 
                      <span style=${{padding: '0 0.25em', fontWeight: 'bold'}}>${this.props.choice.provider}</span>
                      account. <b>All fields are required.</b>
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
                  <${UseAgreements} policiesToResolve=${this.props.policiesToResolve} onAgreed=${this.onAgreed.bind(this)}/>
                  <hr />
                  ${this.renderFormMessage()}
                  ${this.renderFormButtons()}
              </form>
          </div>
      `;
    }

    /**
     * doc here
     * @return {*}
     */
    renderSignupPanel() {
      if (!['incomplete', 'complete'].includes(this.props.signupState.status)) {
        return;
      }

      return html`
          <${Well} type="primary">
              ${this.renderSignupForm()}
          </>
      `;
    }

    /**
     * doc here
     * @return {*}
     */
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
