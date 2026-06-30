# AGENTS.md – JetNews

## Project overview

JetNews is an Android sample news app built with Kotlin and Jetpack Compose.
It demonstrates Compose UI patterns for article lists,
article detail pages,
interest selection,
and an AppWidget powered by Glance.

Keep changes small and aligned with the existing Android sample structure.
Do not add new architecture layers,
network abstractions,
or dependencies unless the issue explicitly asks for them.

## Repository layout

- `app/src/main/java/com/example/jetnews/` contains application code.
- `app/src/main/java/com/example/jetnews/ui/` contains Compose UI,
navigation,
theme,
and shared UI utilities.
- `app/src/main/java/com/example/jetnews/data/` contains repositories and sample data.
- `app/src/main/java/com/example/jetnews/glance/` contains the Glance AppWidget implementation.
- `app/src/sharedTest/java/com/example/jetnews/` contains tests shared by JVM Robolectric and instrumented test source sets.
- `gradle/libs.versions.toml` is the dependency version catalog.
- `screenshots/` contains README/demo assets;
do not replace them unless the UI change requires it.

## Setup and commands

- This repository does not track Gradle wrapper files.
  If `./gradlew` is missing,
  create it with `gradle wrapper`.
- Build the project with `./gradlew build` after the wrapper exists.
- Run Robolectric tests with `./gradlew testDebug`.
- Run connected Android tests with `./gradlew connectedCheck` only when a device or emulator is available and the change needs device verification.
- Use the Android Studio run configurations in `.run/` for manual Robolectric or instrumented test runs.

Run the narrowest command that proves your change.
For documentation-only changes,
`git diff --check` and direct inspection are sufficient.

## Code style

- Write Kotlin using the official Kotlin style configured in `gradle.properties`.
- Use four-space indentation in Kotlin,
Gradle Kotlin DSL,
and XML files.
- Preserve existing copyright and license headers in source and Gradle files.
- Keep Compose functions focused,
readable,
and named after the UI they render.
- Prefer explicit state and helper functions over dense inline expressions.
- Match existing package names under `com.example.jetnews`.
- Keep imports sorted by the IDE/Kotlin defaults.
- Use the version catalog for dependency coordinates and versions.

## Testing guidance

- Add or update shared tests for behavior changes that can run under Robolectric.
- Prefer Compose test queries based on visible text,
content descriptions,
or semantics users can perceive.
- For navigation or screen-state changes,
verify the relevant screen transition or visible UI state.
- For AppWidget changes,
run the most relevant build/test command available locally and document any device-only verification that could not be run.

## Repository hygiene

- Do not commit generated build output,
`.gradle/`,
Android Studio metadata,
logs,
or local SDK configuration.
- Do not commit secrets,
keystore passwords,
API tokens,
or environment-specific files.
- Keep generated Gradle wrapper files out of git unless a human explicitly asks to track them.
- Keep dependency changes minimal and update `gradle/libs.versions.toml` in the same change when needed.
- Avoid reformatting unrelated files.
