define([
    'preact',
    'htm',

    'bootstrap',
    'css!./Alert.css',
], (
    preact,
    htm,
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class Alert extends Component {
        renderIcon() {
            switch (this.props.type) {
            case 'error':
                return 'fa-exclamation-triangle';
            case 'warning':
                return 'fa-exclamation-triangle';
            case 'info':
                return 'fa-info';
            case 'success':
                return 'fa-check';
            }
        }
        renderAlertTypeClass() {
            switch (this.props.type) {
            case 'error':
                return 'danger';
            case 'warning':
                return 'warning';
            case 'info':
                return 'info';
            case 'success':
                return 'success';
            }
        }
        defaultTitle() {
            switch (this.props.type) {
            case 'error':
                return 'Error!';
            case 'warning':
                return 'Warning!';
            case 'info':
                return 'Info';
            case 'success':
                return 'Success';
            }
        }
        renderTitle() {
            const title = this.props.title || this.defaultTitle();
            return html`
                <div className="Alert-title">
                    <span className=${`fa ${this.renderIcon()}`} />
                    ${title}
                </div>
            `;
        }
        render() {
            const content = (() => {
                if (this.props.render) {
                    return this.props.render();
                }
                return this.props.message || this.props.children;
            })();
            return html`
                <div
                    className=${`alert alert-${this.renderAlertTypeClass()} Alert`}
                    style=${this.props.style}
                >
                    ${this.renderTitle()}
                    ${content}
                </div>
            `;
        }
    }

    return Alert;
});
