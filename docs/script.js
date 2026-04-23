// Kristin Kalnapenk — site interactions

(() => {
  const nav     = document.querySelector('[data-nav]');
  const burger  = document.querySelector('[data-burger]');
  const drawer  = document.querySelector('[data-drawer]');
  const fab     = document.querySelector('[data-fab]');
  const year    = document.querySelector('[data-year]');

  if (year) year.textContent = new Date().getFullYear();

  // scroll-state on nav + fade scroll indicator
  const heroScroll = document.querySelector('.hero-scroll');
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 40);
    if (heroScroll) heroScroll.classList.toggle('is-hidden', y > 80);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile drawer
  if (burger && drawer) {
    const toggle = (open) => {
      const next = typeof open === 'boolean'
        ? open
        : !drawer.classList.contains('is-open');
      drawer.classList.toggle('is-open', next);
      burger.classList.toggle('is-open', next);
      drawer.setAttribute('aria-hidden', String(!next));
      document.body.style.overflow = next ? 'hidden' : '';
    };
    burger.addEventListener('click', () => toggle());
    drawer.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => toggle(false))
    );
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') toggle(false);
    });
  }

  // reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  // subtle parallax on hero portraits
  const left  = document.querySelector('.hero-fig--left');
  const right = document.querySelector('.hero-fig--right');
  if (left && right && window.matchMedia('(min-width: 961px)').matches) {
    let ticking = false;
    const onMove = (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth  - 0.5);
        const y = (e.clientY / window.innerHeight - 0.5);
        left.style.transform  = `translate(${x * -10}px, ${-22 + y * -8}px)`;
        right.style.transform = `translate(${x *  10}px, ${ 22 + y *  8}px)`;
        ticking = false;
      });
    };
    window.addEventListener('mousemove', onMove);
  }

  // FAB — smooth scroll to music section
  if (fab) {
    fab.addEventListener('click', () => {
      const music = document.getElementById('music');
      if (music) music.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Lightbox for portraits gallery
  const lightbox      = document.querySelector('[data-lightbox]');
  const lightboxImg   = document.querySelector('[data-lightbox-img]');
  const lightboxCount = document.querySelector('[data-lightbox-counter]');
  const lightboxClose = document.querySelector('[data-lightbox-close]');
  const lightboxPrev  = document.querySelector('[data-lightbox-prev]');
  const lightboxNext  = document.querySelector('[data-lightbox-next]');
  const portraitImgs  = Array.from(document.querySelectorAll('.portrait-card img'));

  if (lightbox && lightboxImg && portraitImgs.length) {
    let currentIndex = 0;

    const render = () => {
      const img = portraitImgs[currentIndex];
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
      if (lightboxCount) {
        lightboxCount.textContent = `${currentIndex + 1} / ${portraitImgs.length}`;
      }
    };

    const open = (index) => {
      currentIndex = index;
      render();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    const step = (delta) => {
      currentIndex = (currentIndex + delta + portraitImgs.length) % portraitImgs.length;
      render();
    };

    portraitImgs.forEach((img, i) => {
      const card = img.closest('.portrait-card');
      if (!card) return;
      card.addEventListener('click', () => open(i));
    });

    lightboxClose && lightboxClose.addEventListener('click', close);
    lightboxPrev  && lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
    lightboxNext  && lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); step( 1); });

    // click backdrop (but not the figure or controls) to close
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape')     close();
      if (e.key === 'ArrowLeft')  step(-1);
      if (e.key === 'ArrowRight') step( 1);
    });
  }

  // ---------- Mailto copy-to-clipboard ----------
  // Default behavior for mailto: on many Windows systems without a configured
  // mail client pops an OS-level "choose app" dialog listing browsers, which
  // almost never does what the user wanted. Clicking copies the email to the
  // clipboard with a toast instead. Right-click / middle-click still follows
  // the mailto: link for anyone who genuinely wants it.
  const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
  if (mailtoLinks.length && navigator.clipboard && window.isSecureContext) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    let toastTimeout;
    const showToast = (msg) => {
      toast.textContent = msg;
      toast.classList.add('is-visible');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 2400);
    };

    mailtoLinks.forEach(link => {
      link.addEventListener('click', async (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        const email = link.href.replace(/^mailto:/, '').split('?')[0];
        try {
          await navigator.clipboard.writeText(email);
          e.preventDefault();
          showToast(`${email} copied`);
        } catch {
          // clipboard blocked — let mailto: trigger normally
        }
      });
    });
  }

  // ---------- Shows renderer ----------
  const liveCard      = document.querySelector('.live-card');
  const upcomingBlock = document.querySelector('[data-upcoming]');
  const upcomingList  = document.querySelector('[data-upcoming-list]');
  const upcomingMore  = document.querySelector('[data-upcoming-more]');
  const upcomingCount = document.querySelector('[data-upcoming-count]');
  const archiveHost   = document.querySelector('.live-archive');

  const UPCOMING_VISIBLE = 6;
  const PAST_VISIBLE     = 3;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const formatDay = (iso) => {
    // "2026-04-24" -> "24.04"
    const [, mm, dd] = iso.split('-');
    return `${dd}.${mm}`;
  };
  const formatYear = (iso) => iso.split('-')[0];

  const buildVenueCity = (show) => {
    const parts = [];
    if (show.venue) parts.push(esc(show.venue));
    if (show.city)  parts.push(esc(show.city));
    if (show.time)  parts.push(esc(show.time));
    return parts.join(' &middot; ');
  };

  const renderFeatured = (show) => {
    if (!liveCard) return;
    const timeLine = show.endTime
      ? `${esc(show.time)} &mdash; ${esc(show.endTime)}`
      : esc(show.time || '');
    const subtitle = show.subtitle
      ? `<p class="live-show-sub">${esc(show.subtitle).replace(/&amp;/g, '&amp;')}</p>`
      : (show.venue || show.city
          ? `<p class="live-show-sub">${[show.venue, show.city].filter(Boolean).map(esc).join(' &middot; ')}</p>`
          : '');
    const cta = show.cta && show.cta.url
      ? `<a class="ghost-btn" href="${esc(show.cta.url)}" target="_blank" rel="noopener">${esc(show.cta.label || 'Tickets')} &rarr;</a>`
      : '';
    liveCard.innerHTML = `
      <p class="section-eyebrow">live &mdash; next</p>
      <div class="live-show-date">
        <span class="live-show-day">${formatDay(show.date)}</span>
        ${timeLine ? `<span class="live-show-time">${timeLine}</span>` : ''}
      </div>
      <h3 class="live-show-title">${esc(show.title)}</h3>
      ${subtitle}
      ${cta}
      <p class="live-booking">
        Booking, press &amp; collaborations &mdash;
        <a href="mailto:booking@kristinkalnapenk.com">booking@kristinkalnapenk.com</a>
      </p>
    `;
  };

  const renderEmpty = () => {
    if (!liveCard) return;
    liveCard.innerHTML = `
      <p class="section-eyebrow">live</p>
      <h3 class="live-title">Tour</h3>
      <p class="live-empty">No upcoming shows announced.</p>
      <a class="ghost-btn" href="#follow">join the list</a>
      <p class="live-booking">
        Booking, press &amp; collaborations &mdash;
        <a href="mailto:booking@kristinkalnapenk.com">booking@kristinkalnapenk.com</a>
      </p>
    `;
  };

  const renderUpcomingList = (shows) => {
    if (!upcomingBlock || !upcomingList) return;
    if (!shows.length) {
      upcomingBlock.hidden = true;
      return;
    }
    upcomingBlock.hidden = false;
    upcomingList.innerHTML = shows.map((show, i) => {
      const hidden = i >= UPCOMING_VISIBLE ? ' hidden' : '';
      const cta = show.cta && show.cta.url
        ? `<a class="upcoming-cta" href="${esc(show.cta.url)}" target="_blank" rel="noopener">${esc(show.cta.label || 'Tickets')} &rarr;</a>`
        : `<span class="upcoming-tag">${esc(show.status === 'soldout' ? 'Sold out' : 'Free')}</span>`;
      return `
        <li class="upcoming-row"${hidden}>
          <div class="upcoming-date">
            <span class="upcoming-day">${formatDay(show.date)}</span>
            <span class="upcoming-year">${formatYear(show.date)}</span>
          </div>
          <div class="upcoming-meta">
            <p class="upcoming-title">${esc(show.title)}</p>
            <p class="upcoming-city">${buildVenueCity(show)}</p>
          </div>
          ${cta}
        </li>`;
    }).join('');

    const extras = Math.max(0, shows.length - UPCOMING_VISIBLE);
    if (upcomingMore) {
      if (extras > 0) {
        upcomingMore.hidden = false;
        if (upcomingCount) upcomingCount.textContent = `(${extras})`;
        upcomingMore.addEventListener('click', () => {
          upcomingList.querySelectorAll('.upcoming-row[hidden]').forEach(r => r.hidden = false);
          upcomingMore.hidden = true;
        }, { once: true });
      } else {
        upcomingMore.hidden = true;
      }
    }
  };

  const renderArchive = (shows) => {
    if (!archiveHost) return;
    if (!shows.length) { archiveHost.hidden = true; return; }
    archiveHost.hidden = false;
    archiveHost.innerHTML = `
      <p class="section-eyebrow">recently</p>
      ${shows.map(show => `
        <div class="archive-row">
          <div class="archive-date">
            <span class="archive-day">${formatDay(show.date)}</span>
            <span class="archive-year">${formatYear(show.date)}</span>
          </div>
          <div class="archive-meta">
            <p class="archive-title">${esc(show.title)}${show.venue ? ` &mdash; ${esc(show.venue)}` : ''}</p>
            <p class="archive-city">${esc([show.city, 'Estonia'].filter(Boolean).join(', '))}${show.time ? ` &middot; ${esc(show.time)}` : ''}</p>
          </div>
          <span class="archive-tag">past</span>
        </div>
      `).join('')}
    `;
  };

  const todayISO = new Date().toISOString().slice(0, 10);

  fetch('shows.json')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(all => {
      const upcoming = all
        .filter(s => s.status !== 'past' && s.date >= todayISO)
        .sort((a, b) => a.date.localeCompare(b.date));
      const past = all
        .filter(s => s.status === 'past' || s.date < todayISO)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, PAST_VISIBLE);

      if (!upcoming.length) {
        renderEmpty();
        renderUpcomingList([]);
      } else {
        const featuredIdx = Math.max(0, upcoming.findIndex(s => s.featured));
        const featured = upcoming[featuredIdx] || upcoming[0];
        renderFeatured(featured);
        const rest = upcoming.filter((_, i) => i !== upcoming.indexOf(featured));
        renderUpcomingList(rest);
      }
      renderArchive(past);
    })
    .catch(() => {
      // fetch failed — leave hard-coded HTML in place as fallback
    });
})();
