// Required resources
const axios = require("axios");
const fs = require("fs");
const sizeOf = require("image-size");
const fetch = require("node-fetch");

// We'll post content from this website / API
const codesSources = ["https://www.goldengirls.codes", "https://www.keanu.codes"];
const codesBase = codesSources[Math.floor(Math.random()*codesSources.length)];
const codesClient = axios.create({ baseURL: codesBase });

// Bluesky setup
const bskyBase = "https://bsky.social/xrpc";
const bskyClient = axios.create({ baseURL: bskyBase });
let bskyToken = "";

// Mastodon setup
const mastoBase = "https://mastodon.social/api";
const mastoClient = axios.create({ baseURL: mastoBase });
let mastoToken = process.env.MASTODON_TOKEN;
const FormData = require("form-data");

// Some variables we'll set and get
let blob = {},
  mediaDetail;

// Let's have some default content
let codeDetail = {
  code: 200,
  name: "OK",
  img: "https://images.glitch.global/ec08d62f-2bba-47ca-bdf7-d3932589d44e/7803c37fd985fd8f45ba70525c720a44~3.jpg?v=1727128314748&width=500",
  alt: "Christmas day watching the snow together",
};

// Download the image file locally
const downloadFile = async (url) => {
  const res = await fetch(url);
  let path = "./test/pic.jpg";
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
};

// Get the info we want to post as the content
let getInfo = async () => {
  try {
    const code = await codesClient.request({
      url: "/?code=-1&raw=true",
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
    });
    codeDetail = code.data;
    let picURL = codeDetail.img;
    await downloadFile(
      picURL.replace("cdn.glitch.global", "images.glitch.global") + "&width=500"
    );
    return { success: true, code: code.data };
  } catch (error) {
    return { success: false, error };
  }
};

// Bluesky – auth
let getSession = async () => {
  try {
    if(!process.env.HANDLE || !process.env.APP_PASSWORD)
      return { success:false, message: "Add your Bluesky details in .env!"}
    const session = await bskyClient.request({
      url: "/com.atproto.server.createSession",
      method: "post",
      data: {
        identifier: "" + process.env.HANDLE + "",
        password: "" + process.env.APP_PASSWORD + "",
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    bskyToken = session.data.accessJwt;
    return { success: true, session: session };
  } catch (error) {
    return { success: false, error };
  }
};

// Bluesky – upload image
let getBlob = async () => {
  let picFile = "./test/pic.jpg";
  const imgData = await fs.readFileSync(picFile);
  try {
    const blobResponse = await bskyClient.request({
      url: "/com.atproto.repo.uploadBlob",
      method: "post",
      data: imgData,
      headers: {
        "Content-Type": "image/jpeg",
        Authorization: "Bearer " + bskyToken,
      },
    });
    blob = blobResponse.data.blob;

    return { success: true, blob: blobResponse.data };
  } catch (error) {
    return { success: false, error };
  }
};

// Bluesky – post 
let postPost = async () => {
  let date = new Date().toISOString();
  const dimensions = sizeOf("./test/pic.jpg");

  let txt = codeDetail.code + " " + codeDetail.name + "\n";
  let position = txt.length;
  txt += codesBase+"?code=" + codeDetail.code;
  try {
    // Post includes an image and link
    const post = await bskyClient.request({
      url: "/com.atproto.repo.createRecord",
      method: "post",
      data: {
        repo: process.env.HANDLE,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text: txt,
          createdAt: date,
          facets: [
            {
              index: {
                byteStart: position,
                byteEnd: txt.length,
              },
              features: [
                {
                  $type: "app.bsky.richtext.facet#link",
                  uri: codesBase+"?code=" + codeDetail.code,
                },
              ],
            },
          ],
          embed: {
            $type: "app.bsky.embed.images",
            images: [
              {
                alt: codeDetail.alt,
                image: blob,
                aspectRatio: {
                  width: dimensions.width,
                  height: dimensions.height,
                },
              },
            ],
          },
        },
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + bskyToken,
      },
    });
    let postLink = post.data.uri;
    console.log(postLink);
    return { success: true, post: post.data };
  } catch (error) {
    return { success: false, error };
  }
};

// Mastodon – upload image
let getMedia = async () => {
  if(!process.env.MASTODON_TOKEN)
      return { success:false, message: "Add your Mastodon token in .env!"}
  let picFile = "./test/pic.jpg";
  let form = new FormData();
  form.append("file", fs.createReadStream(picFile));
  form.append("filename", "pic.jpg");
  form.append("description", codeDetail.alt);
  try {
    const mediaResponse = await mastoClient.request({
      url: "/v2/media",
      method: "post",
      data: form,
      headers: {
        Authorization: "Bearer " + mastoToken,
        ...form.getHeaders()
      },
    });
    mediaDetail = mediaResponse.data;

    return { success: true, media: mediaResponse.data };
  } catch (error) {
    return { success: false, error };
  }
};

// Mastodon – post
let getPost = async () => {
  let txt =
    codeDetail.code +
    " " +
    codeDetail.name +
    "\n"+codesBase+"?code=" +
    codeDetail.code;
  let data = {
    media_ids: [mediaDetail.id],
    status: txt,
  };
  try {
    const postResponse = await mastoClient.request({
      url: "/v1/statuses",
      method: "post",
      data: data,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + mastoToken,
      },
    });
    let postLink = postResponse.data.url;
    console.log(postLink);
    return { success: true, blob: postResponse.data };
  } catch (error) {
    return { success: false, error };
  }
};

// Functions we can call elsewhere
module.exports = {
  postBsky: async () => {
    try {
      let info = await getInfo();
      console.log(info);
      if(!info.success) return info;
      let session = await getSession();
      console.log(session);
      if(!session.success) return session;
      let blob = await getBlob();
      console.log(blob);
      if(!blob.success) return blob;
      let post = await postPost(); 
      console.log(post);
      if(!post.success) return post;
      return { success: true }
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  },
  postMasto: async () => {
    try {
      let info = await getInfo();
      console.log(info);
      if(!info.success) return info;
      let media = await getMedia();
      console.log(media);
      if(!media.success) return media;
      let post = await getPost();
      console.log(post);
      if(!post.success) return post;
      return { success: true }
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  },
};
