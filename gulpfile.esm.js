import { src, dest, series, task } from 'gulp'
import babel from 'gulp-babel'
import stripDebug from 'gulp-strip-debug'
import uglify from 'gulp-uglify'
import rename from 'gulp-rename'
import { exec } from 'child_process'
import rimraf from 'rimraf'
import notifier from 'node-notifier'


/*
    clean -> webpack -> bundle
    리액트 프로젝트는 웹팩으로 빌드 -> /build

 */

const buildEndMessage = cb => {
    notifier.notify({
        title: 'Gulp Message',
        message: '빌드 끝~!~!~!~!!~',
        sound: true,
    });
    cb()
}
const buildAfter = cb => {
    task(buildEndMessage)
    cb()
}
const clean = (cb) => {
    rimraf('output/', cb)
    // exec(`rimraf output/`)
}
const webpackBuild = (cb) => {
    exec(`yarn build`)
    cb()
}

const babelBuild = (cb) => {
    src('src/chrome/*')
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        // .pipe(src('*.js'))
        .pipe(stripDebug())
        .pipe(uglify())
        .pipe(dest('output/'))
        // .pipe(rename({ extname: '.min.js' }))
        // .pipe(dest('output/'))

    cb()
}


const bundle = series(clean, babelBuild)

export {
    clean,
    webpackBuild,
    bundle,
    buildEndMessage,
}

export default series(clean, webpackBuild, bundle, buildAfter)
