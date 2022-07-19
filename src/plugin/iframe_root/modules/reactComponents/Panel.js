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

    function buildIcon(arg) {
        const klasses = ['fa'],
            style = {verticalAlign: 'middle'};
        klasses.push(`fa-${arg.name}`);
        if (arg.rotate) {
            klasses.push(`fa-rotate-${String(arg.rotate)}`);
        }
        if (arg.flip) {
            klasses.push(`fa-flip-${arg.flip}`);
        }
        if (arg.size) {
            if (typeof arg.size === 'number') {
                klasses.push(`fa-${String(arg.size)}x`);
            } else {
                klasses.push(`fa-${arg.size}`);
            }
        }
        if (arg.classes) {
            arg.classes.forEach((klass) => {
                klasses.push(klass);
            });
        }
        if (arg.style) {
            Object.keys(arg.style).forEach((key) => {
                style[key] = arg.style[key];
            });
        }
        if (arg.color) {
            style.color = arg.color;
        }

        return html`
            <span style=${style} className=${klasses.join(' ')} />
        `;
    }

    class Panel extends Component {
        render() {
            const type = this.props.type || 'primary',
                style = this.props.style || {};
            let icon, classes = ['panel', `panel-${type}`];
            if (this.props.classes) {
                classes = classes.concat(this.props.classes);
            }
            if (this.props.icon) {
                icon = [' ', buildIcon(this.props.icon)];
            }
            return html`<div className=${classes.join(' ')} style=${{style}} role="article">
            <div className="panel-heading" role="heading">
                <div className="panel-title">
                    <span>
                        ${this.props.title} ${icon}
                    </span>
                </div>
            </div>
            <div className="panel-body" role="main">
                ${this.props.children}
            </div>
        </div>`;
        }
    }

    return Panel;
});