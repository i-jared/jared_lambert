#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const postsDir = path.join(rootDir, 'blogs', 'posts');
const outputDir = path.join(rootDir, 'blogs');
const blogDataPath = path.join(outputDir, 'blog-data.js');

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function slugify(value) {
    return String(value)
        .toLowerCase()
        .trim()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function parseFrontMatter(markdown, filePath) {
    if (!markdown.startsWith('---\n')) {
        throw new Error(`${filePath} is missing front matter`);
    }

    const closeIndex = markdown.indexOf('\n---\n', 4);
    if (closeIndex === -1) {
        throw new Error(`${filePath} has front matter without a closing ---`);
    }

    const frontMatterText = markdown.slice(4, closeIndex);
    const body = markdown.slice(closeIndex + 5).trim();
    const metadata = {};

    frontMatterText.split('\n').forEach((line) => {
        if (!line.trim()) {
            return;
        }

        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) {
            throw new Error(`${filePath} has invalid front matter line: ${line}`);
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
        metadata[key] = value;
    });

    ['title', 'date', 'description'].forEach((key) => {
        if (!metadata[key]) {
            throw new Error(`${filePath} is missing "${key}" in front matter`);
        }
    });

    metadata.slug = metadata.slug || slugify(metadata.title);
    metadata.pinned = metadata.pinned === 'true';
    metadata.file = `${metadata.slug}.html`;

    return { metadata, body };
}

function renderInline(markdown) {
    let html = escapeHtml(markdown);

    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    return html;
}

function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let paragraph = [];
    let listItems = [];
    let inCodeBlock = false;
    let codeLines = [];

    function flushParagraph() {
        if (paragraph.length > 0) {
            html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
            paragraph = [];
        }
    }

    function flushList() {
        if (listItems.length > 0) {
            html.push('<ul>');
            listItems.forEach((item) => html.push(`<li>${renderInline(item)}</li>`));
            html.push('</ul>');
            listItems = [];
        }
    }

    lines.forEach((line) => {
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
                codeLines = [];
                inCodeBlock = false;
            } else {
                flushParagraph();
                flushList();
                inCodeBlock = true;
            }
            return;
        }

        if (inCodeBlock) {
            codeLines.push(line);
            return;
        }

        if (!line.trim()) {
            flushParagraph();
            flushList();
            return;
        }

        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
            flushParagraph();
            flushList();
            const level = heading[1].length;
            html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
            return;
        }

        const listItem = line.match(/^[-*]\s+(.+)$/);
        if (listItem) {
            flushParagraph();
            listItems.push(listItem[1]);
            return;
        }

        flushList();
        paragraph.push(line.trim());
    });

    flushParagraph();
    flushList();

    if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    }

    return html.join('\n');
}

function renderPostPage(post, contentHtml) {
    return `<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="format-detection" content="telephone=no"/>
        <title>${escapeHtml(post.title)} - Jared Lambert</title>
        <link rel="stylesheet" href="../style.css">
    </head>
    <body>
        <canvas id="comets"></canvas>
        <script src="../comets.js"></script>

        <div id="globes-container"></div>
        <script type="module">
            import globes from 'https://i-jared.github.io/globes-golf/globes.js';
            globes(document.getElementById('globes-container'));
        </script>

        <div class="container">
            <a href="../index.html#blog" class="back-link">Back to Blog</a>
            <article class="blog-content">
                <div class="blog-header">
                    <h1>${escapeHtml(post.title)}</h1>
                    <div class="blog-meta">${formatDate(post.date)}</div>
                </div>

${contentHtml.split('\n').map((line) => `                ${line}`).join('\n')}
            </article>
        </div>
    </body>
</html>
`;
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function main() {
    if (!fs.existsSync(postsDir)) {
        throw new Error(`Missing posts directory: ${postsDir}`);
    }

    const markdownFiles = fs.readdirSync(postsDir)
        .filter((file) => file.endsWith('.md'))
        .sort();

    const posts = markdownFiles.map((file) => {
        const filePath = path.join(postsDir, file);
        const markdown = fs.readFileSync(filePath, 'utf8');
        const { metadata, body } = parseFrontMatter(markdown, filePath);
        const contentHtml = renderMarkdown(body);
        fs.writeFileSync(path.join(outputDir, metadata.file), renderPostPage(metadata, contentHtml));
        return metadata;
    }).sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return a.pinned ? -1 : 1;
        }

        return b.date.localeCompare(a.date);
    });

    const blogData = `window.blogPosts = ${JSON.stringify(posts, null, 4)};\n`;
    fs.writeFileSync(blogDataPath, blogData);

    console.log(`Built ${posts.length} blog post${posts.length === 1 ? '' : 's'}.`);
}

main();
