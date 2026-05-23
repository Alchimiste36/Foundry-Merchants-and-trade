import gulp from "gulp";
import less from "gulp-less";

const lessSrc = "./styles/mtt.less";
const cssDest = "./css";
const lessWatch = ["./styles/**/*.less"];

function compileLess() {
  console.log("Compiling MTT Less files from:", lessSrc, "to:", cssDest);

  return gulp
    .src(lessSrc)
    .pipe(
      less().on("error", function (err) {
        console.error("MTT Less Error:", err.message);
        this.emit("end");
      }),
    )
    .pipe(gulp.dest(cssDest));
}

const compile = gulp.series(compileLess);

function watch() {
  gulp.watch(lessWatch, compile);
}

export { compile, watch };
export default gulp.series(gulp.parallel(compile), watch);
