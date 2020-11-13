/* eslint-disable import/no-extraneous-dependencies */
const { exec } = require('child_process')
const ora = require('ora')
const gm = require('gm').subClass({ imageMagick: true })

const loadingText = text => ora({ text, color: 'yellow' }).start()

const getOutputForScreenshot = ({ name, success, flaky, error }) =>
  `${name}: ${`${success} success`.green} | ${`${flaky} flaky`.yellow} | ${`${error} error`.red}`

const startMessage = () =>
  `
------------------------------------------------
--------                                --------
--------      ARGOS FLAKY DETECTOR      --------
--------                                --------
------------------------------------------------

`.magenta

const execShellCommand = cmd =>
  new Promise((resolve, reject) => {
    exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      }
      resolve(stdout || stderr)
    })
  })

const generateFlakyDiff = ({ actualFilename, expectedFilename, diffFilename, outputFile }) =>
  new Promise((resolve, reject) => {
    gm(expectedFilename)
      .append(actualFilename, true)
      .append(diffFilename, true)
      .write(outputFile, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
  })

module.exports = { loadingText, getOutputForScreenshot, startMessage, execShellCommand, generateFlakyDiff }
