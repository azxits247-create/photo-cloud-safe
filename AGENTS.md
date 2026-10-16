<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use manifest-only home-screen installation; do not add an app-shell service worker unless offline use is requested, to keep previews current.
- InstallationGate wraps the root Outlet and exposes screens only in standalone/iOS home-screen mode; this is a presentation restriction, not proof of installation or a security boundary.
- Keep installed-app navigation in AppHeader as a shared bottom pill bar so gallery and plan screens have consistent navigation and safe-area spacing.
