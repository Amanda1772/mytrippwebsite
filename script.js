let trips = JSON.parse(localStorage.getItem("trips")) || [];

function saveTrips(){
localStorage.setItem("trips", JSON.stringify(trips));
}

function renderTrips(){
const list = document.getElementById("tripList");
list.innerHTML="";

trips.forEach((trip,index)=>{

const li = document.createElement("li");

li.innerHTML =
"<b>"+trip.title+"</b> - "+trip.location+
" ("+trip.startDate+" to "+trip.endDate+")"+
"<br>"+trip.notes+
"<br><span class='delete' onclick='deleteTrip("+index+")'>Delete</span>";

list.appendChild(li);

});

}

function addTrip(){

const title=document.getElementById("title").value;
const location=document.getElementById("location").value;
const startDate=document.getElementById("startDate").value;
const endDate=document.getElementById("endDate").value;
const notes=document.getElementById("notes").value;

if(!title || !location){
alert("Please enter trip title and location");
return;
}

trips.push({
title,
location,
startDate,
endDate,
notes
});

saveTrips();
renderTrips();

document.getElementById("title").value="";
document.getElementById("location").value="";
document.getElementById("startDate").value="";
document.getElementById("endDate").value="";
document.getElementById("notes").value="";

}

function deleteTrip(index){

trips.splice(index,1);

saveTrips();
renderTrips();

}

function searchTrips(){

const search=document.getElementById("search").value.toLowerCase();

const list=document.getElementById("tripList");

list.innerHTML="";

trips.filter(trip =>
trip.title.toLowerCase().includes(search) ||
trip.location.toLowerCase().includes(search)
).forEach((trip,index)=>{

const li=document.createElement("li");

li.innerHTML=
"<b>"+trip.title+"</b> - "+trip.location+
" ("+trip.startDate+" to "+trip.endDate+")"+
"<br>"+trip.notes+
"<br><span class='delete' onclick='deleteTrip("+index+")'>Delete</span>";

list.appendChild(li);

});

}

renderTrips();
