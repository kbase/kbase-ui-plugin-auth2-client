# Build Tools and Configuration

These are here (for now) because they are used for the embedded iframe. We don't want integration with kbase-ui to see these.

## Building

By hand:

```
cd build
yarn clean
yarn install
yarn install-bower
yarn install-npm
yarn remove-source-maps
```

> Only use yarn clean if you want to clean out the stuff installed in vendor, as well as the node and bower packages installed in build.