/* eslint-disable import/no-extraneous-dependencies */
// Comes from argos-ci
// https://github.com/argos-ci/argos/blob/master/apps/screenshot-diff/src/util/image-diff/index.js

const imageDifference = require('image-difference').default

async function diffImages({ actualFilename, expectedFilename, diffFilename, fuzz = '10%' }) {
  const difference = await imageDifference({
    actualFilename,
    expectedFilename,
    diffFilename,
    fuzz,
  })

  const score = difference.value / (difference.width * difference.height)

  return {
    score: score < 0.00003 ? 0 : score,
    pixels: difference.value,
    scoreRaw: score,
  }
}

module.exports = { diffImages }
