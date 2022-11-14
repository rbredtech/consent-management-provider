import { minify as minifyJs, MinifyOptions, MinifyOutput } from "uglify-js";

const minifyOptions: MinifyOptions = {
  compress: {
    negate_iife: false,
    keep_fargs: true,
  },
  mangle: {
    keep_fnames: true,
  },
};

export function minify(
  files: string | string[] | { [file: string]: string }
): MinifyOutput {
  return minifyJs(files, minifyOptions);
}
