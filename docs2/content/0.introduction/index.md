---
title: Introduction
description: Start here to understand what Pico adds and how to adapt it.
---

Firefly Pico is a mobile-first interface for Firefly III. It makes everyday transaction entry faster through defaults, templates, and an assistant, while Firefly III continues to hold the financial records.

This guide is for developers who want to change Pico: adjust a screen, add a field, or reuse its patterns for another feature. You should be comfortable reading Vue and basic PHP, but you do not need to know this codebase already.

## What you are working with

Pico has a browser app in `front/` and a Laravel API in `back/`. The browser talks to Pico's API, which talks to Firefly III and stores Pico's additional information in a separate database. An icon on a category is a useful example: Firefly III owns the category, and Pico adds the icon.

The frontend uses Nuxt, Vue, Pinia, and Vant. It runs as a single-page application with server-side rendering disabled. The backend uses Laravel. Check the package manifests when choosing runtime versions; this checkout uses Nuxt 4 and Laravel 12.

## A reading path

Start with [Concepts at a glance](/introduction/concepts). Then choose [Docker](/installation/docker) to explore the app or [From source](/installation/manual) to edit it locally.

The Features chapter explains the ideas people interact with. The Guide then follows those ideas into the code: [App usage](/guide/usage), [Data and ownership](/guide/data), [Screens and forms](/guide/screens), [State and profiles](/guide/state), and [Your first adaptation](/guide/adapting).

Each page explains one layer and points to a small set of source files. Use those files for exact behavior and implementation details once the overall flow makes sense.
