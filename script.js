let trips = JSON.parse(localStorage.getItem("trips")) || [];

function saveTrips(){
  localStorage.setItem("trips", JSON.stringify(trips));
}

function clearForm(){
  document.getElementById("title").value="";
  document.getElementById("location").value="";
  document.getElementById("startDate").value="";
  document.getElementById("endDate").value="";
  document.getElementById("notes").value="";
}

function renderTrips(listToRender = trips){
  const list = document.getElementById("tripList");
  list.innerHTML="";

  listToRender.forEach((trip,index)=>{
    const li = document.createElement("li");
    li.className = "tripCard";

    const safeNotes = (trip.notes || "").trim();

    li.innerHTML = `
      <div class="tripTop">
        <div>
          <div class="tripTitle">${trip.title}</div>
          <div class="tripMeta">${trip.location} • ${trip.startDate || ""} to ${trip.endDate || ""}</div>
        </div>
        <span class="delete" onclick="deleteTrip(${index})">Delete</span>
      </div>
      ${safeNotes ? `<div class="tripNotes">${safeNotes}</div>` : ""}
    `;

    list.appendChild(li);
  });
}

function addTrip(){
  const title = document.getElementById("title").value.trim();
  const location = document.getElementById("location").value.trim();
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const notes = document.getElementById("notes").value;

  if(!title || !location){
    alert("Please enter trip title and location");
    return;
  }

  trips.unshift({ title, location, startDate, endDate, notes });
  saveTrips();
  renderTrips();
  clearForm();
}

function deleteTrip(index){
  trips.splice(index,1);
  saveTrips();
  renderTrips();
}

function searchTrips(){
  const search = document.getElementById("search").value.toLowerCase().trim();

  if(!search){
    renderTrips();
    return;
  }

  const filtered = trips.filter(trip =>
    (trip.title || "").toLowerCase().includes(search) ||
    (trip.location || "").toLowerCase().includes(search) ||
    (trip.notes || "").toLowerCase().includes(search)
  );

  renderTrips(filtered);
}

renderTrips();