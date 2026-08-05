import { getUser, onAuthChange } from './auth.js';

let pendingScores = {};
try {
  const stored = localStorage.getItem('blockdrop_pending_scores');
  if (stored) pendingScores = JSON.parse(stored);
} catch (e) {
  console.error('Error reading pending scores:', e);
}

let subscribers = [];
// pendingScorePacket now holds an object keyed by gameId, e.g. { 'blockdrop': packet, 'snake': packet }
let pendingScorePacket = {}; 

function updateActiveScore() {
  const user = getUser();
  if (user && user.id && pendingScores[user.id]) {
    pendingScorePacket = pendingScores[user.id];
  } else {
    pendingScorePacket = {};
  }
  notifySubscribers();
}

onAuthChange(() => {
  updateActiveScore();
});
setTimeout(updateActiveScore, 0); // initial load

export function setPendingScore(packet, gameId = 'blockdrop') {
  const user = getUser();
  if (!user || !user.id) return;
  
  packet.userId = user.id;
  packet.gameId = gameId;
  packet.timestamp = packet.timestamp || Date.now();
  
  if (!pendingScores[user.id]) {
    pendingScores[user.id] = {};
  }
  
  pendingScores[user.id][gameId] = packet;
  localStorage.setItem('blockdrop_pending_scores', JSON.stringify(pendingScores));
  updateActiveScore();
}

// Returns the pending score for a specific game, or all of them if gameId is not provided
export function getPendingScore(gameId = null) {
  if (gameId) {
    return pendingScorePacket[gameId] || null;
  }
  return pendingScorePacket;
}

export function clearPendingScore(gameId = 'blockdrop') {
  const user = getUser();
  if (user && user.id && pendingScores[user.id]) {
    // Legacy fix: if it's an array, convert it to object first
    if (Array.isArray(pendingScores[user.id])) {
      pendingScores[user.id] = {};
    }
    
    delete pendingScores[user.id][gameId];
    
    // If the object is empty (ignoring legacy garbage), remove the user entirely
    if (Object.keys(pendingScores[user.id]).length === 0) {
      delete pendingScores[user.id];
    }
    localStorage.setItem('blockdrop_pending_scores', JSON.stringify(pendingScores));
  }
  updateActiveScore();
}

export function subscribeToScoreChanges(callback) {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(cb => cb !== callback);
  };
}

function notifySubscribers() {
  subscribers.forEach(cb => cb(pendingScorePacket));
}

