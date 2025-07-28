# @tapsioss/client-socket-manager

## 0.6.0
### Minor Changes



- [#22](https://github.com/Tap30/client-socket-manager/pull/22) [`e36974c`](https://github.com/Tap30/client-socket-manager/commit/e36974c7c76ec601ffea3ecf523a57cd37c76c08) Thanks [@amir78729](https://github.com/amir78729)! - - [BREAKING CHANGE] The `devtool` field within the `ClientSocketManager`'s constructor `options` has been updated from a boolean to an object. This change allows for more granular control over development tools.
    - Previously: `devtool: boolean`
    - Now: `devtool: { enabled: boolean; zIndex?: number; }`
    - The `enabled` property maintains the previous boolean functionality, while the optional `zIndex` property allows for specifying the stacking order of devtool elements.


- [#19](https://github.com/Tap30/client-socket-manager/pull/19) [`bce3ae7`](https://github.com/Tap30/client-socket-manager/commit/bce3ae7e94adc946a7db19026294c91be31c6eb1) Thanks [@amir78729](https://github.com/amir78729)! - Add `hideDevtool` and `showDevtool` methods to the `ClientSocketManager`.


### Patch Changes



- [#21](https://github.com/Tap30/client-socket-manager/pull/21) [`074befd`](https://github.com/Tap30/client-socket-manager/commit/074befd2d5f9af75394db7b0a853f91494019fb6) Thanks [@amir78729](https://github.com/amir78729)! - Improve devtool expecience in mobile devices.

## 0.5.0
### Minor Changes



- [#15](https://github.com/Tap30/client-socket-manager/pull/15) [`dc77847`](https://github.com/Tap30/client-socket-manager/commit/dc77847f7c1eb9f80f4bbe331184af7cf143d3c2) Thanks [@amir78729](https://github.com/amir78729)! - Add devtool to the client socket manager.

## 0.4.0

### Minor Changes

- [#13](https://github.com/Tap30/client-socket-manager/pull/13)
  [`3e65a1a`](https://github.com/Tap30/client-socket-manager/commit/3e65a1aa25397fbace87876ea33f6dd10f8b9cae)
  Thanks [@amir78729](https://github.com/amir78729)! - Add
  `ClientSocketManagerStub` class to the package for SSR and tests.
