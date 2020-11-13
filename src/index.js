#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
const commandLineArgs = require('command-line-args')
const FlakyDetector = require('./FlakyDetector')

const { startMessage } = require('./helpers')
const options = require('./options')

require('draftlog').into(console)

const run = async () => {
  console.log(startMessage())

  const flakyDetector = new FlakyDetector(commandLineArgs(options))

  await flakyDetector.init()
  await flakyDetector.runReferenceTest()
  await flakyDetector.runFlakyTests()

  flakyDetector.writeReport()
  process.exit(flakyDetector.exitCode)
}

run()
