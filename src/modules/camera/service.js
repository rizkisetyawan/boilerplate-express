const findRemoveSync = require('find-remove');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const logs = require('../../lib/logs');
const { pool } = require('../../lib/pg');

const removeVideo = (camera) => {
  const folderPath = path.join(`${__dirname}/videos/${camera}`);
  findRemoveSync(folderPath, { age: { seconds: 30 }, extensions: '.ts' });
  // logs.info(JSON.stringify(result));
  setTimeout(() => {
    removeVideo(camera);
  }, 5000);
};

const insertDummy = async () => {
  try {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 55; i++) {
      // eslint-disable-next-line no-await-in-loop
      await pool.query(`INSERT INTO cctv
      (id,group_id,name,url,url_local,latitude,longitude,description,status_id,datecreated,createdby,dateupdated,updatedby)
      VALUES
      (${i},11,'Software${i}','rtsp://admin:admin@172.16.2.213:5002/v2','rtsp://admin:admin@172.16.2.213:5002/v2','-6.182923326297751','106.93804429954233','Software${i}',1,'2021-11-02 21:52:25.936989','','2021-11-22','2021-11-22')
      `);
    }
  } catch (err) {
    console.log(err.message);
  }
};

const intervalRemoveVideo = async () => {
  try {
    const data = await pool.query('SELECT * FROM cctv');
    data.rows.forEach((row) => removeVideo(row.name));
  } catch (err) {
    console.log(err.message);
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
    console.log(err.message);
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
  insertDummy,
};
