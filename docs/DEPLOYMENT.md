# Mintlify Documentation Deployment Guide

This guide will help you deploy your Hermis documentation to Mintlify with a custom domain.

## Prerequisites

- Mintlify account (sign up at [mintlify.com](https://mintlify.com))
- GitHub repository access
- Custom domain (optional, but recommended)

## Step 1: Connect GitHub Repository

1. Log in to your Mintlify dashboard at [app.mintlify.com](https://app.mintlify.com)

2. Click **"New Documentation"** or **"+ Add Docs"**

3. Connect your GitHub account if not already connected

4. Select your repository: `Assylum-Labs/hermis`

5. Set the **docs directory**: `/docs`

6. Click **"Create Documentation"**

## Step 2: Configure Automatic Deployments

Mintlify will automatically:
- Deploy on every push to the main branch
- Generate preview deployments for pull requests
- Rebuild when you update docs files

## Step 3: Set Up Custom Domain

### Option A: Using Mintlify Subdomain (Recommended for Testing)

Your docs will be available at: `https://hermis.mintlify.app`

No additional configuration needed!

### Option B: Using Custom Domain (Recommended for Production)

#### 1. Configure Domain in Mintlify

1. Go to your Mintlify dashboard
2. Navigate to **Settings** → **Domain**
3. Enter your custom domain (e.g., `docs.hermis.xyz`)
4. Click **"Save"**

Mintlify will provide you with DNS records to configure.

#### 2. Configure DNS Records

Add these records to your domain DNS settings:

**For apex domain (hermis.xyz):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For subdomain (docs.hermis.xyz):**
```
Type: CNAME
Name: docs
Value: cname.mintlify.com
```

**SSL Certificate (automatic):**
Mintlify automatically provisions SSL certificates via Let's Encrypt.

#### 3. Verify Domain

1. After adding DNS records, return to Mintlify dashboard
2. Click **"Verify Domain"**
3. DNS propagation can take 5-60 minutes

## Step 4: Update mint.json Configuration

Update the `mint.json` file with your custom domain:

```json
{
  "$schema": "https://mintlify.com/schema.json",
  "name": "Hermis",
  "url": "https://docs.hermis.xyz",
  ...
}
```

Commit and push changes:

```bash
git add docs/mint.json
git commit -m "docs: update documentation URL"
git push origin main
```

## Step 5: Test Your Documentation

### Local Development

Test your documentation locally before deploying:

```bash
# Install Mintlify CLI
npm install -g mintlify

# Navigate to docs directory
cd docs

# Start dev server
mintlify dev

# Open http://localhost:3000
```

### Verify Deployment

Once deployed, verify:

1. ✅ All pages load correctly
2. ✅ Navigation works properly
3. ✅ Search functionality works
4. ✅ Code blocks render correctly
5. ✅ Images and assets load
6. ✅ Links work (internal and external)
7. ✅ Mobile responsive design

## Step 6: Configure Analytics (Optional)

### Google Analytics

1. Get your GA4 Measurement ID
2. Update `mint.json`:

```json
{
  "analytics": {
    "ga4": {
      "measurementId": "G-XXXXXXXXXX"
    }
  }
}
```

### Other Analytics

Mintlify also supports:
- Amplitude
- Mixpanel
- Posthog
- Plausible

## Step 7: Set Up Search

Search is enabled by default with Mintlify. It indexes:
- All page content
- Headings
- Code blocks
- Custom metadata

To optimize search:

1. Use descriptive page titles
2. Add good descriptions to frontmatter
3. Use proper heading hierarchy
4. Include relevant keywords

## Troubleshooting

### Documentation Not Updating

**Issue**: Changes not reflecting on live site

**Solutions**:
1. Check GitHub push was successful
2. Verify Mintlify build logs
3. Clear browser cache
4. Wait 1-2 minutes for deployment

### Custom Domain Not Working

**Issue**: Domain not resolving

**Solutions**:
1. Verify DNS records are correct
2. Wait for DNS propagation (up to 48 hours)
3. Use [DNSChecker.org](https://dnschecker.org) to verify
4. Check domain verification in Mintlify

### Build Failures

**Issue**: Deployment failing

**Solutions**:
1. Check mint.json syntax
2. Verify all linked pages exist
3. Check for broken MDX syntax
4. Review Mintlify build logs

### Images Not Loading

**Issue**: Images showing broken links

**Solutions**:
1. Store images in `docs/images/` folder
2. Use relative paths: `/images/logo.png`
3. Ensure images are committed to git
4. Check image file names (case-sensitive)

## Maintenance

### Keeping Documentation Updated

1. **Regular Updates**:
   - Update docs with code changes
   - Keep API references current
   - Update examples and guides

2. **Version Documentation**:
   - Consider versioning for major releases
   - Maintain migration guides
   - Archive old version docs

3. **Monitor Analytics**:
   - Track most visited pages
   - Identify unclear documentation
   - Gather user feedback

### Community Contributions

Enable community contributions:

1. Add "Edit on GitHub" links (automatic with Mintlify)
2. Create contribution guidelines
3. Review PRs for documentation changes
4. Credit contributors

## Advanced Features

### Custom Components

Create custom MDX components:

```tsx components/CustomAlert.tsx
export function CustomAlert({ children, type }) {
  return (
    <div className={`alert alert-${type}`}>
      {children}
    </div>
  );
}
```

### API Playground

Add interactive API playground:

```json mint.json
{
  "api": {
    "baseUrl": "https://api.hermis.xyz",
    "playground": {
      "mode": "show"
    }
  }
}
```

### Custom Styling

Customize appearance:

```json mint.json
{
  "colors": {
    "primary": "#9945FF",
    "light": "#14F195",
    "dark": "#9945FF"
  },
  "topbarLinks": [
    {
      "name": "GitHub",
      "url": "https://github.com/Assylum-Labs/hermis"
    }
  ]
}
```

## Security

1. **Never commit secrets** in documentation
2. **Review external links** regularly
3. **Keep dependencies updated**
4. **Monitor for spam** in community features
5. **Use HTTPS only** for custom domains

## Support

### Getting Help

- **Mintlify Documentation**: [mintlify.com/docs](https://mintlify.com/docs)
- **Mintlify Discord**: [discord.gg/mintlify](https://discord.gg/mintlify)
- **GitHub Issues**: Report documentation bugs
- **Email**: Your Mintlify support email

### Resources

- [Mintlify Components](https://mintlify.com/docs/components)
- [MDX Documentation](https://mdxjs.com/)
- [Mintlify Examples](https://mintlify.com/showcase)

## Deployment Checklist

Before going live:

- [ ] All pages created and reviewed
- [ ] Navigation structure complete
- [ ] Search working properly
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Analytics configured
- [ ] Social media metadata set
- [ ] README updated with docs link
- [ ] Mobile responsiveness checked
- [ ] All links tested
- [ ] Code examples verified
- [ ] Images optimized
- [ ] SEO metadata complete

## Next Steps

1. **Launch announcement**: Share on social media
2. **User feedback**: Gather and implement feedback
3. **Regular updates**: Keep docs synchronized with code
4. **Analytics review**: Monitor usage and improve
5. **Community engagement**: Encourage contributions

---

**Need help?** Contact the Hermis team at [agateh.labs@gmail.com](mailto:agateh.labs@gmail.com)
