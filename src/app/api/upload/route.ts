import { createReadStream, createWriteStream } from "fs";
import { NextResponse } from "next/server";
import { promisify } from "util";
const fs = require("fs").promises;
const { exec } = require("child_process");
const archiver = require("archiver");

export async function POST(request: any, response: any) {
  try {
    const formData = await request.formData();
    const bytes = await formData.get("file").arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile("video.mp4", buffer);

    const aspectRatio = await formData.get("aspectRatio");

    const originalname = await formData.get("name");
    const folderName = `./files/videos/${originalname}`;

    try {
      await fs.access(folderName);
      console.log("Folder already exists");
      return NextResponse.json({ error: "Folder already exists" }, { status: 500 });
    } catch (err) {
      // If directory doesn't exist, create it
      await fs.mkdir(folderName);
      await copyFileAsync("playlist.m3u8", `${folderName}/playlist.m3u8`);
      await execFFmpeg(folderName, aspectRatio);

      console.log(formData.get("type"));

      if (formData.get("type") === "download") {
        const zipFilePath = `./public/${originalname}.zip`;
        await zipFolder(folderName, zipFilePath);
      }

      return NextResponse.json(
        { data: formData.get("type") === "download" ? originalname : "success" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function copyFileAsync(source: any, destination: any) {
  try {
    await fs.copyFile(source, destination);
    console.log(`${source} was copied`);
  } catch (err) {
    console.error(err);
    throw new Error(`Error copying ${source}`);
  }
}

async function execFFmpeg(folderName, aspectRatio) {
  if (aspectRatio === "16:9") {
    const resolutions = [
      { resolution: "144p", width: 256, height: 144, bitrate: "250k" },
      { resolution: "240p", width: 426, height: 240, bitrate: "500k" },
      { resolution: "360p", width: 640, height: 360, bitrate: "800k" },
      { resolution: "480p", width: 854, height: 480, bitrate: "1400k" },
      { resolution: "720p", width: 1280, height: 720, bitrate: "2800k" },
      { resolution: "1080p", width: 1920, height: 1080, bitrate: "5000k" },
    ];

    for (const { resolution, width, height, bitrate } of resolutions) {
      const outputPath = `${folderName}/${resolution}`;
      const command = `
        ffmpeg -hide_banner -y -i video.mp4 -vf scale=w=${width}:h=${height} \
        -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 -preset medium \
        -b:v ${bitrate} -maxrate ${Math.floor(parseInt(bitrate) * 1.1)}k \
        -bufsize ${Math.floor(parseInt(bitrate) * 1.5)}k \
        -hls_time 4 -hls_playlist_type vod -b:a 128k \
        -hls_segment_filename ${outputPath}_%03d.ts ${outputPath}.m3u8
      `;

      console.log(`Executing FFmpeg Command for ${resolution}:`, command);
      await executeCommand(command.trim(), bitrate);
    }
  } else {
    const resolutions = [
      { resolution: "144p", width: 144, height: 256, bitrate: "250k" },
      { resolution: "240p", width: 240, height: 426, bitrate: "500k" },
      { resolution: "360p", width: 360, height: 640, bitrate: "800k" },
      { resolution: "480p", width: 480, height: 854, bitrate: "1400k" },
      { resolution: "720p", width: 720, height: 1280, bitrate: "2800k" },
      { resolution: "1080p", width: 1080, height: 1920, bitrate: "5000k" },
    ];

    for (const { resolution, width, height, bitrate } of resolutions) {
      const outputPath = `${folderName}/${resolution}`;
      const command = `
        ffmpeg -hide_banner -y -i video.mp4 -vf scale=w=${width}:h=${height} \
        -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 -preset medium \
        -b:v ${bitrate} -maxrate ${Math.floor(parseInt(bitrate) * 1.1)}k \
        -bufsize ${Math.floor(parseInt(bitrate) * 1.5)}k \
        -hls_time 4 -hls_playlist_type vod -b:a 128k \
        -hls_segment_filename ${outputPath}_%03d.ts ${outputPath}.m3u8
      `;

      console.log(`Executing FFmpeg Command for ${resolution}:`, command);
      await executeCommand(command.trim(), bitrate);
    }
  }
}

function getResolutionWidth(resolution: any) {
  const resolutions: { [key: string]: number } = {
    "144p": 256,
    "240p": 426,
    "360p": 640,
    "480p": 842,
    "720p": 1280,
    "1080p": 1920,
  };
  return resolutions[resolution];
}

function getResolutionHeight(resolution: any) {
  const aspectRatio = 9 / 16; // 16:9 aspect ratio
  return Math.round(getResolutionWidth(resolution) * aspectRatio);
}

function getMaxRate(bitrate: any) {
  return parseInt(bitrate) * 1.1;
}

function getBufferSize(bitrate: any) {
  return parseInt(bitrate) * 1.5;
}

function executeCommand(command: any, bitrate: any) {
  return new Promise<void>((resolve, reject) => {
    exec(command, { maxBuffer: 10024 * 10024 }, (err: any, output: any) => {
      if (err) {
        console.error("could not execute command: ", err);
        reject(new Error("Internal Server Error"));
      } else {
        console.log(`FFmpeg command executed successfully ${bitrate}`);
        resolve();
      }
    });
  });
}

async function zipFolder(sourceFolder: string, zipFilePath: string) {
  try {
    console.log("zipFilePath", zipFilePath);
    const output = createWriteStream(zipFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(sourceFolder, false); // Remove the "await" keyword here
    await archive.finalize(); // Add parentheses to invoke finalize as a function
    console.log("Folder zipped successfully");
  } catch (error) {
    console.error("Error zipping folder:", error);
    throw new Error("Error zipping folder");
  }
}
