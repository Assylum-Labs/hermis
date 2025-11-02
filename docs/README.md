# Hermis Documentation

This directory contains the complete documentation for Hermis, built with [Mintlify](https://mintlify.com).

## 📁 Structure

```
docs/
├── mint.json                 # Mintlify configuration
├── introduction.mdx          # Landing page
├── getting-started.mdx       # Getting started guide
├── installation.mdx          # Installation instructions
├── quickstart/               # Quick start guides
│   ├── react.mdx
│   └── adapter-base.mdx
├── core-concepts/            # Architecture and concepts
│   ├── architecture.mdx
│   ├── wallet-management.mdx
│   ├── transactions.mdx
│   └── authentication.mdx
├── api-reference/            # API documentation
│   ├── adapter-base/
│   └── react/
├── cookbook/                 # How-to guides
│   ├── connect-wallet.mdx
│   ├── send-transaction.mdx
│   ├── sign-message.mdx
│   └── ...
├── migration/                # Migration guides
│   ├── v1-to-v2.mdx
│   └── from-other-adapters.mdx
├── examples/                 # Example projects
│   ├── vanilla-js.mdx
│   ├── react-integration.mdx
│   └── ...
├── DEPLOYMENT.md            # Deployment instructions
└── README.md                # This file
```

## 🚀 Quick Start

### Local Development

Run the documentation locally:

```bash
# Install Mintlify CLI globally
npm install -g mintlify

# Navigate to docs directory
cd docs

# Start the dev server
mintlify dev
```

The documentation will be available at `http://localhost:3000`.

### Making Changes

1. Edit any `.mdx` file in the docs directory
2. Changes will hot-reload in your browser
3. Commit and push changes to deploy

## 📝 Writing Documentation

### MDX Format

All documentation pages use MDX (Markdown + JSX):

```mdx
---
title: 'Page Title'
description: 'Page description for SEO'
---

## Heading

Your content here...

<Card title="Example" href="/link">
  Card content
</Card>
```

### Available Components

Mintlify provides many built-in components:

- `<Card>` - Clickable cards
- `<CardGroup>` - Group of cards
- `<Accordion>` - Collapsible content
- `<AccordionGroup>` - Multiple accordions
- `<Tabs>` - Tabbed content
- `<CodeGroup>` - Multiple code snippets with tabs
- `<Steps>` - Step-by-step instructions
- `<Check>` - Checkmark list item
- `<Warning>` - Warning message
- `<Info>` - Info message
- `<Note>` - Note message
- `<ParamField>` - API parameter
- `<ResponseField>` - API response field

### Code Blocks

Use fenced code blocks with language highlighting:

````markdown
```typescript
const example = "code here";
```
````

## 🎨 Configuration

### mint.json

The `mint.json` file controls:

- Navigation structure
- Theme colors
- Social links
- SEO metadata
- Analytics
- Custom domain

Key settings:

```json
{
  "name": "Hermis",
  "colors": {
    "primary": "#9945FF",
    "light": "#14F195",
    "dark": "#9945FF"
  },
  "topbarLinks": [...],
  "navigation": [...]
}
```

## 🚢 Deployment

### Automatic Deployment

Documentation automatically deploys on push to `main` branch via Mintlify.

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions including:

- Connecting GitHub repository
- Setting up custom domain
- Configuring DNS
- Setting up analytics
- Troubleshooting

## 📊 Analytics

Configure analytics in `mint.json`:

```json
{
  "analytics": {
    "ga4": {
      "measurementId": "G-XXXXXXXXXX"
    }
  }
}
```

## 🔍 Search

Search is automatically enabled and indexes:
- All page content
- Headings
- Code blocks
- Metadata

##  Best Practices

### Writing Style

- Use clear, concise language
- Include code examples
- Add practical use cases
- Link to related pages
- Keep examples up-to-date

### Structure

- Use descriptive titles
- Add good descriptions
- Organize with headings
- Include table of contents (automatic)
- Group related content

### Code Examples

- Test all code examples
- Use TypeScript when possible
- Include error handling
- Show complete examples
- Explain complex logic

## 🤝 Contributing

To contribute to documentation:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `mintlify dev`
5. Submit a pull request

## 📚 Resources

- [Mintlify Documentation](https://mintlify.com/docs)
- [MDX Documentation](https://mdxjs.com/)
- [Mintlify Components](https://mintlify.com/docs/components)
- [Mintlify CLI](https://mintlify.com/docs/development)

## 🐛 Troubleshooting

### Local Dev Issues

**Port already in use**:
```bash
mintlify dev --port 3001
```

**Changes not reflecting**:
- Clear browser cache
- Restart dev server
- Check for MDX syntax errors

### Build Issues

**Syntax errors**:
- Validate MDX syntax
- Check code block formatting
- Verify frontmatter YAML

**Broken links**:
- Use relative links for internal pages
- Verify all hrefs point to existing files
- Check case sensitivity

## 📮 Support

For help with documentation:

- **GitHub Issues**: [Report bugs](https://github.com/Assylum-Labs/hermis/issues)
- **Discussions**: [Ask questions](https://github.com/Assylum-Labs/hermis/discussions)
- **Email**: [agateh.labs@gmail.com](mailto:agateh.labs@gmail.com)

## 📄 License

Documentation is licensed under Apache 2.0, same as the main project.

---

**Happy documenting! 📚✨**
