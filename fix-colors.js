const fs = require('fs');
const path = require('path');
const dirs = ['blog', 'changelog', 'whitepaper', 'docs', 'contact', 'legal', 'investors', 'faq'].map(d => path.join('website/src/app', d));

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.tsx')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = dirs.map(d => walk(d)).flat();

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
        // Backgrounds
        .replace(/\bbg-white\b/g, 'bg-bg-base')
        .replace(/\bbg-gray-50\b/g, 'bg-bg-surface')
        .replace(/\bbg-gray-100\b/g, 'bg-elevated')
        // Text colors
        .replace(/\btext-gray-900\b/g, 'text-text-primary')
        .replace(/\btext-gray-800\b/g, 'text-text-primary')
        .replace(/\btext-gray-700\b/g, 'text-text-secondary')
        .replace(/\btext-gray-600\b/g, 'text-text-secondary')
        .replace(/\btext-gray-500\b/g, 'text-text-muted')
        // Borders
        .replace(/\bborder-gray-100\b/g, 'border-border')
        .replace(/\bborder-gray-200\b/g, 'border-border/50')
        // Prose
        .replace(/\bprose-indigo\b/g, 'prose-indigo dark:prose-invert')

    if (content !== newContent) {
        fs.writeFileSync(file, newContent);
        console.log('Fixed:', file);
    }
});
