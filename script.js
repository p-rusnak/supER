// Data storage
let escapeRooms = [];
let selectedRoomsForTrip = new Set();

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initializeEventListeners();
    renderRooms();
});

// Event Listeners
function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    // Add room form
    document.getElementById('add-room-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addRoom();
    });

    // Generate trip plan
    document.getElementById('generate-trip').addEventListener('click', generateTripPlan);
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'planner') {
        updateSelectedRoomsList();
    }
}

// Add a new escape room
function addRoom() {
    const name = document.getElementById('room-name').value;
    const location = document.getElementById('room-location').value;
    const difficulty = parseInt(document.getElementById('room-difficulty').value);

    const room = {
        id: Date.now(),
        name,
        location,
        difficulty,
        rating: 0,
        reviews: []
    };

    escapeRooms.push(room);
    saveToLocalStorage();
    renderRooms();
    
    // Clear form
    document.getElementById('add-room-form').reset();
}

// Render all rooms
function renderRooms() {
    const container = document.getElementById('rooms-container');
    
    if (escapeRooms.length === 0) {
        container.innerHTML = '<div class="empty-state">No escape rooms yet. Add one to get started!</div>';
        return;
    }
    
    container.innerHTML = escapeRooms.map(room => createRoomCard(room)).join('');
    
    // Add event listeners to stars
    escapeRooms.forEach(room => {
        for (let i = 1; i <= 5; i++) {
            const star = document.getElementById(`star-${room.id}-${i}`);
            if (star) {
                star.addEventListener('click', () => rateRoom(room.id, i));
            }
        }
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.btn-add-to-trip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const roomId = parseInt(e.target.dataset.roomId);
            toggleRoomForTrip(roomId);
        });
    });
}

// Create room card HTML
function createRoomCard(room) {
    const difficultyClass = room.difficulty <= 3 ? 'difficulty-easy' : 
                           room.difficulty <= 6 ? 'difficulty-medium' : 'difficulty-hard';
    const difficultyLabel = room.difficulty <= 3 ? 'Easy' : 
                           room.difficulty <= 6 ? 'Medium' : 'Hard';
    
    const isSelected = selectedRoomsForTrip.has(room.id);
    const addToTripText = isSelected ? 'Remove from Trip' : 'Add to Trip';
    const btnClass = isSelected ? 'btn-secondary' : 'btn-success';
    
    return `
        <div class="room-card">
            <div class="room-header">
                <div class="room-name">${room.name}</div>
                <span class="difficulty-badge ${difficultyClass}">${difficultyLabel} (${room.difficulty}/10)</span>
            </div>
            <div class="room-location">📍 ${room.location}</div>
            <div class="room-stats">
                <div class="stat">
                    <span class="stat-label">Average Rating:</span>
                    <strong>${room.rating.toFixed(1)} ⭐</strong>
                </div>
                <div class="stat">
                    <span class="stat-label">Reviews:</span>
                    <strong>${room.reviews.length}</strong>
                </div>
            </div>
            <div class="rating-section">
                <div class="stars" id="stars-${room.id}">
                    ${createStars(room.id, 0)}
                </div>
                <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    Click stars to rate this room
                </div>
            </div>
            <div class="room-actions">
                <button class="btn ${btnClass} btn-add-to-trip" data-room-id="${room.id}">
                    ${addToTripText}
                </button>
            </div>
        </div>
    `;
}

// Create stars HTML
function createStars(roomId, currentRating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= currentRating ? 'filled' : 'empty';
        html += `<span class="star ${filled}" id="star-${roomId}-${i}">⭐</span>`;
    }
    return html;
}

// Rate a room
function rateRoom(roomId, rating) {
    const room = escapeRooms.find(r => r.id === roomId);
    if (!room) return;
    
    room.reviews.push({
        rating,
        date: new Date().toISOString()
    });
    
    // Calculate average rating
    room.rating = room.reviews.reduce((sum, r) => sum + r.rating, 0) / room.reviews.length;
    
    saveToLocalStorage();
    renderRooms();
}

// Toggle room selection for trip
function toggleRoomForTrip(roomId) {
    if (selectedRoomsForTrip.has(roomId)) {
        selectedRoomsForTrip.delete(roomId);
    } else {
        selectedRoomsForTrip.add(roomId);
    }
    renderRooms();
    updateSelectedRoomsList();
}

// Update selected rooms list in planner
function updateSelectedRoomsList() {
    const container = document.getElementById('selected-rooms-list');
    
    if (selectedRoomsForTrip.size === 0) {
        container.innerHTML = '<div class="empty-state">No rooms selected. Go to Ratings tab to select rooms.</div>';
        return;
    }
    
    const selectedRooms = escapeRooms.filter(room => selectedRoomsForTrip.has(room.id));
    container.innerHTML = selectedRooms.map(room => `
        <div class="selected-room-item">
            <div>
                <strong>${room.name}</strong>
                <div style="font-size: 0.9em; color: #666;">${room.location}</div>
            </div>
            <button class="btn btn-secondary btn-remove-trip" data-room-id="${room.id}">Remove</button>
        </div>
    `).join('');
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.btn-remove-trip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const roomId = parseInt(e.target.dataset.roomId);
            toggleRoomForTrip(roomId);
        });
    });
}

// Generate trip plan
function generateTripPlan() {
    const duration = parseInt(document.getElementById('trip-duration').value);
    const startLocation = document.getElementById('start-location').value;
    const resultContainer = document.getElementById('trip-result');
    
    if (selectedRoomsForTrip.size === 0) {
        resultContainer.innerHTML = '<div class="empty-state">Please select at least one escape room to plan a trip.</div>';
        return;
    }
    
    const selectedRooms = escapeRooms.filter(room => selectedRoomsForTrip.has(room.id));
    
    // Check if selected rooms still exist
    if (selectedRooms.length === 0) {
        resultContainer.innerHTML = '<div class="empty-state">Please select at least one escape room to plan a trip.</div>';
        return;
    }
    
    // Sort rooms by rating (highest first)
    selectedRooms.sort((a, b) => b.rating - a.rating);
    
    // Generate itinerary
    const itinerary = [];
    let currentTime = 9; // Start at 9 AM
    const avgRoomDuration = duration / selectedRooms.length;
    
    selectedRooms.forEach((room, index) => {
        const startTime = currentTime;
        const endTime = currentTime + avgRoomDuration;
        
        itinerary.push({
            room,
            startTime: formatTime(startTime),
            endTime: formatTime(endTime),
            duration: avgRoomDuration
        });
        
        currentTime = endTime;
    });
    
    // Render trip plan
    resultContainer.innerHTML = `
        <div class="trip-summary">
            <h3>🗺️ Your Trip Plan</h3>
            <p><strong>Total Duration:</strong> ${duration} hours</p>
            <p><strong>Number of Rooms:</strong> ${selectedRooms.length}</p>
            <p><strong>Average Time per Room:</strong> ${avgRoomDuration.toFixed(1)} hours</p>
            ${startLocation ? `<p><strong>Starting from:</strong> ${startLocation}</p>` : ''}
        </div>
        <h3>Itinerary</h3>
        <ul class="trip-itinerary">
            ${itinerary.map((item, index) => `
                <li class="trip-item">
                    <div class="time">⏰ ${item.startTime} - ${item.endTime}</div>
                    <div><strong>${item.room.name}</strong></div>
                    <div class="location">📍 ${item.room.location}</div>
                    <div>⭐ Rating: ${item.room.rating.toFixed(1)}/5.0</div>
                    <div>🎯 Difficulty: ${item.room.difficulty}/10</div>
                </li>
            `).join('')}
        </ul>
    `;
}

// Format time helper
function formatTime(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    let displayHour = h > 12 ? h - 12 : h;
    if (displayHour === 0) displayHour = 12; // Handle midnight
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

// Local storage functions
function saveToLocalStorage() {
    localStorage.setItem('escapeRooms', JSON.stringify(escapeRooms));
    localStorage.setItem('selectedRoomsForTrip', JSON.stringify([...selectedRoomsForTrip]));
}

function loadFromLocalStorage() {
    const storedRooms = localStorage.getItem('escapeRooms');
    const storedSelected = localStorage.getItem('selectedRoomsForTrip');
    
    if (storedRooms) {
        escapeRooms = JSON.parse(storedRooms);
    }
    
    if (storedSelected) {
        selectedRoomsForTrip = new Set(JSON.parse(storedSelected));
    }
}
