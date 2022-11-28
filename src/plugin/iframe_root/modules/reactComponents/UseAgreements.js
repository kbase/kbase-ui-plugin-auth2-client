define([
    'preact',
    'htm',

    'bootstrap',
    'css!./UseAgreements.css',
], (
    preact,
    htm,
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class UseAgreements extends Component {
        constructor(props) {
            super(props);

            this.state = {
                policyResolution: this.props.policiesToResolve.map((policy) => {
                    return {
                        policy,
                        isViewed: !!policy.policyContent,
                        isAgreedTo: false
                    };
                })
            };
        }

        onViewed(index) {
            const policyResolution = this.state.policyResolution.slice();
            const policy = policyResolution[index];
            if (policy.isViewed) {
                return;
            }
            policy.isViewed = true;
            this.setState({
                policyResolution
            });
        }

        toggleIsAgreedTo(index) {
            const policyResolution = this.state.policyResolution.slice();
            const policy = policyResolution[index];
            policy.isAgreedTo = !policy.isAgreedTo;
            this.setState({
                policyResolution
            }, () => {
                if (this.state.policyResolution.every(({isAgreedTo}) => {
                    return isAgreedTo;
                })) {
                    this.props.onAgreed(true);
                } else {
                    this.props.onAgreed(false);
                }
            });
        }

        renderMissingAgreements() {
            if (this.props.policiesToResolve.length === 0) {
                return;
            }
            const missingAgreements = this.state.policyResolution.map(({policy: {id, version, title, publishedAt, url, policyContent}, isViewed, isAgreedTo}, index) => {
                const agreementViewer = (() => {
                    if (isAgreedTo) {
                        return;
                    }
                    if (policyContent) {
                        return html`
                            <div name="agreement-viewer" 
                                style=${{
                        maxHeight: '400px',
                        overflowY: 'scroll',
                        border: '1px silver solid',
                        padding: '4px',
                        backgroundColor: '#EEE'
                    }}
                                    className="policy-markdown"
                                    dangerouslySetInnerHTML=${{__html: policyContent}}>
                            </div>
                        `;
                    }
                    return html`
                            <div name="agreement-viewer" 
                                style=${{
                        maxHeight: '400px',
                        overflowY: 'scroll',
                        border: '1px silver solid',
                        padding: '4px',
                        backgroundColor: '#EEE'
                    }}
                                    className="policy-markdown">
                                <h1>${title}</h1>
                                <p>
                                    Please open and review the <a href="${url}" target="_blank" onClick=${() => {
                        this.onViewed(index);
                    }}>KBase Terms and Conditions</a>. 
                                </p>
                                <p>
                                    The document will open in a separate browser window.
                                </p>
                            </div>
                        `;
                })();

                const agreementMessage = (() => {
                    if (!isAgreedTo) {
                        return;
                    }
                    return html`
                        <div className="alert alert-info -agreementMessage">
                            <p>
                                You have agreed to this policy.
                            </p>
                            <p>
                                To show the agreement again, uncheck the agreement.
                            </p>
                        </div>
                    `;
                })();

                const agreementLabel = (() => {
                    if (isViewed) {
                        if (isAgreedTo) {
                            return html`
                            <div style=${{cursor: 'pointer'}} 
                                onClick=${() => {this.toggleIsAgreedTo(index);}}
                                className="text-success"
                                style="font-weight: bold; cursor: pointer;">
                                I have read and agree to this policy
                            </div>
                        `;
                        }
                        return html`
                                <div style=${{cursor: 'pointer'}} 
                                    onClick=${() => {this.toggleIsAgreedTo(index);}}
                                    className="text-danger"
                                    style="font-weight: bold; cursor: pointer;"
                                    >
                                    I have read and agree to this policy
                                </div>
                            `;
                    }
                    return html`
                        <div style="cursor: not-allowed;" title=${`The ${title} must be opened before you can agree to it`}>I have read and agree to this policy</div>
                    `;
                })();

                const mustViewMessage = (() => {
                    if (policyContent) {
                        return;
                    }
                    if (isViewed) {
                        if (isAgreedTo) {
                            return html`
                                <div className="alert alert-success">
                                    <p>
                                        You have agreed to this policy.
                                    </p>
                                </div>
                            `;
                        }
                        return html`
                            <div className="alert alert-warning">
                                <p>
                                    You have opened the policy document and should now agree to it.
                                </p>
                            </div>
                        `;
                    }
                    return html`
                        <div className="alert alert-danger">
                            <p className="xtext-danger" style="font-weight: bold;">
                                You must open the <i>${title}</i> before you may agree to it.
                            </p>
                        </div>
                    `;
                })();

                return html `
                    <div style=${{
        marginTop: '10px',
        padding: '6px',
        // TODO: this property does note exist yet.
        border: isAgreedTo ? '2px #3c763d solid' : '2px #a94442 solid'
    }}>

                        <div className="row">
                            <div className="col-md-4">
                                <div style=${{fontWeight: 'bold'}}>
                                    ${title}
                                </div>
                                <div>
                                    Version: <span>${version}</span>
                                </div>
                                <div>
                                    Published on: <span>${Intl.DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
        hour12: true
    }).format(new Date(publishedAt))}</div>
                                </div>
                                <div style=${{marginTop: '10px'}}>
                                    <div style="display: flex; flex-direction: column;">
                                        <div style="display:flex; flex-direction: row">
                                            <div style="flex: 0 0 1em;">
                                                 <input 
                                                    type="checkbox" 
                                                    style=${{marginRight: '0.25em'}}
                                                    checked=${isAgreedTo}
                                                    disabled=${!policyContent && !isViewed}
                                                    title=${policyContent || isViewed ? '' : `The ${title} must be opened before you can agree to it`}
                                                    name="agreed" 
                                                    onClick=${() => {this.toggleIsAgreedTo(index);}} />
                                            </div>
                                            <div style="flex: 1 1 0">
                                               ${agreementLabel}
                                            </div>
                                        </div>
                                        <div style="display:flex; flex-direction: row">
                                            <div style="flex: 0 0 1em;">
                                            </div>
                                            <div style="flex: 1 1 0">
                                                ${mustViewMessage}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-8">
                                <div>
                                    ${agreementViewer}
                                    ${agreementMessage}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            const phrase = (() => {
                if (this.props.policiesToResolve.length === 1) {
                    switch (this.props.policiesToResolve[0].status) {
                    case 'new':
                        return 'not yet been agreed to by this account';
                    case 'updated':
                        return 'been updated';
                    }
                }
            })();

            return html`
                <div>
                    <h3 style="margin-top: 0; padding-top: 0">KBase Use Policies</h3>
                    <p>
                        The following KBase use ${this.props.policiesToResolve.length === 1 ? 'policy has' : 'policies have'} ${phrase}.
                    </p>
                    <p>
                        You may log into this account after you have agreed to ${this.props.policiesToResolve.length === 1 ? 'this policy' : 'these policies'} by checking the box next to ${this.props.policiesToResolve.length === 1 ? 'it' : 'each'}.
                    </p>
                    ${missingAgreements}
                </div>
            `;
        }

        render() {
            if (this.props.policiesToResolve.length === 0) {
                return;
            }
            return html`
                <div className="UseAgreements">
                    ${this.renderMissingAgreements()}
                </div>
            `;
        }
    }

    return UseAgreements;
});