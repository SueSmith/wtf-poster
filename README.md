# WTF Poster!

![This project in Glitch](https://github.com/user-attachments/assets/a9d47486-95fa-4e8f-8c3d-016ebd463069)

🎏 **[Check out the tutorial](https://dev.to/glitch/autopost-to-bluesky-and-mastodon-by-api-500d)**

This project is an autoposter for Mastodon and Bluesky.

* It posts some text, a link, and a picture

The content we post is a random page from <a href="https://www.goldengirls.codes" target="_blank">HTTP Golden Girls</a> – a daft app for learning about status codes, but you can change it to post anything you like.

Make your own autoposter! Add your details in `.env`

* Your Bluesky handle and app password
* Your Mastodon app token

Check out `src/client.js` for the code connecting to Bluesky and Mastodon via API. We call the methods in the `server.js` endpoints:

* `postBsky` and `postMasto`
* A shortcut `postAll`

Posts run on a schedule but your project will need to be boosted for that to run reliably, you can alternatively run them manually by calling the endpoints.

## You built this with Glitch!

[Glitch](https://glitch.com) is a friendly community where millions of people come together to build web apps and websites.

- Need more help? [Check out our Help Center](https://help.glitch.com/) for answers to any common questions.
- Ready to make it official? [Become a paid Glitch member](https://glitch.com/pricing) to boost your app with private sharing, more storage and memory, domains and more.
