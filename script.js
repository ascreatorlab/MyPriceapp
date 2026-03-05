// 1. Local Data
const marketData = [
    { name: "Potato (Aloo)", price: 20, unit: "kg", category: "Vegetables", trend: "▼ ₹2", type: "down" },
    { name: "Tomato (Tamatar)", price: 35, unit: "kg", category: "Vegetables", trend: "▲ ₹5", type: "up" },
    { name: "Gold (24K)", price: 72400, unit: "10g", category: "Gold/Silver", trend: "▲ 0.1%", type: "up" },
    { name: "Rice (Chawal)", price: 45, unit: "kg", category: "Grains", trend: "● Stable", type: "down" },
    { name: "Onion (Pyaz)", price: 40, unit: "kg", category: "Vegetables", trend: "▼ ₹3", type: "down" }
];

// 2. Render Cards
function renderItems(data) {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = "";
    if (data.length === 0) {
        grid.innerHTML = `<div style="text-align:center; padding:40px; color:#b2bec3;">Item nahi mila! 🔍</div>`;
        return;
    }
    data.forEach(item => {
        grid.innerHTML += `
            <div class="card" onclick="alert('${item.name} details coming soon!')">
                <div class="item-info">
                    <span class="title">${item.name}</span>
                    <small style="color: #b2bec3;">${item.category}</small>
                </div>
                <div class="price-section">
                    <span class="price-val">₹${item.price.toLocaleString()}</span>
                    <small style="color:gray">/${item.unit}</small>
                    <div class="trend-${item.type}">${item.trend}</div>
                </div>
            </div>
        `;
    });
}

// 3. Main Logic
document.addEventListener("DOMContentLoaded", () => {
    
    renderItems(marketData);

    // Leaflet Map Setup (Bettiah coordinates)
    const map = L.map('mapContainer').setView([26.7914, 84.5042], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([26.7914, 84.5042]).addTo(map).bindPopup('Bettiah Main Mandi').openPopup();

    // Search Logic
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = marketData.filter(item => item.name.toLowerCase().includes(term));
        renderItems(filtered);
    });

    // Category Filter
    document.getElementById('categoryBar').onclick = (e) => {
        if(e.target.classList.contains('chip')) {
            document.querySelector('.chip.active').classList.remove('active');
            e.target.classList.add('active');
            const cat = e.target.innerText;
            const filtered = cat === "All Items" ? marketData : marketData.filter(i => i.category === cat);
            renderItems(filtered);
        }
    };

    // Auto-Location
    document.getElementById('update-loc').onclick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                map.setView([latitude, longitude], 14);
                L.marker([latitude, longitude]).addTo(map).bindPopup('Aapki Location').openPopup();
                document.getElementById('loc-text').innerText = "Current Location Detected";
            });
        }
    };

    // AI Button
    document.getElementById('aiTrigger').onclick = () => alert("AI: Sabji ke daam kal kam hone ki sambhavna hai! 🤖");
});
