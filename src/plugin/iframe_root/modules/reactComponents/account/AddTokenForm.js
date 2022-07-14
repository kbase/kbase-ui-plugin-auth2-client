define([
    'preact',
    'htm',

    'bootstrap'
], (
    preact,
    htm
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class AddTokenForm extends Component {
        constructor(props) {
            super(props);
            this.state = {
                tokenName: null
            };
        }
        onSubmit(e) {
            e.preventDefault();
            this.props.createToken(this.state.tokenName);
            this.setState({
                tokenName: null
            });
        }
        onTokenNameChange(e) {
            this.setState({
                tokenName: e.target.value
            });
        }
        render() {
            return html`
                <form className="form-inline"
                    onSubmit=${this.onSubmit.bind(this)}
                >
                    <div className="form-group">
                        <label style=${{marginRight: '4px'}}>
                            Token name
                        </label>
                        <input name="token-name"
                            onInput=${this.onTokenNameChange.bind(this)}
                            value=${this.state.tokenName}
                            className="form-control" />
                        ${' '}
                        <button className="btn btn-primary"
                            type="submit">
                            Create Token
                        </button>
                    </div>
                </form>
            `;
        }
    }

    return AddTokenForm;
});