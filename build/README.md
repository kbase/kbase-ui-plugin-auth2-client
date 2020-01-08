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
yarn install-dist
```

or

```zsh
yarn clean && yarn install && yarn install-bower && yarn install-npm &&yarn remove-source-maps && yarn install-dist
```

> Only use yarn clean if you want to clean out the stuff installed in vendor, as well as the node and bower packages installed in build.

## Preparing for a new release

This plugin provides itself in the `dist` directory. In order to ensure that the dist directory is up-to-date with the source, run `yarn install-dist`.

You can iterate on the raw source locally with `kbase-ui` by removing the dist directory temporarily, and supplying the plugin via the `plugins` option to kbase-ui's `make dev-start` task. kbase-ui will detect the absence of a dist directory and use the src directory instead.