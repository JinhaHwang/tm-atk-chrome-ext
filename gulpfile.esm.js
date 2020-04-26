import { src, dest, series, task, watch } from 'gulp'
import babel from 'gulp-babel'
import stripDebug from 'gulp-strip-debug'
import gulpIf from 'gulp-if'
import uglify from 'gulp-uglify'
import rename from 'gulp-rename'
import { exec } from 'child_process'
import rimraf from 'rimraf'
import notifier from 'node-notifier'


/*
    clean -> webpack -> bundle
    리액트 프로젝트는 웹팩으로 빌드 -> /build

 */

const outputDir = 'dist/'

const clean = (cb) => {
    rimraf(outputDir, cb)
    // exec(`rimraf output/`)
}
const webpackBuild = (cb) => {
    exec(`yarn build`)
    cb()
}

const babelBuild = () => {
    const fileCheck = file => {
        return file.path.indexOf('jquery') === -1
    }
    return src('src/chrome/**/*.js')
        .pipe(gulpIf(fileCheck, babel({
            presets: ['@babel/preset-env']
        })))
        .pipe(dest(outputDir))
        // .pipe(src('*.js'))
        // .pipe(stripDebug())
        .pipe(gulpIf(fileCheck, uglify()))
        .pipe(gulpIf(fileCheck, rename({ extname: '.min.js' })))
        .pipe(dest(outputDir))
        // .pipe(dest('output/'))

}

const copy = () => {
    return src('src/chrome/*')
        .pipe(dest(outputDir))
}


const bundle = series(clean, copy, babelBuild)

const watchBundle = () => {
    watch('src/chrome/**/*.js', bundle)
}

export {
    clean,
    webpackBuild,
    bundle,
    watchBundle,
}

export default series(clean, webpackBuild, copy, babelBuild)
