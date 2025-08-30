# Beta Beer Dye League Website

A simple, responsive website for managing a beer dye league with team standings, player bios, and team registration.

## Project Structure

```
BBDLProject/
├── index.html              # Main homepage
├── css/
│   └── styles.css         # Main stylesheet
├── js/
│   ├── menu.js            # Navigation menu functionality
│   └── form-handler.js    # Form handling for team registration
├── html/
│   ├── Add-Team.html      # Team registration page
│   ├── PlayerBios.html    # Player information page
│   └── Contact.html       # Contact information page
└── images/
    └── BBDL Logo.png      # League logo
```

## Features

- **Responsive Design**: Mobile-friendly layout with hamburger navigation
- **Team Leaderboard**: Current standings display
- **Team Registration**: Form for adding new teams
- **Player Bios**: Individual player information pages
- **Contact Information**: League contact details

## Deployment

This project is configured for **GitHub Pages** deployment.

### GitHub Pages Setup

1. **Repository Structure**: Ensure your repository contains all the project files
2. **Branch**: GitHub Pages typically deploys from the `main` branch or `gh-pages` branch
3. **Settings**: Go to your repository Settings → Pages to configure:
   - Source: Deploy from a branch
   - Branch: Select `main` (or your default branch)
   - Folder: `/ (root)`
4. **Automatic Deployment**: Every time you push to the main branch, your site will automatically update

### Your Site URL

Your site will be available at: `https://[your-username].github.io/[repository-name]`

### Custom Domain (Optional)

If you have a custom domain:
1. Add a `CNAME` file in your repository root with your domain
2. Configure your domain's DNS settings
3. Enable custom domain in GitHub Pages settings

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Backend integration for dynamic team management
- Database for storing team and player information
- User authentication system
- Real-time score updates
- Photo gallery for games and events

## Local Development

To test locally:
1. Open `index.html` in your web browser
2. Or use a local server (e.g., Python: `python -m http.server 8000`)

## Notes

- The form on the Add Team page currently shows a success message but doesn't persist data
- For full functionality, you'll need a backend server or database
- All images should be optimized for web use (recommended: under 500KB each)
- Consider adding a favicon for better branding
- **GitHub Pages**: Since you're using GitHub Pages, all functionality is client-side only
- **File Paths**: All file paths are now correctly configured for GitHub Pages deployment

## Support

For questions about deployment or development, refer to your web hosting provider's documentation or web development resources.
