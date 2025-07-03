/*
* This is the main Node.js server script for your project
*/

const path = require("path");
const client = require("./src/client.js");
const port = process.env.PORT || 3000;

const fastify = require("fastify")({
  logger: false
});
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});
fastify.register(require("fastify-formbody"));
fastify.register(require("point-of-view"), {
  engine: {
    handlebars: require("handlebars")
  }
});
fastify.get("/", async (request, reply) => {
  reply.view("./src/pages/index.hbs");
});

// 🚨🚨🚨 REMOVE BELOW IF YOU DON'T WANT TO AUTOPOST ON A SCHEDULE 🚨🚨🚨
// Run on schedule – project will need to be boosted or awake
const schedule = require('node-schedule');
let rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, 1, 2, 3, 4, 5, 6];
rule.hour = [5, 11, 17, 23];
rule.minute = 45;
let j = schedule.scheduleJob(rule, async function(){
    await client.postBsky();
    await client.postMasto();
});

// Run on demand from endpoints
fastify.get("/postBsky", async (request, reply) => {
  let result = await client.postBsky();
  reply.send(result);
});
fastify.get("/postMasto", async (request, reply) => {
  let result = await client.postMasto();
  reply.send(result);
});
fastify.get("/postAll", async (request, reply) => {
  let result = {};
  result.bsky = await client.postBsky();
  result.masto = await client.postMasto();
  reply.send(result);
});

// Run the server and report out to the logs
fastify.listen(port, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});
