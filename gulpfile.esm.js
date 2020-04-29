import { dest, series, src, watch, parallel } from 'gulp'
import babel from 'gulp-babel'
import gulpIf from 'gulp-if'
import uglify from 'gulp-uglify'
import rename from 'gulp-rename'
import { exec } from 'child_process'
import rimraf from 'rimraf'
import webpackStream from 'webpack-stream'

/*
    clean -> webpack -> bundle
    리액트 프로젝트는 웹팩으로 빌드 -> /build

 */

const outputDir = 'dist/'

const clean = (cb) => {
    rimraf(outputDir, cb)
    // exec(`rimraf output/`)
}
const reactBuild = (cb) => {
    exec(`yarn build`)
    cb()
}

const fileCheck = (file) => file.path.indexOf('jquery') === -1

const atkBuild = () =>
    src('src/chrome/lib/atk.js')
        .pipe(
            webpackStream({
                config: require('./webpack.config.chrome'),
            }),
        )
        .pipe(dest(outputDir))

const contentsScriptBuild = () =>
    src('src/chrome/contentsScript.js')
        .pipe(
            babel(),
        )
        .pipe(dest(outputDir))
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(dest(outputDir))

const copy = () =>
    src('src/chrome/**/*').pipe(
        gulpIf((file) => {
            return file.path.indexOf('atk.js') === -1
        }, dest(outputDir)),
    )

// const bundle = series(clean, copy)
const bundle = series(clean, parallel(copy, atkBuild, contentsScriptBuild))

const watchBundle = () => {
    watch('src/chrome/**/*.js', bundle)
}

export { clean, reactBuild, bundle, watchBundle }

export default bundle
