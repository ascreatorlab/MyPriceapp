/* ===== 🔐 ZENVI - FIREBASE CONFIG ===== */
/* 
  ℹ️ Firebase apiKey is intentionally public — this is by design (Google).
  Security comes from:
  1. Authorized Domains (Firebase Console)
  2. Firebase Security Rules
  3. API Key HTTP Restrictions (Google Cloud Console)
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ Firebase Config (safe to be public — secured by Rules + Domain restrictions)
const firebaseConfig = {
  apiKey: "AIzaSyA-WhbKSkuAx9S9sDcOZ-zWW84Pew29Z5E",
  authDomain: "knowmarket-bfdf7.firebaseapp.com",
  projectId: "knowmarket-bfdf7",
  storageBucket: "knowmarket-bfdf7.firebasestorage.app",
  messagingSenderId: "68118658961",
  appId: "1:68118658961:web:ea785bdaf3b0caa84da430"
};

// ✅ Initialize Firebase
let app, auth, db, provider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
  provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  console.log("🔐 Firebase initialized ✅");
} catch (error) {
  console.error("❌ Firebase init error:", error.message);
}

window.firebaseReady = (app !== undefined);
window.zenviAuth = { auth, provider };
window.zenviDB = db;

// ===== SAFE DOM HELPER =====
function safeDOMUpdate(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

// ===== SAVE USER TO FIRESTORE =====
async function saveUserToFirestore(user) {
  if (!db || !user) return;
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    // Only create if new user
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "User",
        email: user.email,
        photo: user.photoURL || "",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        location: null,
        favourites: [],
        alerts: []
      });
      console.log("✅ New user saved to Firestore");
    } else {
      // Update last login
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    }
  } catch (e) {
    console.warn("Firestore save failed:", e.message);
  }
}

// ===== LOAD USER DATA FROM FIRESTORE =====
async function loadUserData(user) {
  if (!db || !user) return;
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      // Restore saved location from Firestore (cross-device sync!)
      if (data.location && data.location.name) {
        window.currentLocation = data.location;
        localStorage.setItem("zenvi_location", JSON.stringify(data.location));
        localStorage.setItem("zenvi_location_name", data.location.name);
        const homeAddr = document.getElementById("homeAddress");
        if (homeAddr) homeAddr.innerText = data.location.name;
        console.log("📍 Location synced from cloud:", data.location.name);
      }
      console.log("✅ User data loaded from Firestore");
    }
  } catch (e) {
    console.warn("Firestore load failed:", e.message);
  }
}

// ===== UPDATE PROFILE UI =====
function updateProfileUI(user) {
  safeDOMUpdate(() => {
    const nameEl    = document.getElementById("profileDisplayName");
    const emailTop  = document.getElementById("profileEmailTop");
    const avatarIcon = document.getElementById("profileAvatarIcon");
    const avatarImg = document.getElementById("profileAvatarImg");
    const onlineDot = document.getElementById("profileOnlineDot");
    const loginCard = document.getElementById("loginCard");
    const profileDetails = document.getElementById("profileDetails");
    const userEmail = document.getElementById("userEmail");
    const joinDate  = document.getElementById("joinDate");

    if (nameEl)    nameEl.textContent = user.displayName || "User";
    if (emailTop)  emailTop.textContent = user.email;
    if (onlineDot) onlineDot.style.display = "block";

    // Google profile photo
    if (user.photoURL && avatarImg && avatarIcon) {
      avatarImg.src = user.photoURL;
      avatarImg.style.display = "block";
      avatarIcon.style.display = "none";
    }

    if (loginCard)      loginCard.style.display = "none";
    if (profileDetails) profileDetails.classList.remove("hidden");
    if (userEmail)      userEmail.textContent = user.email;

    if (joinDate) {
      const d = user.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('hi-IN', { year:'numeric', month:'long' })
        : "Recently joined";
      joinDate.textContent = `Joined: ${d}`;
    }
  });
}

// ===== RESET PROFILE UI =====
function resetProfileUI() {
  safeDOMUpdate(() => {
    const els = {
      name:    document.getElementById("profileDisplayName"),
      email:   document.getElementById("profileEmailTop"),
      icon:    document.getElementById("profileAvatarIcon"),
      img:     document.getElementById("profileAvatarImg"),
      dot:     document.getElementById("profileOnlineDot"),
      card:    document.getElementById("loginCard"),
      details: document.getElementById("profileDetails"),
    };
    if (els.name)    els.name.textContent = "Guest User";
    if (els.email)   els.email.textContent = "Login karein apna account access karne ke liye";
    if (els.dot)     els.dot.style.display = "none";
    if (els.img)     { els.img.style.display = "none"; els.img.src = ""; }
    if (els.icon)    els.icon.style.display = "block";
    if (els.card)    els.card.style.display = "block";
    if (els.details) els.details.classList.add("hidden");
  });
}

// ===== GOOGLE LOGIN =====
window.googleLogin = function() {
  if (!auth) { alert("⚠️ Firebase not ready. Thoda wait karein."); return; }
  signInWithPopup(auth, provider)
    .then(async result => {
      updateProfileUI(result.user);
      await saveUserToFirestore(result.user);
      await loadUserData(result.user);
      if (window.showToast) window.showToast(`✅ Welcome, ${result.user.displayName}!`);
    })
    .catch(error => {
      if (error.code === 'auth/popup-closed-by-user') return;
      if (error.code === 'auth/unauthorized-domain') {
        alert("❌ Domain authorized nahi hai.\nFirebase Console → Authentication → Authorized domains → zenvi-app.github.io add karein.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("⚠️ Popup blocked hai. Browser settings mein allow karein.");
      } else {
        console.error("Login error:", error);
        alert("Login failed: " + error.message);
      }
    });
};

// ===== LOGOUT =====
window.logout = function() {
  if (!auth) return;
  if (!confirm("Logout karna chahte hain?")) return;
  signOut(auth)
    .then(() => {
      resetProfileUI();
      if (window.showToast) window.showToast("👋 Logged out successfully");
    })
    .catch(console.error);
};

// ===== SAVE LOCATION TO FIRESTORE =====
window.saveLocationToCloud = async function(locationData) {
  const user = auth?.currentUser;
  if (!db || !user || !locationData) return;
  try {
    await setDoc(doc(db, "users", user.uid), {
      location: locationData,
      lastLogin: serverTimestamp()
    }, { merge: true });
    console.log("☁️ Location saved to cloud");
  } catch(e) { console.warn("Cloud location save failed:", e); }
};

// ===== AUTH STATE LISTENER =====
if (auth) {
  onAuthStateChanged(auth, async user => {
    if (user) {
      updateProfileUI(user);
      await loadUserData(user);
    } else {
      resetProfileUI();
    }
  });
}

// ===== WIRE UP BUTTONS =====
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("googleLoginBtn")?.addEventListener("click", window.googleLogin);
  document.getElementById("logoutBtn")?.addEventListener("click", window.logout);
});

console.log("🔐 Firebase config loaded ✅");
