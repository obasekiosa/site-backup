# Seki

Simple and minimal Jekyll blog. 

### Features

- [x] Responsive Design
- [x] Dark/Ligh theme 🌗
- [x] Inline CSS
- [x] Anchor headings
- [x] Tags & Tag pages 
- [x] 404 page 
- [x] Robots.txt 🤖
- [x] Atom & Json feeds 📡
- [x] Sass 
- [x] About page, with Timeline! 🗣️
- [x] PageSpeed and w3Validator tests PASSED ✔️
- [x] Search bar 🔎
- [x] Next & Previous Post ⏮️ ⏭️
- [x] Automatic/Manual reading time estimation 🕐
- [x] Disqus section ✍️ 

## Backlogs

- [ ] Improve SEO score on [Lighthouse](lighthouse_test.png) 



## Screenshot

![light-theme](https://github.com/obasekiosa/seki/blob/master/light-theme.jpg)
![dark-theme](https://github.com/obasekiosa/seki/blob/master/dark-theme.jpg)

## Installation

Run local server:

```bash
$ git clone https://github.com/obasekiosa.github.io.git
$ cd obasekiosa.github.io
$ bundle config set --local path 'vendor/bundle'
$ bundle install
$ bundle exec jekyll build
$ bundle exec jekyll serve
```

Navigate to `localhost:4000`. You're Welcome, Fork and be Stargazer.
If you want to upload it to Github Pages, remember to update the `_config.yml` and if you are going to upload in a repo called yournickname.github.io, remember to update the `{{ site.baseurl }}` to `{{ site.url }}` .
Note that there is also a gtag in the [`_layouts/default.html`](https://github.com/obasekiosa/seki/blob/6776e4afc384dc3d50ce2001715929c8e70a914c/_layouts/default.html#L9), you should remove it.

To create new tag, create a folder in `tag/` with the name of the new one. In this folder add an `index.html` file and just add this header:
```
---
layout: tag
tag: yourNewTag
---
```
Then build again and you're ready!!

## License

This project is open source and available under the [MIT License](LICENSE.md).
