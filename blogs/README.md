# Adding Blog Posts

To add a new blog post:

1. **Create the HTML file** in the `blogs/` folder (e.g., `my-new-post.html`)
2. **Add media** to `blogs/media/` folder if needed
3. **Update the blog list** in `index.html` by adding to the `blogPosts` array

## Blog Post Template

Copy `blogs/first-post.html` as a starting template. Key things to update:

- Title tag and H1 heading
- Date in the blog-meta div
- Content in the article section
- Link to media files should use `media/filename.ext`

## Example Blog Post Entry

In `index.html`, find the `blogPosts` array and add:

```javascript
{
    title: "Your Post Title",
    date: "2025-01-20",
    description: "A brief description of your post.",
    file: "your-post-file.html"
}
```

## Media Storage

Store images and other media in `blogs/media/` and reference them in your HTML as:
```html
<img src="media/your-image.jpg" alt="Description">
```
