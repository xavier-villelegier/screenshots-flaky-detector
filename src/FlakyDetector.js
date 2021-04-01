require('colors')
const fs = require('fs-extra')
const map = require('lodash/map')
const filter = require('lodash/filter')

const { diffImages } = require('./image-diff')
const { getOutputForScreenshot, generateFlakyDiff, execShellCommand, loadingText } = require('./helpers')

require('draftlog').into(console)

class FlakyDetector {
  constructor(options) {
    this.options = options
    this.options.ouput = options.ouput || options.directory
    this.log(options)
    this.screenshots = {}
  }

  log = (...params) => this.options.verbose && console.log(...params)

  init() {
    const { directory, output } = this.options

    if (!fs.existsSync(directory)) fs.mkdirSync(directory)
    else fs.emptyDirSync(directory)

    if (!fs.existsSync(output)) fs.mkdirSync(output)
  }

  // Execute reference test
  async runReferenceTest() {
    const { command, directory } = this.options
    const referenceTestLoader = loadingText(`Executing reference test ${command}...`)
    const res = await execShellCommand(command).catch(error => {
      referenceTestLoader.fail()
      console.log(error.toString().red);
      process.exit(1)
    })
    this.log(res)
    referenceTestLoader.text = 'Reference test run successfully'
    referenceTestLoader.succeed()

    // List screenshots to test
    const files = await fs.readdir(directory)
    files
      .filter(file => file.endsWith('.png'))
      .forEach(nameWithExtension => {
        const name = nameWithExtension.split('.')[0]
        this.screenshots[name] = { name, flaky: 0, success: 0, error: 0, diffs: [] }
      })
    const screenshotsCount = Object.keys(this.screenshots).length
    console.log(`${screenshotsCount} screenshots found\n\n`)

    // Suffix reference screenshots to _0
    map(this.screenshots, ({ name }) => {
      fs.renameSync(`${directory}/${name}.png`, `${directory}/${name}_0.png`)
    })
  }

  async computeDiffs(i) {
    const { command, directory, output } = this.options
    try {
      await execShellCommand(command)
      await Promise.all(
        map(this.screenshots, async ({ name, log }) => {
          const actualFilename = `${directory}/${name}_${i}.png`
          const expectedFilename = `${directory}/${name}_0.png`
          const diffFilename = `${directory}/${name}_diff_${i}.png`
          const outputFile = `${output}/${name}_flaky_${i}.png`

          // Suffix screenshot with _${i}
          fs.renameSync(`${directory}/${name}.png`, actualFilename)

          try {
            const difference = await diffImages({
              actualFilename,
              expectedFilename,
              diffFilename,
            })

            if (difference.score > 0) {
              this.screenshots[name].flaky++
              await generateFlakyDiff({
                actualFilename,
                expectedFilename,
                diffFilename,
                outputFile,
              })
              this.screenshots[name].diffs.push(outputFile)
            } else {
              this.screenshots[name].success++
            }

            log(getOutputForScreenshot(this.screenshots[name]))
          } catch (error) {
            console.log(error)
            this.screenshots[name].error++
          }
        })
      )
    } catch (error) {
      this.log(error)
      // Error for all screenshots of the round i
      Object.keys(this.screenshots).map(key => screenshots[key].error++)
    }
  }

  async runFlakyTests() {
    const { number } = this.options

    // Prepare log for the screenshots
    map(this.screenshots, (screenshot, key) => {
      this.screenshots[key].log = console.draft(getOutputForScreenshot(screenshot))
    })

    // Run the tests number times and compare screenshots
    const runningTestsLoader = loadingText()
    for (let i = 1; i <= number; i++) {
      runningTestsLoader.text = `Run ${i} / ${number}...`
      await this.computeDiffs(i)
    }
    runningTestsLoader.stop()

    this.result = filter(this.screenshots, 'flaky').length
    this.exitCode = this.result > 0 ? 1 : 0
  }

  writeReport() {
    const flakiesReport =
      this.result > 0 ? `${this.result} flaky screenshot detected`.red : 'No flaky screenshot detected'.green

    console.log(`\n${flakiesReport}\n`)
    if (this.result > 0) {
      console.log('All the flaky diffs: ')
      map(this.screenshots, screenshot => screenshot.diffs)
        .flat()
        .forEach(diffPath => console.log(diffPath))
    }
  }
}

module.exports = FlakyDetector
