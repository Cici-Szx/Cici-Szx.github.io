# Cici Song — Product Designer

Design engineering portfolio with ten interactive case studies.

Static HTML, CSS and JavaScript. Publish the main branch root using GitHub Pages.

Built from the local portfolio on 28 September 2026.

## English / 简体中文

Every portfolio page and the Campus Tycoon demo includes the top-right language switch.
English remains the default. The choice is remembered in `cici-language` local storage;
`?lang=zh` or `?lang=en` explicitly selects a language and also works when storage is
unavailable. Internal links and the embedded game retain the selected language.

- `locales/zh-CN.js`: reviewed Chinese text keyed by the original English copy, with page-specific overrides.
- `i18n.js`: translates text and accessibility labels in place, preserves interactive state, and restores the original English.
- `i18n-dynamic.js`: Chinese templates for generated simulation and game feedback.
- `i18n.css`: language control and Chinese typography/responsive layout.

When changing English copy, update its matching dictionary key. For new generated
messages, add a template to `i18n-dynamic.js`. Product names, software names, units,
code and original research/prototype images remain in their source form.
