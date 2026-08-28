export function getAvatarBadge(platform) {
  if (!platform) platform = 'html5'; // Default
  
  if (platform === 'lemon') {
    return `<div class="avatar-badge lemon" title="Lemon Cash">🍋</div>`;
  }
  
  if (platform === 'html5') {
    return `<div class="avatar-badge html5" title="Web / HTML5">🌐</div>`;
  }
  
  if (platform === 'worldchain') {
    return `<div class="avatar-badge worldchain" title="World App">🌍</div>`;
  }

  return '';
}

export function wrapWithBadge(imgHtml, platform) {
  const badgeHtml = getAvatarBadge(platform);
  return `
    <div class="avatar-container">
      ${imgHtml}
      ${badgeHtml}
    </div>
  `;
}
