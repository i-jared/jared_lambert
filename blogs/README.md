# Adding Blog Posts

Write posts in Markdown. The commit hook generates the HTML pages and homepage blog list automatically.

## Add a Post

1. Create a Markdown file in `blogs/posts/`, for example `blogs/posts/my-new-post.md`
2. Add front matter at the top:

```md
---
title: Your Post Title
date: 2026-05-13
description: A brief description of your post.
slug: your-post-title
pinned: false
---
```

3. Write the rest of the post in Markdown.
4. Commit and push.

## Pre-Commit Hook

This repo has a pre-commit hook in `.githooks/pre-commit`. It runs the blog builder before every commit and automatically stages the generated blog HTML and blog index data.

Enable it once per clone:

```sh
git config core.hooksPath .githooks
```

After that, the normal flow is:

```sh
git add blogs/posts/my-post.md
git commit -m "Add blog post"
git push
```

The commit hook will add the generated `blogs/*.html` files and `blogs/blog-data.js` to the same commit.

Posts are listed newest first. The blog index paginates automatically at 10 posts per page.

To pin a post to the top of the list, set:

```md
pinned: true
```

Pinned posts appear before unpinned posts. When multiple posts are pinned, pinned posts are still sorted newest first.

## Supported Markdown

The local builder supports the simple syntax this site needs:

- Paragraphs
- `##`, `###`, and `####` headings
- Bullet lists
- Links: `[label](https://example.com)`
- Images: `![alt](media/image.jpg)`
- Bold, italic, inline code, and fenced code blocks

## Media Storage

Store images and other media in `blogs/media/` and reference them in Markdown as:

```md
![Description](media/your-image.jpg)
```
