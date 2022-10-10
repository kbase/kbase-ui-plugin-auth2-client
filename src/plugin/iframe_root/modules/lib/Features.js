define(['js-cookie'], (Cookies) => {
    class Features {
        static features() {
            return (Cookies.get('kbase_features') || '').split(/\/S+/);
        }
        static isEnabled(feature) {
            return this.features().includes(feature);
        }
    }

    return Features;
});