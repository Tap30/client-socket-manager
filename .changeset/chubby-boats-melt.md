---
"@tapsioss/client-socket-manager": minor
---

- The `devtool` field within the `ClientSocketManager`'s constructor `options` has been updated from a boolean to an object. This change allows for more granular control over development tools.
  - Previously: `devtool: boolean`
  - Now: `devtool: { enabled: boolean; zIndex?: number; }`
  - The `enabled` property maintains the previous boolean functionality, while the optional `zIndex` property allows for specifying the stacking order of devtool elements.
  