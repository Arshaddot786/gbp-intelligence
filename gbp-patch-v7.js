// GBP Intelligence v7 — Category Detection + Data Disclaimer Patches
// Add this as the LAST script before </body> in your index.html

(function() {
  'use strict';

  // Wait for buildPDFromPlaces to be available
  function applyPatches() {
    if (typeof buildPDFromPlaces === 'undefined') {
      setTimeout(applyPatches, 100);
      return;
    }

    // ── ENHANCED CATEGORY DETECTION ──
    const nameChecks = [
      [['air condition','hvac','heating','cooling','furnace','refrigerat','ac repair','ac service','heat pump','air & heat','air and heat','mechanical corp','mechanical inc','mechanical llc','mechanical corp'], 'HVAC'],
      [['roof','shingle','roofing'], 'Roofing'],
      [['plumb','drain','sewer','water heater'], 'Plumbing'],
      [['tree','arborist','stump'], 'Tree Service'],
      [['landscap','lawn mow','lawn care','irrigation','sod '], 'Landscaping'],
      [['electric','wiring','circuit','electrician'], 'Electrical'],
      [['paint','stain'], 'Painting'],
      [['detailing','ceramic coat','car wash','auto spa'], 'Auto Detailing'],
      [['moving','movers'], 'Moving Services'],
      [['pest','exterminator','termite','rodent'], 'Pest Control'],
      [['clean','maid','janitorial','pressure wash','power wash'], 'Cleaning Services'],
      [['fence','fencing'], 'Fencing'],
      [['window','glazing'], 'Window Services'],
      [['carpet','flooring','hardwood'], 'Flooring'],
      [['garage door','overhead door'], 'Garage Door'],
      [['pool','hot tub'], 'Pool Services'],
      [['solar','photovoltaic'], 'Solar'],
      [['insulation'], 'Insulation'],
      [['concrete','paving','asphalt','driveway'], 'Concrete & Paving'],
      [['dentist','dental','orthodont'], 'Dentist'],
      [['locksmith'], 'Locksmith'],
      [['handyman'], 'Handyman'],
      [['remodel','renovation','general contractor'], 'General Contracting'],
    ];

    function detectCat(bizName, primaryType, types) {
      const bN = (bizName||'').toLowerCase();
      const pT = (primaryType||'').toLowerCase();
      const tS = (types||[]).join(' ').toLowerCase();
      for (const [terms, label] of nameChecks) {
        if (terms.some(t => bN.includes(t))) return label;
      }
      const typeChecks = [
        [['hvac','air_condition','heating','cooling'],'HVAC'],
        [['roofing'],'Roofing'],[['plumb'],'Plumbing'],
        [['tree_service','arborist'],'Tree Service'],
        [['landscap','lawn'],'Landscaping'],[['electr'],'Electrical'],
        [['cleaning'],'Cleaning Services'],[['paint'],'Painting'],
        [['car_wash','auto_detail'],'Auto Detailing'],
        [['moving'],'Moving Services'],[['pest'],'Pest Control'],
        [['general_contractor'],'General Contracting'],
        [['dentist','dental'],'Dentist'],
      ];
      for (const [terms, label] of typeChecks) {
        if (terms.some(t => tS.includes(t)||pT.includes(t))) return label;
      }
      if (pT && pT.length > 3) return pT.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()).trim();
      return 'Local Business';
    }

    // Patch buildPDFromPlaces
    const _origBuild = buildPDFromPlaces;
    buildPDFromPlaces = function(placeRaw) {
      _origBuild(placeRaw);
      if (window.PD && PD.meta) {
        const newCat = detectCat(
          PD.meta.bizName,
          placeRaw.primaryTypeDisplayName?.text || placeRaw.primaryTypeDisplayName || '',
          placeRaw.types || []
        );
        PD.meta.cat = newCat;
        if (PD.loc?.categories?.primaryCategory) PD.loc.categories.primaryCategory.displayName = newCat;
        console.log('[GBP v7] Category detected:', newCat, 'for:', PD.meta.bizName);
      }
    };

    // Patch renderReviews — add disclaimer when 0 reviews returned
    const _origReviews = renderReviews;
    renderReviews = function(avgRating, total, reviews) {
      _origReviews(avgRating, total, reviews);
      const m = window.PD?.meta;
      if (!m) return;
      if (total === 0 && m.businessStatus === 'OPERATIONAL') {
        const el = document.getElementById('r-reviews');
        if (el) el.innerHTML = '<div style="padding:16px 20px;background:rgba(255,183,3,.08);border:1px solid rgba(255,183,3,.2);border-radius:10px;font-size:13px;color:#8A8A9A;line-height:1.7;"><strong style="color:#FFB703;">⚠ Limited API Data</strong><br>Google Places API returned no reviews for this profile via the public API. This business may have reviews not accessible through the API. <strong style="color:#F4F4F0;">Check actual review count directly on Google Maps</strong> by searching the business name. Audit scores reflect available data only.</div>';
        const statsEl = document.getElementById('r-review-stats');
        if (statsEl) statsEl.innerHTML = '<div class="review-stat-card"><div class="review-stat-num" style="color:#FFB703">?</div><div class="review-stat-label">TOTAL REVIEWS</div><div style="font-size:9px;color:#484858;margin-top:2px;">Check Google Maps</div></div><div class="review-stat-card"><div class="review-stat-num" style="color:#8A8A9A">—</div><div class="review-stat-label">5★ REVIEWS</div></div><div class="review-stat-card"><div class="review-stat-num" style="color:#8A8A9A">—</div><div class="review-stat-label">AVG RATING</div></div>';
      }
    };

    // Patch renderPhotos — add disclaimer when 1 photo but many reviews
    const _origPhotos = renderPhotos;
    renderPhotos = function(photos) {
      _origPhotos(photos);
      const m = window.PD?.meta;
      if (!m) return;
      if ((m.photoCount <= 1) && (m.totalReviews > 10 || m.businessStatus === 'OPERATIONAL')) {
        const el = document.getElementById('r-photos');
        if (el && el.children.length <= 1) {
          el.innerHTML = '<div style="grid-column:1/-1;padding:16px 20px;background:rgba(255,183,3,.08);border:1px solid rgba(255,183,3,.2);border-radius:10px;font-size:13px;color:#8A8A9A;line-height:1.7;"><strong style="color:#FFB703;">⚠ Limited Photo Data</strong><br>Google Places API returned limited photo data. Your actual photo count on Google Maps may be significantly higher. <strong style="color:#F4F4F0;">Check your actual photo count directly on Google Maps.</strong></div>';
        }
      }
    };

    // Patch renderBanner — add data warning for incomplete profiles  
    const _origBanner = renderBanner;
    renderBanner = function(m, overall) {
      _origBanner(m, overall);
      if (m.totalReviews === 0 && m.photoCount <= 1 && m.businessStatus === 'OPERATIONAL') {
        if (!document.getElementById('v7-data-warning')) {
          const header = document.querySelector('.report-header');
          if (header) {
            const w = document.createElement('div');
            w.id = 'v7-data-warning';
            w.style.cssText = 'grid-column:1/-1;width:100%;margin-top:14px;padding:12px 16px;background:rgba(255,183,3,.08);border:1px solid rgba(255,183,3,.2);border-radius:8px;font-size:12px;color:#8A8A9A;line-height:1.6;';
            w.innerHTML = '<strong style="color:#FFB703;">⚠ Limited API Data — Scores May Be Underestimated.</strong> Google Places API returned incomplete data for this business (0 reviews, minimal photos). The actual GBP score on Google may be significantly higher. Verify at <a href="https://business.google.com" target="_blank" style="color:#C8A97E;">business.google.com</a> or Google Maps directly.';
            header.style.flexWrap = 'wrap';
            header.appendChild(w);
          }
        }
      }
    };

    console.log('[GBP v7] All patches applied ✓');
  }

  // Apply after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPatches);
  } else {
    applyPatches();
  }
})();
