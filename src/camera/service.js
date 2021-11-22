const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const findRemoveSync = require('find-remove');
const logs = require('../lib/logs');
const { pool } = require('../lib/pg');

const removeVideo = (camera) => {
  const folderPath = path.join(`${__dirname}/videos/${camera}`);
  findRemoveSync(folderPath, { age: { seconds: 30 }, extensions: '.ts' });
  // logs.info(JSON.stringify(result));
  setTimeout(() => {
    removeVideo(camera);
  }, 5000);
};

const intervalRemoveVideo = async () => {
  try {
    const data = await pool.query('SELECT * FROM cctv');
    data.rows.forEach((row) => removeVideo(row.name));
  } catch (err) {
    logs.error(err.message);
  }
};

const rtspToHls = async () => {
  try {
    const data = await pool.query('SELECT * FROM cctv');
    data.rows.forEach((row) => {
      setTimeout(() => {
        const folderPath = path.join(`${__dirname}/videos/${row.name}`);
        const filePath = path.join(`${__dirname}/videos/${row.name}/index.m3u8`);
        exec(`mkdir ${folderPath}`, (errorMkdir) => {
          if (errorMkdir) {
            logs.error(`ffmpeg -i ${row.url} -fflags flush_packets -max_delay 5 -flags -global_header -hls_time 5 -hls_list_size 3 -vcodec copy -y ${filePath}`);
          }
          exec(`ffmpeg -i ${row.url} -fflags flush_packets -max_delay 5 -flags -global_header -hls_time 5 -hls_list_size 3 -vcodec copy -y ${filePath}`, (error, stdout, stderr) => {
            if (error) {
              logs.error(`exec error: ${error}`);
              return;
            }
            logs.info(`stdout: ${stdout}`);
            logs.error(`stderr: ${stderr}`);
          });
        });
      }, 5000);
    });
  } catch (err) {
    logs.error(err.message);
  }
};

const streamCamera = async (camera, index) => {
  const filePath = path.join(`${__dirname}/videos/${camera}/${index}`);
  try {
    const data = await fs.readFile(filePath);
    return data;
  } catch (err) {
    return err.message;
  }
};

module.exports = {
  streamCamera,
  rtspToHls,
  intervalRemoveVideo,
};
