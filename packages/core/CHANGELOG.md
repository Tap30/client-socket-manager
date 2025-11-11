# @tapsioss/client-socket-manager

## 0.7.0
### Patch Changes



- [#31](https://github.com/Tap30/client-socket-manager/pull/31) [`f7f054a`](https://github.com/Tap30/client-socket-manager/commit/f7f054abdfd08f944e1ffa3c807aa8df4afe6016) Thanks [@amir78729](https://github.com/amir78729)! - Increase test coverage.



- [#29](https://github.com/Tap30/client-socket-manager/pull/29) [`4a97376`](https://github.com/Tap30/client-socket-manager/commit/4a97376066c285d8db4d03e15c0913626cda7b40) Thanks [@amir78729](https://github.com/amir78729)! - Preserve the scroll position of channels and logs section inside the DevTool.



- [#28](https://github.com/Tap30/client-socket-manager/pull/28) [`a05b316`](https://github.com/Tap30/client-socket-manager/commit/a05b31638b5b2e00abe4a442e9343e061f7ac3ca) Thanks [@amir78729](https://github.com/amir78729)! - Break long words in DevTool's log details for preventing horizontal scroll.



- [#25](https://github.com/Tap30/client-socket-manager/pull/25) [`028d050`](https://github.com/Tap30/client-socket-manager/commit/028d05039f061d93dfdf197581f3146dbb7a1b62) Thanks [@amir78729](https://github.com/amir78729)! - Sync devtool with socket instance.

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
