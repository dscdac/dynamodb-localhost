"use strict";

var tar = require("tar"),
  zlib = require("zlib"),
  path = require("path"),
  https = require("https"),
  fs = require("fs"),
  ProgressBar = require("progress"),
  utils = require("./utils");

var download = function (downloadUrl, installPath, callback) {
  console.log(
    `Started downloading dynamodb-local from ${downloadUrl} into ${installPath}. Process may take few minutes.`
  );
  https
    .get(downloadUrl, function (response) {
      var len = parseInt(response.headers["content-length"], 10),
        bar = new ProgressBar(
          "Downloading dynamodb-local [:bar] :percent :etas",
          {
            complete: "=",
            incomplete: " ",
            width: 40,
            total: len
          }
        );

      if (200 != response.statusCode) {
        throw new Error(
          "Error getting DynamoDb local latest tar.gz location " +
          response.headers.location +
          ": " +
          response.statusCode
        );
      }

      response
        .pipe(zlib.Unzip())
        .pipe(
          tar.x({
            C: installPath
          })
        )
        .on("data", function (chunk) {
          bar.tick(chunk.length);
        })
        .on("end", function () {
          callback("\n Installation complete!");
        })
        .on("error", function (err) {
          throw new Error("Error in downloading Dynamodb local " + err);
        });
    })
    .on("error", function (err) {
      throw new Error("Error in downloading Dynamodb local " + err);
    });
};

var install = function (config, callback) {
  var install_path = utils.absPath(config.setup.install_path),
    jar = config.setup.jar,
    download_url = config.setup.download_url;

  try {
    if (fs.existsSync(path.join(install_path, jar))) {
      callback("Dynamodb is already installed on path!");
    } else {
      utils.createDir(config.setup.install_path);
      download(download_url, install_path, callback);
    }
  } catch (err) {
    throw new Error("Error configuring or installing Dynamodb local " + err);
  }
};
module.exports.install = install;
