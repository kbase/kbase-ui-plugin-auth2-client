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
                agreedTo: []
            };
        }

        togglePolicyAgreement(policyRef) {
            const agreedTo = (() => {
                if (this.state.agreedTo.find(({id, version}) => {
                    return id === policyRef.id && version === policyRef.version;
                })) {
                    return this.state.agreedTo.filter(({id, version}) => {
                        return !(id === policyRef.id && version === policyRef.version);
                    });
                }
                return this.state.agreedTo.concat([policyRef]);

            })();
            this.setState({
                agreedTo
            });
            this.props.onAgree(agreedTo.map(({id, version}) => {
                return {id, version};
            }));
        }

        isAgreedTo(policy) {
            return !!this.state.agreedTo.find(({id, version}) => {
                return id === policy.id && version === policy.version;
            });
        }


        getAgreement(policyRef) {
            return this.state.agreedTo.find(({id, version}) => {
                return id === policyRef.id && version === policyRef.version;
            });
        }

        renderMissingAgreements() {
            if (this.props.policiesToResolve.length === 0) {
                return;
            }
            const missingAgreements = this.props.policiesToResolve.map(({id, version, title, publishedAt, policyContent}) => {
                const agreementViewer = (() => {
                    if (this.isAgreedTo({id, version})) {
                        return;
                    }
                    return html`
                        <div name="agreement-viewer" 
                            style=${{
                        height: '400px',
                        overflowY: 'scroll',
                        border: '1px silver solid',
                        padding: '4px',
                        backgroundColor: '#EEE'
                    }}
                                className="policy-markdown"
                                dangerouslySetInnerHTML=${{__html: policyContent}}>
                        </div>
                    `;
                })();

                const agreementMessage = (() => {
                    if (!this.isAgreedTo({id, version})) {
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

                return html `
                    <div style=${{
        marginTop: '10px',
        padding: '6px',
        // TODO: this property does note exist yet.
        border: this.isAgreedTo({id, version}) ? '2px #3c763d solid' : '2px #a94442 solid'
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
                                    <label style=${{cursor: 'pointer'}} className=${!this.isAgreedTo({id, version}) ? 'text-danger' : ''}>
                                        <input 
                                            type="checkbox" 
                                            style=${{marginRight: '0.25em'}}
                                            checked=${this.isAgreedTo({id, version})}
                                            name="agreed" 
                                            onClick=${() => {this.togglePolicyAgreement({id, version});}} />
                                        I have read and agree to this policy
                                    </label>
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
            return html`
                <div>
                    <h3>KBase Use Policies</h3>
                    <p>
                        The following KBase account policies have not yet been agreed to by this account.
                    </p>
                    <p>
                        You may log into this account after you have agreed to these policies by checking the box next to each.
                    </p>
                    ${missingAgreements}
                </div>
            `;
        }

        //     renderOutdatedAgreements() {
        //         if (this.props.policiesToResolve.outdated.length === 0) {
        //             return;
        //         }
        //         const outdatedAgreements = this.props.policiesToResolve.outdated.map(({id, version, policy}) => {
        //             const agreementViewer = (() => {
        //                 if (this.isAgreedTo({id, version})) {
        //                     return;
        //                 }
        //                 return html`
        //                     <div name="agreement-viewer"
        //                         style=${{
        //                     height: '400px',
        //                     overflowY: 'scroll',
        //                     border: '1px silver solid',
        //                     padding: '4px',
        //                     backgroundColor: '#EEE'
        //                 }}
        //                             className="policy-markdown"
        //                             dangerouslySetInnerHTML=${{__html: policy.fileContent}}>
        //                     </div>
        //                 `;
        //             })();

        //             const agreementMessage = (() => {
        //                 if (!this.isAgreedTo({id, version})) {
        //                     return;
        //                 }
        //                 return html`
        //                     <div className="alert alert-info -agreementMessage">
        //                         <p>
        //                             You have agreed to this policy.
        //                         </p>
        //                         <p>
        //                             To show the agreement again, uncheck the agreement.
        //                         </p>
        //                     </div>
        //                 `;
        //             })();

        //             // const agreedAt = (() => {
        //             //     if (!this.isAgreedTo({id, version})) {
        //             //         return;
        //             //     }
        //             //     const {agreedAt} = this.getAgreement({id, version});
        //             //     return html`
        //             //         <div className="-agreementMessage">
        //             //            Agreed to on: <span>${Intl.DateTimeFormat('en-US', {
        //             //         dateStyle: 'short',
        //             //         timeStyle: 'short',
        //             //         hour12: true
        //             //     }).format(new Date(agreedAt))}</span>
        //             //         </div>
        //             //     `;
        //             // })();

        //             return html `
        //                 <div style=${{
        //     marginTop: '10px',
        //     padding: '6px',
        //     // TODO: this property does note exist yet.
        //     border: this.isAgreedTo({id, version}) ? '2px #3c763d solid' : '2px #a94442 solid'
        // }}>

        //                     <div className="row">
        //                         <div className="col-md-4">
        //                             <div style=${{fontWeight: 'bold'}}>
        //                                 ${policy.title}
        //                             </div>
        //                             <div>
        //                                 Version: <span>${policy.version}</span>
        //                             </div>
        //                             <div>
        //                                 Published on: <span>${Intl.DateTimeFormat('en-US', {
        //     dateStyle: 'short',
        //     timeStyle: 'short',
        //     hour12: true
        // }).format(new Date(policy.begin))}</div>
        //                             </div>
        //                             <div style=${{marginTop: '10px'}}>
        //                                 <label style=${{cursor: 'pointer'}} className=${!this.isAgreedTo({id, version}) ? 'text-danger' : ''}>
        //                                     <input
        //                                         type="checkbox"
        //                                         style=${{marginRight: '0.25em'}}
        //                                         checked=${this.isAgreedTo({id, version})}
        //                                         name="agreed"
        //                                         onClick=${() => {this.togglePolicyAgreement(policy);}} />
        //                                     I have read and agree to this policy
        //                                 </label>
        //                             </div>
        //                         </div>
        //                         <div className="col-md-8">
        //                             <div>
        //                                 ${agreementViewer}
        //                                 ${agreementMessage}
        //                             </div>
        //                         </div>
        //                     </div>
        //                 </div>
        //             `;
        //         });
        //         return html`
        //             <div>
        //                 <h3>KBase Use Policies</h3>
        //                 <p>
        //                     The following KBase account policies have been updated since you last agreed to them.
        //                 </p>
        //                 <p>
        //                     You may log into this account after you have agreed to these policies by checking the box next to each.
        //                 </p>
        //                 ${outdatedAgreements}
        //             </div>
        //         `;
        //     }


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