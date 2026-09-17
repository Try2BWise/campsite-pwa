document.getElementById('checkBtn').addEventListener('click', checkAvailability);

async function checkAvailability() {
  const campgroundId = document.getElementById('campground').value;
  const rawSites = document.getElementById('targetSites').value;
  const targetSites = rawSites.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  const resultsDiv = document.getElementById('results');
  
  resultsDiv.innerHTML = "Checking availability...";

  // Calculate current month date string: YYYY-MM-01T00:00:00.000Z
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const startDate = `${year}-${month}-01T00:00:00.000Z`;

  const url = `https://www.recreation.gov/api/camps/availability/campground/${campgroundId}/month?start_date=${startDate}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const campsites = data.campsites || {};
    let openSpots = [];

    for (const [siteId, siteInfo] of Object.entries(campsites)) {
      const siteName = siteInfo.site || "";
      const siteUpper = siteName.toUpperCase();

      // Site filtering logic
      if (targetSites.length > 0) {
        const matches = targetSites.some(target => 
          siteUpper === target || 
          siteUpper === `C${target}` || 
          siteUpper.endsWith(target)
        );
        if (!matches) continue;
      }

      const availabilities = siteInfo.availabilities || {};
      for (const [dateStr, status] of Object.entries(availabilities)) {
        if (status === "Available") {
          const cleanDate = dateStr.split("T")[0];
          openSpots.push(`Site ${siteName} -> ${cleanDate}`);
        }
      }
    }

    if (openSpots.length > 0) {
      resultsDiv.innerHTML = `<h3>Available Spots (${openSpots.length}):</h3>` + 
        openSpots.map(spot => `<div class="card">${spot}</div>`).join('');
    } else {
      resultsDiv.innerHTML = "<p>No target sites currently available for this month.</p>";
    }

  } catch (error) {
    resultsDiv.innerHTML = `<p style="color:red;">Error fetching data: ${error.message}</p>`;
  }
}
