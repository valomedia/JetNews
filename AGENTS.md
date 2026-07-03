# AGENTS.md – JetNews Repository Guide

## Scope

These instructions apply to the whole repository.

## Project overview

JetNews is an Android sample news reader built with Jetpack Compose.
The single Gradle module is `:app`, with package root `com.example.jetnews`.

Key entry points:

- `app/src/main/java/com/example/jetnews/ui/MainActivity.kt` starts the Compose UI.
- `app/src/main/java/com/example/jetnews/ui/JetnewsApp.kt` wires the app scaffold and navigation drawer.
- `app/src/main/java/com/example/jetnews/ui/JetnewsNavGraph.kt` defines navigation routes.
- `app/src/main/java/com/example/jetnews/data` contains static and HTTP-backed data repositories.
- `app/src/main/java/com/example/jetnews/glance` contains the Glance app widget.

## Build and verification

Run commands from the repository root.

This repository may not have `gradlew` checked in.
If it is missing, create it with:

```shell
gradle wrapper
```

Then use the wrapper for project commands:

```shell
./gradlew build
./gradlew :app:testDebugUnitTest
./gradlew connectedCheck
```

`./gradlew :app:testDebugUnitTest` runs the Robolectric tests.
`./gradlew connectedCheck` requires an Android device or emulator.
The checked-in Android Studio run configurations mirror these test modes.

The root `wrapper` task pins Gradle `9.2.1`.
`app:preBuild` depends on `:wrapper`, so builds can update wrapper files.
Do not commit newly generated or updated Gradle wrapper files unless the task is about wrapper maintenance.

## Android and Kotlin conventions

The project uses Android Gradle Plugin `8.13.1`, Kotlin `2.2.21`, Java toolchain `17`, and Compose.
`gradle.properties` sets `kotlin.code.style=official`.
Follow the existing Kotlin formatting and Compose patterns in nearby files.

Keep package structure consistent:

- `ui/home`, `ui/article`, and `ui/interests` hold screen-specific Compose code.
- `ui/components`, `ui/theme`, `ui/modifiers`, and `ui/utils` hold shared UI helpers.
- `model` holds app models.
- `data` holds repositories and fake/static data.
- `glance` holds app-widget-specific code.

Most source files carry the existing Apache 2.0 copyright header.
Preserve headers when editing existing files and match the surrounding style for new source files.

## Tests

Shared UI tests live in `app/src/sharedTest/java`.
The Gradle config attaches that directory to both `test` and `androidTest` source sets.
When changing UI behavior, prefer adding or updating shared tests when the behavior can run in both Robolectric and instrumented modes.

Robolectric configuration lives in `app/src/test/resources/robolectric.properties`.

## Local configuration and secrets

`settings.gradle.kts` can use `COMPOSE_SNAPSHOT_ID` to add an AndroidX snapshot repository.
Release signing in `app/build.gradle.kts` reads local debug keystore defaults or environment variables.
Do not add secret values or private keystores to the repository.

## Assets and generated files

Screenshots under `screenshots/` and image/font resources under `app/src/main/res/` are checked-in assets.
Avoid replacing binary assets unless the task explicitly requires it.

Build outputs, Gradle caches, and IDE-local files should remain untracked.
