let trips = JSON.parse(localStorage.getItem("trips")) || [];

function saveTrips(){
  localStorage.setItem("trips", JSON.stringify(trips));
}

function uid(){
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

function byPinnedThenNewest(a, b){
  const ap = a.pinned ? 1 : 0;
  const bp = b.pinned ? 1 : 0;
  if (ap !== bp) return bp - ap;
  return (b.createdAt || 0) - (a.createdAt || 0);
}

function updateCount(n){
  const el = document.getElementById("countBadge");
  if (el) el.textContent = String(n);
}

function clearForm(){
  document.getElementById("title").value = "";
  document.getElementById("location").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("notes").value = "";

  document.getElementById("editingId").value = "";
  const btn = document.getElementById("primaryBtn");
  if (btn) btn.textContent = "Add Trip";
}

function loadTripIntoForm(trip){
  document.getElementById("title").value = trip.title || "";
  document.getElementById("location").value = trip.location || "";
  document.getElementById("startDate").value = trip.startDate || "";
  document.getElementById("endDate").value = trip.endDate || "";
  document.getElementById("notes").value = trip.notes || "";

  document.getElementById("editingId").value = trip.id;

  const btn = document.getElementById("primaryBtn");
  if (btn) btn.textContent = "Save Changes";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderTrips(listToRender = trips){
  const list = document.getElementById("tripList");
  list.innerHTML = "";

  const sorted = [...listToRender].sort(byPinnedThenNewest);
  updateCount(sorted.length);

  sorted.forEach((trip) => {
    const li = document.createElement("li");
    li.className = "tripCard";

    const notes = (trip.notes || "").trim();
    const pinLabel = trip.pinned ? "Unpin" : "Pin";
    const pinnedTag = trip.pinned ? " • Pinned" : "";

    li.innerHTML = `
      <div class="tripTop">
        <div>
          <div class="tripTitle">${escapeHtml(trip.title)}${pinnedTag}</div>
          <div class="tripMeta">${escapeHtml(trip.location)} • ${escapeHtml(trip.startDate || "")} to ${escapeHtml(trip.endDate || "")}</div>
        </div>
        <div class="btnRow">
          <span class="pin" onclick="togglePin('${trip.id}')">${pinLabel}</span>
          <span class="secondary" style="padding:8px 10px; border-radius:14px; font-weight:900; font-size:12px; cursor:pointer;" onclick="startEdit('${trip.id}')">Edit</span>
          <span class="delete" onclick="deleteTrip('${trip.id}')">Delete</span>
        </div>
      </div>
      ${notes ? `<div class="tripNotes">${escapeHtml(notes)}</div>` : ``}
    `;

    list.appendChild(li);
  });
}

function saveTrip(){
  const title = document.getElementById("title").value.trim();
  const location = document.getElementById("location").value.trim();
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const notes = document.getElementById("notes").value;

  if (!title || !location){
    alert("Please enter trip title and location");
    return;
  }

  const editingId = document.getElementById("editingId").value;

  if (editingId){
    const idx = trips.findIndex(t => t.id === editingId);
    if (idx === -1){
      alert("Trip not found for editing");
      clearForm();
      renderTrips();
      return;
    }

    trips[idx] = {
      ...trips[idx],
      title,
      location,
      startDate,
      endDate,
      notes
    };

    saveTrips();
    renderTrips();
    clearForm();
    return;
  }

  const newTrip = {
    id: uid(),
    title,
    location,
    startDate,
    endDate,
    notes,
    pinned: false,
    createdAt: Date.now()
  };

  trips.push(newTrip);
  saveTrips();
  renderTrips();
  clearForm();
}

function startEdit(id){
  const trip = trips.find(t => t.id === id);
  if (!trip){
    alert("Trip not found");
    return;
  }
  loadTripIntoForm(trip);
}

function deleteTrip(id){
  const ok = confirm("Delete this trip?");
  if (!ok) return;

  trips = trips.filter(t => t.id !== id);

  const editingId = document.getElementById("editingId").value;
  if (editingId === id) clearForm();

  saveTrips();
  renderTrips();
}

function togglePin(id){
  const idx = trips.findIndex(t => t.id === id);
  if (idx === -1) return;

  trips[idx].pinned = !trips[idx].pinned;

  saveTrips();
  searchTrips();
}

function searchTrips(){
  const searchEl = document.getElementById("search");
  const q = (searchEl ? searchEl.value : "").toLowerCase().trim();

  if (!q){
    renderTrips(trips);
    return;
  }

  const filtered = trips.filter(trip =>
    (trip.title || "").toLowerCase().includes(q) ||
    (trip.location || "").toLowerCase().includes(q) ||
    (trip.notes || "").toLowerCase().includes(q)
  );

  renderTrips(filtered);
}

renderTrips();