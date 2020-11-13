## Prerequisit

You need to install `imagemagick` used by Argos to compute diffs:

```
brew install imagemagick
```

## How to use it

Simply pick your test path as you'd do with `rails test`, and run for example:

```
./ci/argos-flaky-detector/run.js test/integration/patient/mobile/homepage_test.rb:49
```