import Twit from "twit";
import { createCsvFileReader } from "ya-csv";
import { spawn } from "child_process";
import bbPromise from "bluebird";
import csv from "csvtojson";
import Error from "boom"; // Error responses application implementation
import sample from "lodash/sample";

// import database from "../db";

const Tw = new Twit({
  consumer_key: "",
  consumer_secret: "",
  access_token: "",
  access_token_secret: "",
  timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
});
const filename = process.argv[2];
const followers = [];

const readFile = () => csv().fromFile(filename);

const isNumeric = handle => /^\d*$/.test(handle);

const getQueryObject = (handle, cursor) => {
  const q = {};

  if (cursor) {
    q.cursor = cursor;
  }

  if (isNumeric(handle)) {
    q.user_id = handle;
  } else {
    const splittedHandle = handle.split("https://twitter.com/");

    q.screen_name =
      splittedHandle.length > 1 ? splittedHandle[1] : splittedHandle[0];
  }

  return q;
};

const hitTwitter = q =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log("Call Twitter API every minute");
      // Tw.get("followers/ids", q).then(resolve);

      resolve({
        data: {
          ids: [1, 2, 3],
          next_cursor_str: sample([
            // "1540775249248256926",
            "2",
            "0"
          ])
        }
      });
    }, 60 * 1000);
  });

processFollowers = ids => {
  ids.forEach(id => {
    followers.push(id);
  });
};

var getFollowers = (handles, counter, cursor) =>
  new Promise((resolve, reject) => {
    const handle = handles[counter].Handle;
    const q = getQueryObject(handle, cursor);

    console.log(`Processing ${handle}`);
    console.log({ cursor });

    if (!cursor) {
      console.log("No hay cursor");

      // Tw.get("followers/ids", q, function(err, data, response) {
      // Tw.get("followers/ids", q)
      hitTwitter(q)
        .then(({ data }) => {
          console.log(data.ids.length);

          if (data.ids) {
            console.log(`${data.ids.length} followers found`);

            data.ids.forEach(id => {
              followers.push(id);
            });
            //stop here, you will be sending this to an updateDB function
            //need to determine what this data looks like
            if (data.next_cursor_str !== "0") {
              console.log("1- cursor !== 0, ejecuta de nuevo");
              return getFollowers(handles, counter, data.next_cursor_str);
            } else {
              counter += 1;
              console.log(
                "*****            1 " +
                  counter +
                  "                  ***********"
              );
              if (handles[counter]) {
                return getFollowers(handles, counter, null);
              } else {
                console.log("done with");

                resolve("done with handle list!");

                // console.log("done with handle list!");

                // process.exit();
              }
            }
          } else {
            console.log(`No followers found`);

            counter += 1;
            console.log(
              "*****            2 " + counter + "                  ***********"
            );
            if (handles[counter]) {
              return getFollowers(handles, counter, null);
            } else {
              console.log("done with");

              resolve("done with handle list!");

              // process.exit();
            }
          }
        })
        .catch(console.log);
    } else {
      console.log("Si hay cursor");
      hitTwitter(q)
        .then(data => {
          data.ids && processFollowers(data.ids);

          if (data.next_cursor_str !== "0") {
            return getFollowers(handles, counter, data.next_cursor_str);
          } else {
            counter += 1;
            console.log(
              "*****            3 " + counter + "                  ***********"
            );
            if (handles[counter]) {
              return getFollowers(handles, counter, null);
            } else {
              console.log("done with");
              resolve("done with handle list!");

              // console.log("done with handle list!");
              // process.exit();
            }
          }
        })
        .catch(console.log);
    }
  });

readFile()
  .then(handles => getFollowers(handles, 0, null))
  .then(_ => {
    console.log("***************************");
    console.log({ followers });
    console.log("============", followers.length);
  })
  .catch(err => {
    console.log("---------------------------");
    console.log(err);

    // process.exit();
  });
