
<div align="center">

  <img src="docs/images/logo2.png" height="100">
</div>


<p align="center">
  <i>A delightful Firefly III companion web app for effortless transaction tracking</i>
</p>

<p align="center">
<a href="https://cioraneanu.github.io/firefly-pico-docs">Documentation</a>
·
<a href="https://cioraneanu.github.io/firefly-pico-docs/installation/docker">Installation</a>
</p>

<p align="center">
  <a href="https://hub.docker.com/r/cioraneanu/firefly-pico/tags">
    <img alt="Docker Image Version" src="https://img.shields.io/docker/v/cioraneanu/firefly-pico?sort=semver&arch=amd64&logo=docker&logoSize=auto" >
  </a>
  
  <a href="https://hub.docker.com/r/cioraneanu/firefly-pico/tags">
    <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/cioraneanu/firefly-pico?logo=docker&logoSize=auto">
  </a>
</p>


<h1></h1>

<div align="center">
<img src="docs/images/presentation.png">
</div>




## 💡About 
**Firefly-Pico** is a mobile-optimized, highly responsive web application designed as a **[Firefly III](https://github.com/firefly-iii/firefly-iii)** companion app. 

It is built with a focus on speed and ease of use,
allowing you to quickly log expenses, organize tags, and keep track of your finances
on the go, all while maintaining completely private control over your own data.

Apart from the sleek interface, it augments **Firefly III** with custom entity icons,
support for sub-tags, and "templates" for auto-filling the transaction form.  

Last but not least, it also comes with a smart "assistant" which makes recording expenses a breeze 🎉:

<div style="text-align:center">
  <img src="docs/images/assistant.gif" width="250">
</div>


<div style="text-align:center">

Check out the **[full documentation](https://cioraneanu.github.io/firefly-pico-docs)**.
</div>

## 🚀 Features
- ✅ Beautiful clean minimalistic UI :fire: subtle animations and dark-theme support :first_quarter_moon_with_face: 
- ✅ Optimized for mobile, with PWA support for a native feel :iphone:
- ✅ The Assistant makes recording an expense feel like magic :sparkles:
- ✅ Expand Firefly data with icons for all resources :art:
- ✅ Expand Firefly "tags" with the option of subtags for better granularity
- ✅ Add "templates" to make auto-completing fields a breeze :loudspeaker:
- ✅ Beautiful dashboard making it easy to keep an eye on everything that matters :chart_with_upwards_trend:
- ✅ Lots of tweaks and settings :wrench:
- ✅ Free and open-source


## :art: Custom icons
Admins can add their own icons by mounting a folder into the container (see the commented `volumes` example in the `docker-compose*.yml` files):

```yaml
volumes:
  - /<your_path>/firefly-pico-icons:/var/www/html/storage/app/custom-icons:ro
```

- Supported formats: `.svg`, `.png`, `.webp`, `.jpg`/`.jpeg`. Only files directly in the folder are used (no subfolders).
- The icons appear in a **Custom** tab of the icon picker. New files are picked up when the picker is opened or on the next sync.
- The file name (without extension) is the name used for search, so name files descriptively (e.g. `coffee.svg`).
- Custom icons are shown as-is: they are not recolored in dark mode, so prefer icons that look good on both light and dark backgrounds.
- Outside Docker, the folder can be changed with the `CUSTOM_ICONS_PATH` env variable.


## :coffee: Support
If you enjoy Firefly-Pico please give this repository a star ⭐️.
