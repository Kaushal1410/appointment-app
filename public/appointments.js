const container = document.getElementById('bookings-container');
const API_BASE = (window.API_BASE || '').replace(/\/$/, '');

function apiUrl(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(d) {
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString(undefined, {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch (_e) { return d; }
}

async function loadBookings() {
  try {
    const res = await fetch(apiUrl('/bookings'));
    const bookings = await res.json();

    if (!Array.isArray(bookings) || bookings.length === 0) {
      container.innerHTML = '<p class="empty">No appointments yet. <a href="book.html">Book the first one!</a></p>';
      return;
    }

    const rows = bookings.map((b) => {
      const isOnline = b.mode === 'Online';
      const badge = `<span class="badge ${isOnline ? 'badge-online' : 'badge-offline'}">${escapeHtml(b.mode || 'In-Person')}</span>`;
      const link = isOnline && b.meetingLink
        ? `<a class="meet-link" href="${escapeHtml(b.meetingLink)}" target="_blank" rel="noopener">Join video call</a>`
        : '<span class="muted">Visit hospital</span>';
      return `
      <tr>
        <td>
          <div class="patient-name">${escapeHtml(b.name)}</div>
          <div class="muted">${escapeHtml(b.gender)} &middot; ${escapeHtml(String(b.age))} yrs</div>
        </td>
        <td>
          <div>${escapeHtml(b.phone)}</div>
          <div class="muted">${escapeHtml(b.email)}</div>
        </td>
        <td>
          <div>${escapeHtml(b.department)}</div>
          <div class="muted">${escapeHtml(b.doctor)}</div>
        </td>
        <td>
          <div>${escapeHtml(formatDate(b.date))}</div>
          <div class="muted">${escapeHtml(b.time)}</div>
        </td>
        <td>${badge}<div style="margin-top:6px">${link}</div></td>
        <td>${escapeHtml(b.reason)}</td>
      </tr>`;
    }).join('');

    container.innerHTML = `
      <div class="table-wrap">
        <table class="bookings-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Contact</th>
              <th>Department / Doctor</th>
              <th>When</th>
              <th>Mode</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<p class="empty">Could not load appointments.</p>';
  }
}

loadBookings();